import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { CreditCard, Smartphone, MapPin, Package, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface CheckoutPageProps {
  currentUser: any;
  onLogout: () => void;
  cart?: any[];
  onRemoveFromCart?: (productId: string | number) => void;
  onClearCart?: () => void;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function CheckoutPage({ 
  currentUser, 
  onLogout, 
  cart = [], 
  onRemoveFromCart = () => {}, 
  onClearCart = () => {}, 
  accessibilitySettings, 
  onAccessibilityChange 
}: CheckoutPageProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [enableLocationTracking, setEnableLocationTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: currentUser?.name || '',
    address: currentUser?.address || '',
    city: 'Nairobi',
    zipCode: '00100',
    phone: currentUser?.phone || '+254711223344'
  });
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  const shipping = cart.length > 0 ? 5.00 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    if (!cart.length) {
      alert('Your cart is empty. Please add products from the marketplace before checking out.');
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      alert('Please fill in all required shipping address fields');
      return;
    }

    setLoading(true);
    try {
      await api.createOrder({
        items: cart,
        shippingAddress,
        paymentMethod,
        trackingConsent: enableLocationTracking
      });

      setOrderSuccess(true);
      onClearCart();

      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err: any) {
      console.error('Order creation error:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Sidebar selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} />
      
      <div className="flex-1 min-w-0 flex flex-col">
        <Header 
          isLoggedIn={true} 
          currentUser={currentUser} 
          onLogout={onLogout}
          cartItemCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          accessibilitySettings={accessibilitySettings}
          onAccessibilityChange={onAccessibilityChange}
        />

        <main id="main-content" className="p-6" role="main">
          <div className="max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 focus:ring-2 focus:ring-yellow-400"
              aria-label="Go back"
            >
              ← Back to Shopping
            </Button>

            <h1 className="text-[#1e2875] mb-6">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="text-[#1e2875]" aria-hidden="true" />
                      Shipping Address
                    </CardTitle>
                    <CardDescription>Where should we deliver your order?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                        required
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                        required
                        aria-required="true"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                          required
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                          className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                          required
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                        required
                        aria-required="true"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox
                        id="locationTracking"
                        checked={enableLocationTracking}
                        onCheckedChange={(checked) => setEnableLocationTracking(checked as boolean)}
                        className="border-[#1e2875] data-[state=checked]:bg-[#1e2875]"
                      />
                      <Label htmlFor="locationTracking" className="cursor-pointer flex items-center gap-2">
                        <MapPin size={16} className="text-[#1e2875]" aria-hidden="true" />
                        Allow seller to track my location for delivery confirmation
                      </Label>
                    </div>
                    <p className="text-gray-600">
                      This helps ensure accurate delivery and allows you to confirm receipt of your order.
                    </p>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="text-[#1e2875]" aria-hidden="true" />
                      Payment Method
                    </CardTitle>
                    <CardDescription>Select your preferred payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                      <div className="flex items-center space-x-2 border rounded p-4 cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="credit-card" id="credit-card" className="border-[#1e2875]" />
                        <Label htmlFor="credit-card" className="flex-1 cursor-pointer flex items-center gap-2">
                          <CreditCard className="text-[#1e2875]" aria-hidden="true" />
                          Credit/Debit Card
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 border rounded p-4 cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="mobile-money" id="mobile-money" className="border-[#1e2875]" />
                        <Label htmlFor="mobile-money" className="flex-1 cursor-pointer flex items-center gap-2">
                          <Smartphone className="text-[#1e2875]" aria-hidden="true" />
                          Mobile Money (BuyGoods)
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'credit-card' && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              placeholder="123"
                              className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'mobile-money' && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            placeholder="+1234567890"
                            className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                          />
                        </div>
                        <p className="text-gray-600">
                          You will receive a prompt on your phone to complete the payment.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary ({cart.length} item{cart.length === 1 ? '' : 's'})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        Your cart is empty.
                      </div>
                    ) : (
                      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div key={item.id || item._id} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <img 
                              src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=200'} 
                              alt={item.name || item.product} 
                              className="w-14 h-14 object-cover rounded-lg shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.name || item.product}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                              <p className="text-xs font-bold text-[#1e2875]">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(item.id || item._id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span className="font-semibold text-gray-900">${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Estimated Tax (5%)</span>
                        <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between mb-6 text-base font-bold">
                      <span className="text-gray-900">Total Due</span>
                      <span className="text-[#1e2875] text-xl">${total.toFixed(2)}</span>
                    </div>

                    {orderSuccess ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center">
                        <CheckCircle className="mx-auto mb-1 text-emerald-600" size={28} />
                        <p className="font-bold text-sm">Order Placed Successfully!</p>
                        <p className="text-xs mt-0.5">Redirecting to your orders...</p>
                      </div>
                    ) : (
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-[#1e2875] hover:bg-[#2a3490] text-white py-6 rounded-xl font-bold focus:ring-2 focus:ring-yellow-400 shadow-md"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={18} /> Processing Order...
                          </span>
                        ) : (
                          `Confirm & Pay $${total.toFixed(2)}`
                        )}
                      </Button>
                    )}

                    <p className="text-center text-xs text-gray-500 mt-4">
                      Directly empowers special needs artisans with fair-trade returns.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
