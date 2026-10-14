import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ProductCard from './ProductCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingBag, Sparkles, TrendingUp, Heart, Loader2 } from 'lucide-react';
import heroImage from 'figma:asset/d2fb7d885d1d47742f3ffd01a5bcc98de3caebce.png';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface HomePageProps {
  isLoggedIn: boolean;
  currentUser?: any;
  onLogout: () => void;
  cart?: any[];
  onAddToCart?: (product: any) => void;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function HomePage({ 
  isLoggedIn, 
  currentUser, 
  onLogout, 
  cart = [], 
  onAddToCart = () => {}, 
  accessibilitySettings, 
  onAccessibilityChange 
}: HomePageProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const navigate = useNavigate();

  const cartItemIds = cart.map((item) => String(item.id || item._id));

  // Fetch live products and recommendations from backend
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [prodList, recList] = await Promise.all([
          api.getProducts({ 
            category: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
            search: searchQuery || undefined 
          }),
          api.getRecommendations({ 
            category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
            limit: 4 
          })
        ]);

        if (isMounted) {
          setProducts(Array.isArray(prodList) ? prodList : []);
          setRecommendations(Array.isArray(recList) ? recList : []);
        }
      } catch (err) {
        console.error('Failed to load marketplace products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCategories, searchQuery]);

  const handleSearch = () => {
    // Search is handled reactively via useEffect on searchQuery
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setShowHero(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar 
        selectedCategories={selectedCategories} 
        onCategoryChange={(cats) => {
          setSelectedCategories(cats);
          if (cats.length > 0) setShowHero(false);
        }} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header 
          isLoggedIn={isLoggedIn} 
          currentUser={currentUser} 
          onLogout={onLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          cartItemCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          accessibilitySettings={accessibilitySettings}
          onAccessibilityChange={onAccessibilityChange}
        />

        <main id="main-content" className="p-4 sm:p-6 max-w-7xl mx-auto w-full" role="main">
          {/* Contained Hero Section */}
          {showHero && (
            <section 
              className="relative rounded-2xl overflow-hidden mb-8 shadow-lg bg-[#1e2875] border border-blue-900"
              aria-labelledby="hero-title"
            >
              {/* Subtle Background Pattern */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                  backgroundImage: `url(${heroImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-[#1e2875]/90 to-indigo-950/85"></div>
              
              <div className="relative z-10 p-8 md:p-12 text-center max-w-3xl mx-auto">
                <Badge className="bg-yellow-400 text-indigo-950 font-bold px-3.5 py-1 mb-3 text-xs tracking-wider uppercase shadow-xs">
                  🌟 Empowering Disability Artisans & Special Needs Schools
                </Badge>
                <h1 id="hero-title" className="text-white text-2xl md:text-4xl font-extrabold mb-3 tracking-tight leading-tight">
                  Handcrafted with Heart. Built with Hope.
                </h1>
                <p className="text-blue-100 text-sm md:text-base mb-6 leading-relaxed">
                  Directly discover and support genuine handmade creations, woodwork, beaded jewelry, and textiles crafted by inspiring artisans with disabilities and inclusive schools.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button 
                    onClick={() => {
                      const el = document.getElementById('marketplace-products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-indigo-950 font-bold px-6 py-5 rounded-xl shadow-md transition-transform hover:scale-105 text-sm"
                    aria-label="Start shopping"
                  >
                    <ShoppingBag className="mr-2" size={18} aria-hidden="true" />
                    Explore Marketplace
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/schools')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs px-6 py-5 rounded-xl font-semibold text-sm"
                    aria-label="Learn about schools"
                  >
                    🏫 Partner Schools
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Active Filter Indicators */}
          {(selectedCategories.length > 0 || searchQuery) && (
            <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
                {selectedCategories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="bg-indigo-100 text-[#1e2875] font-medium text-xs px-3 py-1">
                    Category: {cat}
                  </Badge>
                ))}
                {searchQuery && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 font-medium text-xs px-3 py-1">
                    Search: "{searchQuery}"
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50">
                Clear all
              </Button>
            </div>
          )}

          {/* Recommended Section */}
          {recommendations.length > 0 && !searchQuery && (
            <section className="mb-10" aria-labelledby="recommendations-title">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-yellow-500 fill-yellow-500" size={20} />
                  <h2 id="recommendations-title" className="text-lg md:text-xl font-bold text-[#1e2875]">
                    Recommended Artisan Creations
                  </h2>
                </div>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                  AI Boosted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {recommendations.map((product) => {
                  const prodId = String(product._id || product.id);
                  return (
                    <ProductCard
                      key={prodId}
                      product={{ ...product, id: prodId }}
                      isInCart={cartItemIds.includes(prodId)}
                      onAddToCart={onAddToCart}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* All / Filtered Products Grid */}
          <section id="marketplace-products" aria-labelledby="products-title">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-[#1e2875]" size={20} />
                <h2 id="products-title" className="text-lg md:text-xl font-bold text-[#1e2875]">
                  {selectedCategories.length > 0
                    ? `Crafts in ${selectedCategories.join(', ')}`
                    : searchQuery
                    ? `Results for "${searchQuery}"`
                    : 'All Handcrafted Marketplace Items'}
                </h2>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {products.length} {products.length === 1 ? 'item' : 'items'} available
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <Loader2 size={36} className="animate-spin text-[#1e2875]" />
                <p className="text-sm font-medium">Loading authentic artisan creations...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
                <Heart size={44} className="mx-auto mb-3 text-gray-300" />
                <h3 className="text-base font-bold text-gray-800 mb-1">No products found</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                  Try clearing your search query or selecting a different craft category.
                </p>
                <Button onClick={clearFilters} className="bg-[#1e2875] hover:bg-[#2a3490] text-white text-xs px-4 py-2 rounded-lg">
                  View All Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product) => {
                  const prodId = String(product._id || product.id);
                  return (
                    <ProductCard
                      key={prodId}
                      product={{ ...product, id: prodId }}
                      isInCart={cartItemIds.includes(prodId)}
                      onAddToCart={onAddToCart}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}