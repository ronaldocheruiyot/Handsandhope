import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, CreditCard, Package, DollarSign, MapPin, Edit, MessageSquare, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface ProfilePageProps {
  currentUser: any;
  onLogout: () => void;
  onProfileUpdate?: (user: any) => void;
  cart?: any[];
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

const paymentMethods = [
  { id: 1, type: 'Credit Card', last4: '4242', expiry: '12/26', brand: 'Visa' },
  { id: 2, type: 'Mobile Money', number: '+254711223344', provider: 'M-Pesa / BuyGoods' }
];

export default function ProfilePage({ currentUser, onLogout, onProfileUpdate, cart = [], accessibilitySettings, onAccessibilityChange }: ProfilePageProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || currentUser?.phoneNumber || '',
    address: currentUser?.address || ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchBuyerData = async () => {
      setLoading(true);
      try {
        const [ordersData, inquiriesData, profile] = await Promise.all([
          api.getBuyerOrders(),
          api.getBuyerInquiries(),
          api.getProfile().catch(() => null)
        ]);
        if (isMounted) {
          setOrders(Array.isArray(ordersData) ? ordersData : []);
          setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
          if (profile) {
            setFormData({
              name: profile.name || currentUser?.name || '',
              email: profile.email || currentUser?.email || '',
              phone: profile.phone || profile.phoneNumber || currentUser?.phone || '',
              address: profile.address || currentUser?.address || ''
            });
          }
        }
      } catch (err) {
        console.error('Failed to load buyer orders & inquiries:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBuyerData();
    return () => { isMounted = false; };
  }, []);

  const totalSpent = orders.reduce((sum, item) => sum + (Number(item.price || item.amount) * (item.quantity || 1)), 0);
  const deliveredOrders = orders.filter(o => o.status === 'Delivered' || o.rawStatus === 'completed');
  const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.rawStatus !== 'completed');

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await api.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      const nextUser = { ...(currentUser || {}), ...updated, phone: updated.phone || formData.phone };
      onProfileUpdate?.(nextUser);
      setSaveMessage('Profile saved.');
    } catch (err: any) {
      setSaveMessage(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setSaveMessage('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setSaveMessage('Enter your current password and a new password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveMessage('New passwords do not match.');
      return;
    }
    try {
      await api.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveMessage('Password updated.');
    } catch (err: any) {
      setSaveMessage(err.message || 'Could not update password.');
    }
  };

  const handleTrackOrder = (orderId: string) => {
    setTrackedOrderId(trackedOrderId === orderId ? null : orderId);
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

        <main id="main-content" className="p-6 max-w-6xl mx-auto" role="main">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1e2875] mb-1">
                Welcome back, {currentUser?.name || 'Customer'}!
              </h1>
              <p className="text-gray-600 text-sm">Manage your account, track orders, and view artisan conversations</p>
            </div>
            <Badge className="bg-emerald-600 text-white px-3 py-1.5 w-fit">
              🌟 Active Community Patron
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#1e2875]" size={36} />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white border p-1 rounded-xl shadow-sm" role="tablist" aria-label="Profile sections">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Purchase History ({deliveredOrders.length})</TabsTrigger>
                <TabsTrigger value="pending">Active Orders ({pendingOrders.length})</TabsTrigger>
                <TabsTrigger value="inquiries">Messages & Inquiries ({inquiries.length})</TabsTrigger>
                <TabsTrigger value="settings">Settings & Address</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <Card className="rounded-2xl border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Orders</p>
                          <p className="text-[#1e2875] text-2xl font-bold">{orders.length}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl text-[#1e2875]">
                          <Package size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Contribution</p>
                          <p className="text-[#1e2875] text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                          <DollarSign size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Active Deliveries</p>
                          <p className="text-[#1e2875] text-2xl font-bold">{pendingOrders.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                          <Truck size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Artisan Inquiries</p>
                          <p className="text-[#1e2875] text-2xl font-bold">{inquiries.length}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                          <MessageSquare size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No orders placed yet. Explore the marketplace to find handcrafted items!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 4).map((order) => (
                          <div key={order.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <img src={order.image} alt={order.product} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{order.product}</p>
                              <p className="text-xs text-gray-500">Order Date: {order.date}</p>
                              <p className="text-xs text-gray-400">Tracking: {order.trackingNumber}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[#1e2875] font-bold mb-1">${Number(order.price).toFixed(2)}</p>
                              <Badge className={order.status === 'Delivered' ? 'bg-emerald-600' : 'bg-blue-600'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Purchase History Tab */}
              <TabsContent value="orders" className="space-y-4">
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Delivered Purchases</CardTitle>
                    <CardDescription>All completed orders delivered to your address</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deliveredOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No completed orders yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deliveredOrders.map((order) => (
                          <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-white shadow-sm">
                            <div className="flex items-center gap-4">
                              <img src={order.image} alt={order.product} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                              <div>
                                <p className="font-bold text-gray-900">{order.product}</p>
                                <p className="text-xs text-gray-500">Delivered on {order.date}</p>
                                <p className="text-xs text-emerald-700 font-medium mt-1">✓ Artisan: {order.seller}</p>
                                <Badge className="mt-2 bg-emerald-600 text-xs">Delivered</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[#1e2875] font-extrabold text-lg mb-2">${Number(order.price).toFixed(2)}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/')}
                                className="border-[#1e2875] text-[#1e2875] text-xs font-medium"
                              >
                                Reorder / Review
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pending Orders Tab */}
              <TabsContent value="pending" className="space-y-4">
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Active Deliveries & Processing</CardTitle>
                    <CardDescription>Track items being crafted and shipped by artisans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No active orders right now.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingOrders.map((order) => (
                          <div key={order.id} className="p-5 border rounded-2xl bg-white shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                              <img src={order.image} alt={order.product} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{order.product}</p>
                                <p className="text-xs text-gray-500">Ordered: {order.date}</p>
                                <p className="text-xs text-gray-600 mt-0.5">Shipping to: {order.shippingAddress}</p>
                                <Badge className="mt-2 bg-blue-600 text-xs">{order.status}</Badge>
                              </div>
                              <p className="text-[#1e2875] font-extrabold text-xl">${Number(order.price).toFixed(2)}</p>
                            </div>
                            <Separator className="my-3" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                              <div>
                                <span className="text-xs text-gray-500">Tracking Reference: </span>
                                <span className="font-mono font-bold text-gray-800">{order.trackingNumber}</span>
                              </div>
                              <Button
                                onClick={() => handleTrackOrder(order.id)}
                                className="bg-[#1e2875] hover:bg-[#2a3490] text-white text-xs h-9 px-4 rounded-lg"
                              >
                                <MapPin className="mr-1.5" size={14} /> Track Delivery
                              </Button>
                            </div>
                            {trackedOrderId === order.id && (
                              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-gray-800">
                                <p className="font-semibold text-[#1e2875] mb-1">Shipment {order.trackingNumber}</p>
                                <p>Status: {order.status}</p>
                                <p>Seller: {order.seller || order.sellerName}</p>
                                <p>Ship to: {order.shippingAddress}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inquiries Tab */}
              <TabsContent value="inquiries" className="space-y-4">
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Your Conversations with Artisans</CardTitle>
                    <CardDescription>Questions and custom order discussions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inquiries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        You haven't sent any inquiries yet. Click "Message Artisan" on any product page to chat!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {inquiries.map((inq) => (
                          <div key={inq._id} className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1e2875] text-sm">{inq.productName || 'Handcrafted Craft'}</span>
                              <Badge className={inq.status === 'replied' ? 'bg-emerald-600' : 'bg-amber-500'}>
                                {inq.status === 'replied' ? 'Replied by Artisan' : 'Pending Response'}
                              </Badge>
                            </div>
                            <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                              💬 <strong>You:</strong> "{inq.message}"
                            </p>
                            {inq.replies && inq.replies.length > 0 && (
                              <div className="pl-4 border-l-2 border-[#1e2875] space-y-2">
                                {inq.replies.map((rep: any, rIdx: number) => (
                                  <div key={rIdx} className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-sm">
                                    <p className="font-bold text-[#1e2875] text-xs mb-1">
                                      🎨 Artisan Response ({new Date(rep.timestamp).toLocaleDateString()}):
                                    </p>
                                    <p className="text-gray-800">{rep.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Personal Details & Delivery Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={formData.email}
                          disabled
                          className="mt-1 bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Default Delivery Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-[#1e2875] text-white">
                      {saving ? 'Saving...' : 'Save Profile Updates'}
                    </Button>
                    {saveMessage && <p className="text-sm text-gray-700">{saveMessage}</p>}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button onClick={handlePasswordSave} variant="outline">Update Password</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
