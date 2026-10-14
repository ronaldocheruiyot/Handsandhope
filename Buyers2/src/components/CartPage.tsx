import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Trash2, ShoppingBag, ShieldCheck, Heart, Share2, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface CartPageProps {
  isLoggedIn: boolean;
  currentUser?: any;
  onLogout: () => void;
  cart: any[];
  onUpdateQuantity: (productId: string | number, quantity: number) => void;
  onRemoveFromCart: (productId: string | number) => void;
  onClearCart: () => void;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function CartPage({
  isLoggedIn,
  currentUser,
  onLogout,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  accessibilitySettings,
  onAccessibilityChange
}: CartPageProps) {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGiftOrder, setIsGiftOrder] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      try {
        const recs = await api.getRecommendations({ limit: 4 });
        if (isMounted) setRecommendedProducts(recs);
      } catch (e) {
        console.error('Failed to load cart recommendations:', e);
      }
    };
    fetchRecs();
    return () => { isMounted = false; };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  const handleProceedToCheckout = () => {
    if (!cart.length) return;
    if (isLoggedIn) {
      navigate('/checkout');
    } else {
      // Amazon practice: guest user with cart proceeds to checkout -> prompted to sign in with redirect param
      navigate('/login?redirect=/checkout');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Sidebar selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={onLogout}
          cartItemCount={totalItems}
          accessibilitySettings={accessibilitySettings}
          onAccessibilityChange={onAccessibilityChange}
        />

        <main id="main-content" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" role="main">
          {/* Guest Checkout Notice Banner */}
          {!isLoggedIn && cart.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
                  👋
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Shopping as a Guest</h4>
                  <p className="text-xs text-amber-700">
                    Your {totalItems} item{totalItems === 1 ? '' : 's'} are saved in your cart. You can sign in when ready to checkout!
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login?redirect=/cart')}
                  className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/signup?redirect=/cart')}
                  className="bg-[#1e2875] text-white hover:bg-[#2a3490] text-xs font-semibold"
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Cart Items (Amazon Style) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl border-gray-200 shadow-sm bg-white p-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e2875]">Shopping Cart</h1>
                  <span className="hidden sm:inline text-xs text-gray-500 font-bold uppercase tracking-wider">Price</span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-[#1e2875]">
                      <ShoppingBag size={36} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Hands & Hope Cart is empty.</h2>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Explore inspiring handcrafted items made by special needs student artisans and inclusive vocational academies.
                    </p>
                    <div className="pt-2">
                      <Button
                        onClick={() => navigate('/')}
                        className="bg-[#1e2875] hover:bg-[#2a3490] text-white px-6 py-6 rounded-xl font-bold shadow-md"
                      >
                        Explore Marketplace Crafts
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {cart.map((item) => {
                      const itemId = item.id || item._id;
                      return (
                        <div key={itemId} className="py-6 flex flex-col sm:flex-row gap-5 items-start">
                          {/* Item Thumbnail */}
                          <Link to={`/product/${itemId}`} className="shrink-0 group">
                            <img
                              src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300'}
                              alt={item.name}
                              className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl border border-gray-200 group-hover:scale-105 transition-transform duration-200"
                            />
                          </Link>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <Link to={`/product/${itemId}`} className="font-bold text-gray-900 text-base sm:text-lg hover:text-[#1e2875] transition-colors line-clamp-2">
                                {item.name}
                              </Link>
                              <span className="text-[#1e2875] font-extrabold text-lg sm:text-xl shrink-0">
                                ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 font-medium">
                              Crafted by <strong className="text-gray-800">{item.seller || item.sellerName || 'Special Needs Artisan'}</strong>
                            </p>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                In Stock
                              </span>
                              <span className="text-xs text-gray-500">
                                • Eligible for Free Delivery over $50
                              </span>
                            </div>

                            {/* Gift checkbox (Amazon style) */}
                            <div className="flex items-center space-x-2 pt-1">
                              <Checkbox id={`gift-${itemId}`} className="border-gray-400" />
                              <label htmlFor={`gift-${itemId}`} className="text-xs text-gray-600 cursor-pointer">
                                This is a gift <span className="text-gray-400">(add artisan gift packaging)</span>
                              </label>
                            </div>

                            {/* Quantity and Actions Bar (Amazon style) */}
                            <div className="flex flex-wrap items-center gap-3 pt-3">
                              {/* Quantity Selector */}
                              <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = item.quantity || 1;
                                    if (curr <= 1) {
                                      onRemoveFromCart(itemId);
                                    } else {
                                      onUpdateQuantity(itemId, curr - 1);
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-200 font-bold text-sm shadow-2xs cursor-pointer"
                                  title={item.quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                                >
                                  {item.quantity === 1 ? <Trash2 size={13} className="text-red-500" /> : '-'}
                                </button>
                                <span className="px-3 text-xs font-bold text-gray-900">{item.quantity || 1}</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(itemId, (item.quantity || 1) + 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-200 font-bold text-sm shadow-2xs cursor-pointer"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              <span className="text-gray-300">|</span>

                              <button
                                type="button"
                                onClick={() => onRemoveFromCart(itemId)}
                                className="text-xs text-blue-700 hover:text-red-600 hover:underline font-medium cursor-pointer"
                              >
                                Delete
                              </button>

                              <span className="text-gray-300">|</span>

                              <button
                                type="button"
                                onClick={() => alert(`Saved "${item.name}" for later!`)}
                                className="text-xs text-blue-700 hover:underline font-medium cursor-pointer"
                              >
                                Save for later
                              </button>

                              <span className="text-gray-300">|</span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(`${window.location.origin}/product/${itemId}`);
                                    alert('Product link copied to clipboard!');
                                  }
                                }}
                                className="text-xs text-gray-500 hover:text-gray-800 hover:underline font-medium cursor-pointer"
                              >
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom subtotal bar */}
                    <div className="pt-4 text-right">
                      <p className="text-base sm:text-lg text-gray-800">
                        Subtotal ({totalItems} item{totalItems === 1 ? '' : 's'}):{' '}
                        <strong className="text-[#1e2875] text-xl">${subtotal.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              <div className="flex justify-between items-center px-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-[#1e2875] text-xs font-semibold"
                >
                  ← Continue Shopping
                </Button>

                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={onClearCart}
                    className="text-gray-400 hover:text-red-600 text-xs"
                  >
                    Clear Cart
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column: Amazon-Style Checkout Card */}
            {cart.length > 0 && (
              <div className="space-y-4">
                <Card className="rounded-2xl border-gray-200 shadow-md bg-white p-6 sticky top-24">
                  <CardContent className="p-0 space-y-4">
                    {/* Subtotal Header */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        Subtotal ({totalItems} item{totalItems === 1 ? '' : 's'}):{' '}
                        <span className="text-[#1e2875] font-extrabold">${subtotal.toFixed(2)}</span>
                      </h3>
                    </div>

                    {/* Gift Option Checkbox */}
                    <div className="flex items-center space-x-2.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Checkbox
                        id="order-gift"
                        checked={isGiftOrder}
                        onCheckedChange={(c) => setIsGiftOrder(c as boolean)}
                        className="border-gray-400"
                      />
                      <label htmlFor="order-gift" className="text-xs font-medium text-gray-700 cursor-pointer">
                        This order contains a gift
                      </label>
                    </div>

                    {/* Big Yellow/Gold Proceed to Checkout Button */}
                    <Button
                      onClick={handleProceedToCheckout}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#1e2875] text-base font-extrabold py-6 rounded-xl shadow-md transition-all active:scale-[0.99]"
                    >
                      Proceed to checkout
                    </Button>

                    {!isLoggedIn && (
                      <p className="text-center text-[11px] text-gray-500">
                        You will be asked to sign in or create an account to enter delivery details.
                      </p>
                    )}

                    <Separator className="my-4" />

                    {/* Fair Trade & Social Impact Trust Badge */}
                    <div className="space-y-2.5 text-xs text-gray-600 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
                      <div className="flex items-center gap-2 text-[#1e2875] font-bold">
                        <ShieldCheck size={18} className="text-emerald-600" />
                        <span>Hands & Hope Fair-Trade Guarantee</span>
                      </div>
                      <p className="leading-relaxed text-[11px]">
                        100% of proceeds go directly to empowering student artisans with disabilities and supporting inclusive educational workshops.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Recommended Products Carousel */}
          {recommendedProducts.length > 0 && (
            <section aria-labelledby="cart-recs-title" className="mt-14 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={22} />
                  <h2 id="cart-recs-title" className="text-xl sm:text-2xl font-bold text-[#1e2875]">
                    Recommended Based on Your Cart
                  </h2>
                </div>
                <Link to="/" className="text-xs font-bold text-[#1e2875] hover:underline flex items-center gap-1">
                  View all crafts <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {recommendedProducts.map((rec) => (
                  <Card
                    key={rec.id || rec._id}
                    className="overflow-hidden hover:shadow-lg transition-all rounded-2xl border-gray-200 cursor-pointer flex flex-col justify-between"
                    onClick={() => navigate(`/product/${rec.id || rec._id}`)}
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden relative">
                      <img
                        src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300'}
                        alt={rec.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {rec.recommendationReason && (
                        <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px]">
                          ✨ {rec.recommendationReason}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-1">
                      <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">{rec.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">By {rec.seller || rec.sellerName || 'Artisan'}</p>
                      <p className="text-[#1e2875] font-bold text-sm mt-1">${Number(rec.price).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
