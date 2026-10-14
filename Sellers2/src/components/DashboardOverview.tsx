import { ShoppingBag, MessageSquare, Package, TrendingUp, ArrowUp, Tag, HelpCircle, DollarSign, Eye, Users, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import bannerImage from 'figma:asset/575120f8324783dbb6eac73158909b23747d4002.png';

interface DashboardOverviewProps {
  highContrast: boolean;
  stats?: any;
  products?: any[];
  onNavigate?: (page: string) => void;
  onAddProduct?: () => void;
}

export function DashboardOverview({ 
  highContrast, 
  stats, 
  products = [], 
  onNavigate, 
  onAddProduct 
}: DashboardOverviewProps) {
  const activeListings = stats?.activeListings ?? (products?.filter((p: any) => p.status === 'active')?.length || 0);
  const totalEnquiries = stats?.totalEnquiries || 0;
  const thisMonthRevenue = stats?.thisMonthRevenue || 0;
  const profileViews = stats?.profileViews || 0;

  // Resolve recent listings from stats.recentListings or fallback to products prop
  const recentListings: any[] = (stats?.recentListings && stats.recentListings.length > 0)
    ? stats.recentListings
    : (products && products.length > 0)
    ? products.slice(0, 5)
    : [];

  const formatPrice = (price: any) => {
    if (typeof price === 'number') return price.toFixed(2);
    const parsed = parseFloat(price);
    return isNaN(parsed) ? price : parsed.toFixed(2);
  };

  const getProductImage = (product: any) => {
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    if (typeof product.image === 'string' && product.image) {
      return product.image;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner with Image */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        <img 
          src={bannerImage} 
          alt="Connecting Hearts, Empowering Lives - Diverse community including people with disabilities"
          className="h-64 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
          <div className="flex h-full flex-col justify-center px-8">
            <h1 className="mb-2 text-white drop-shadow-lg">Welcome Back!</h1>
            <p className="max-w-xl text-lg text-white/95 drop-shadow-md">
              Connecting Hearts, Empowering Lives - Join our global community of support and opportunity
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards with modern design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`relative overflow-hidden ${highContrast ? 'border-2 border-white bg-black' : 'border-0 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg hover:shadow-xl'} transition-all hover:scale-105`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-100">Active Listings</p>
                <h3 className="mt-2 text-white">{activeListings}</h3>
                <div className="mt-2 flex items-center gap-1 text-sm text-blue-100">
                  <ArrowUp className="h-4 w-4" />
                  <span>Ready to sell</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                <Tag className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        </Card>

        <Card className={`relative overflow-hidden ${highContrast ? 'border-2 border-white bg-black' : 'border-0 bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg hover:shadow-xl'} transition-all hover:scale-105`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-purple-100">Inquiries</p>
                <h3 className="mt-2 text-white">{totalEnquiries}</h3>
                <div className="mt-2 flex items-center gap-1 text-sm text-purple-100">
                  <ArrowUp className="h-4 w-4" />
                  <span>Awaiting response</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                <HelpCircle className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        </Card>

        <Card className={`relative overflow-hidden ${highContrast ? 'border-2 border-white bg-black' : 'border-0 bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-xl'} transition-all hover:scale-105`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-green-100">Total Sales</p>
                <h3 className="mt-2 text-white">${typeof thisMonthRevenue === 'number' ? thisMonthRevenue.toFixed(2) : thisMonthRevenue}</h3>
                <div className="mt-2 flex items-center gap-1 text-sm text-green-100">
                  <ArrowUp className="h-4 w-4" />
                  <span>This month</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                <DollarSign className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        </Card>

        <Card className={`relative overflow-hidden ${highContrast ? 'border-2 border-white bg-black' : 'border-0 bg-gradient-to-br from-orange-500 to-red-500 shadow-lg hover:shadow-xl'} transition-all hover:scale-105`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-orange-100">Profile Views</p>
                <h3 className="mt-2 text-white">{profileViews}</h3>
                <div className="mt-2 flex items-center gap-1 text-sm text-orange-100">
                  <ArrowUp className="h-4 w-4" />
                  <span>This week</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                <Eye className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        </Card>
      </div>

      {/* Recent Activity with modern design */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={`lg:col-span-2 ${highContrast ? 'border-2 border-white bg-black' : 'border-0 shadow-lg'}`}>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>Recent Listings</CardTitle>
              <p className={`mt-1 text-sm ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
                {recentListings.length > 0 
                  ? `Showing ${recentListings.length} latest product${recentListings.length > 1 ? 's' : ''}`
                  : 'Your latest products'}
              </p>
            </div>
            {recentListings.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigate?.('products')} 
                aria-label="View all listings"
                className="gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {recentListings.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-3">
                {recentListings.map((product) => {
                  const imageSrc = getProductImage(product);
                  const productId = product._id || product.id;
                  const views = product.viewCount ?? product.views ?? 0;

                  return (
                    <div
                      key={productId}
                      onClick={() => onNavigate?.('products')}
                      className={`group flex items-center justify-between gap-4 rounded-xl p-3 sm:p-4 transition-all cursor-pointer ${
                        highContrast 
                          ? 'border border-gray-700 hover:border-white hover:bg-gray-900' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {/* Product Image & Info */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative h-16 w-16 sm:h-18 sm:w-18 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                          {product.status && (
                            <Badge
                              className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0"
                              variant={product.status === 'active' ? 'default' : product.status === 'sold' ? 'secondary' : 'outline'}
                            >
                              {product.status}
                            </Badge>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`font-semibold truncate text-base ${highContrast ? 'text-white' : 'text-gray-900 dark:text-gray-100'} group-hover:text-blue-600 transition-colors`}>
                            {product.name}
                          </h4>
                          <p className={`text-xs truncate mt-0.5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                            {product.category || 'General'} {product.description ? `• ${product.description}` : ''}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="font-semibold text-blue-600">
                              ${formatPrice(product.price)}
                            </span>
                            <span className={highContrast ? 'text-gray-400' : 'text-gray-500'}>
                              Stock: {product.stock ?? 1}
                            </span>
                            <span className={`flex items-center gap-1 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Eye className="h-3.5 w-3.5" />
                              {views}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Chevron */}
                      <div className="flex items-center gap-2 pl-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.('products');
                          }}
                        >
                          Manage
                        </Button>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className={`mb-4 rounded-full ${highContrast ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-100 to-purple-100'} p-6`}>
                  <ShoppingBag className={`h-12 w-12 ${highContrast ? 'text-gray-500' : 'text-blue-600'}`} aria-hidden="true" />
                </div>
                <h3 className={`mb-2 font-semibold text-lg ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                  No listings yet
                </h3>
                <p className={`mb-6 max-w-sm text-sm ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                  Start by adding your first product to the marketplace and reach customers worldwide
                </p>
                <Button size="lg" className="shadow-lg gap-2" onClick={onAddProduct}>
                  <Plus className="h-4 w-4" />
                  Add Your First Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className={`${highContrast ? 'border-2 border-white bg-black' : 'border-0 shadow-lg'}`}>
          <CardHeader className="border-b pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <Button 
              variant="outline" 
              className="h-14 w-full justify-start gap-3 hover:border-blue-300 transition-all" 
              size="lg"
              onClick={onAddProduct}
            >
              <div className="rounded-lg bg-blue-100 p-2">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="leading-none font-semibold">Add Product</div>
                <div className="mt-1 text-xs text-gray-500">List new item</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-14 w-full justify-start gap-3 hover:border-purple-300 transition-all" 
              size="lg"
              onClick={() => onNavigate?.('inquiries')}
            >
              <div className="rounded-lg bg-purple-100 p-2">
                <HelpCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="leading-none font-semibold">View Inquiries</div>
                <div className="mt-1 text-xs text-gray-500">Check messages</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-14 w-full justify-start gap-3 hover:border-green-300 transition-all" 
              size="lg"
              onClick={() => onNavigate?.('analytics')}
            >
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="leading-none font-semibold">Analytics</div>
                <div className="mt-1 text-xs text-gray-500">View stats</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={`${highContrast ? 'border-2 border-white bg-black' : 'border-0 shadow-lg'}`}>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              Sales This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl text-blue-600">${typeof thisMonthRevenue === 'number' ? thisMonthRevenue.toFixed(2) : thisMonthRevenue}</div>
                <div className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">+0%</div>
              </div>
              <p className={`text-sm ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                {stats?.thisMonthSales || 0} orders completed this month
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${highContrast ? 'border-2 border-white bg-black' : 'border-0 shadow-lg'}`}>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-green-100 p-2">
                <Users className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              Customer Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl text-green-600">{profileViews}</div>
                <div className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-600">New</div>
              </div>
              <p className={`text-sm ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                People viewed your profile this week
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}