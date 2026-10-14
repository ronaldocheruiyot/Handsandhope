import React, { useState, useEffect } from 'react';
import { Users, Activity, Package, MessageSquare, DollarSign, BarChart3, ChevronDown, UserCheck, Shield, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { CaregiverSidebar } from './CaregiverSidebar';
import { DashboardHeader } from './DashboardHeader';
import { ProductsPage } from './ProductsPage';
import { InquiriesPage } from './InquiriesPage';
import { NotificationsPage } from './NotificationsPage';
import { CaregiverProfilePage } from './CaregiverProfilePage';
import { SettingsPage } from './SettingsPage';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface ManagedAccount {
  accountId: string;
  accountType: 'individual_seller' | 'student_seller';
  accountOwnerName: string;
  accountOwnerEmail: string;
  phone?: string;
  bio?: string;
  location?: string;
  profilePhoto?: string;
  schoolName?: string;
  permissionLevel: string;
  permissions: {
    viewProfile: boolean;
    editProfile: boolean;
    viewProducts: boolean;
    manageProducts: boolean;
    respondToInquiries: boolean;
    viewFinancials: boolean;
    withdrawMoney: boolean;
    manageShipments: boolean;
    viewAnalytics: boolean;
    editBio: boolean;
    editStoreName: boolean;
  };
  status: 'active' | 'pending' | 'revoked';
  stats: {
    totalProducts: number;
    totalSales: number;
    totalEarnings: number;
    pendingInquiries: number;
  };
}

interface CaregiverUser {
  fullName: string;
  email: string;
  phone?: string;
  relationshipType?: string;
  managedAccounts: ManagedAccount[];
}

interface CaregiverDashboardProps {
  onLogout: () => void;
}

export function CaregiverDashboard({ onLogout }: CaregiverDashboardProps) {
  const { user, token } = useAuth();
  const [currentUser, setCurrentUser] = useState<CaregiverUser>({
    fullName: user?.name || 'Maria Garcia Caregiver',
    email: user?.email || 'caregiver@handsandhope.org',
    relationshipType: 'Parent / Guardian',
    managedAccounts: []
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCaregiverData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await api.getCaregiverAccounts(token);
      if (data) {
        setCurrentUser(prev => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          email: data.email || prev.email,
          managedAccounts: data.managedAccounts || []
        }));

        if (data.managedAccounts && data.managedAccounts.length > 0) {
          if (!selectedAccountId || !data.managedAccounts.some((a: any) => a.accountId === selectedAccountId)) {
            setSelectedAccountId(data.managedAccounts[0].accountId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load caregiver managed accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregiverData();
  }, [token]);

  const selectedAccount = currentUser.managedAccounts.find(acc => acc.accountId === selectedAccountId) || currentUser.managedAccounts[0];

  const sidebarNavigation = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: Activity,
      description: 'Account summary and quick actions'
    },
    ...(selectedAccount?.permissions.viewProducts ? [{
      id: 'products',
      label: 'Products',
      icon: Package,
      description: 'Manage product listings',
      disabled: !selectedAccount?.permissions.manageProducts && !selectedAccount?.permissions.viewProducts
    }] : []),
    ...(selectedAccount?.permissions.respondToInquiries ? [{
      id: 'inquiries',
      label: 'Inquiries',
      icon: MessageSquare,
      description: 'Respond to buyer messages',
      badge: selectedAccount?.stats.pendingInquiries
    }] : []),
    ...(selectedAccount?.permissions.viewFinancials ? [{
      id: 'financials',
      label: 'Financials',
      icon: DollarSign,
      description: 'View earnings and transactions'
    }] : []),
    ...(selectedAccount?.permissions.viewAnalytics ? [{
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'View performance metrics'
    }] : []),
    {
      id: 'my-activity',
      label: 'My Activity',
      icon: Clock,
      description: 'Your action history'
    },
    {
      id: 'my-profile',
      label: 'My Profile',
      icon: UserCheck,
      description: 'Your caregiver profile'
    }
  ];

  const renderPage = () => {
    if (!selectedAccount) {
      return (
        <div className="p-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="size-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              No managed accounts found. Please ensure a student or seller has linked you as their caregiver.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    switch (currentPage) {
      case 'overview':
        return (
          <CaregiverOverviewPage 
            account={selectedAccount} 
            caregiver={currentUser} 
            onNavigate={(page) => setCurrentPage(page)}
            onRefresh={fetchCaregiverData}
          />
        );
      case 'products':
        return selectedAccount.permissions.viewProducts ? (
          <ProductsPage 
            canManage={selectedAccount.permissions.manageProducts} 
            targetAccountId={selectedAccount.accountId}
            accountOwnerName={selectedAccount.accountOwnerName}
            userRole="caregiver"
          />
        ) : null;
      case 'inquiries':
        return selectedAccount.permissions.respondToInquiries ? (
          <InquiriesPage 
            canRespond={selectedAccount.permissions.respondToInquiries} 
            targetAccountId={selectedAccount.accountId}
            accountOwnerName={selectedAccount.accountOwnerName}
          />
        ) : null;
      case 'financials':
        return selectedAccount.permissions.viewFinancials ? (
          <FinancialsPage account={selectedAccount} />
        ) : null;
      case 'analytics':
        return selectedAccount.permissions.viewAnalytics ? (
          <AnalyticsPage account={selectedAccount} />
        ) : null;
      case 'my-activity':
        return <MyActivityPage caregiver={currentUser} />;
      case 'my-profile':
        return <CaregiverProfilePage />;
      default:
        return (
          <CaregiverOverviewPage 
            account={selectedAccount} 
            caregiver={currentUser} 
            onNavigate={(page) => setCurrentPage(page)}
            onRefresh={fetchCaregiverData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        accountType="caregiver"
        userName={currentUser.fullName}
        onLogout={onLogout}
      />

      <div className="flex">
        <CaregiverSidebar
          navigation={sidebarNavigation}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />

        <main className="flex-1 p-6">
          {/* Account Selector */}
          <div className="mb-6">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Managing Account For:</Label>
                  <Select value={selectedAccountId || selectedAccount?.accountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="w-80 mt-1">
                      <SelectValue placeholder="Select student/seller" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUser.managedAccounts.map((account) => (
                        <SelectItem key={account.accountId} value={account.accountId}>
                          <div className="flex items-center gap-2">
                            <UserCheck className="size-4 text-blue-600" />
                            <span className="font-medium">{account.accountOwnerName}</span>
                            <Badge variant="outline" className="text-xs">
                              {account.accountType === 'student_seller' ? 'Student' : 'Seller'}
                            </Badge>
                            {account.schoolName && (
                              <span className="text-xs text-gray-500">• {account.schoolName}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAccount && (
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={fetchCaregiverData} className="gap-1 text-gray-500 hover:text-gray-900">
                      <RefreshCw className="size-4" /> Refresh Data
                    </Button>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Permission Level</div>
                      <Badge className="mt-1 capitalize bg-blue-600 text-white">
                        <Shield className="size-3 mr-1" />
                        {selectedAccount.permissionLevel.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {selectedAccount && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  <div className="text-xs font-semibold text-gray-500 w-full mb-1">Active Capabilities:</div>
                  {selectedAccount.permissions.manageProducts && (
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border border-green-200">✓ Manage Products</Badge>
                  )}
                  {selectedAccount.permissions.respondToInquiries && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">✓ Respond to Inquiries</Badge>
                  )}
                  {selectedAccount.permissions.viewFinancials && (
                    <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border border-purple-200">✓ View Financials</Badge>
                  )}
                  {selectedAccount.permissions.withdrawMoney && (
                    <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border border-amber-200">✓ Withdraw Money</Badge>
                  )}
                  {selectedAccount.permissions.manageShipments && (
                    <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">✓ Manage Shipments</Badge>
                  )}
                  {selectedAccount.permissions.editProfile && (
                    <Badge variant="secondary" className="text-xs bg-rose-50 text-rose-700 border border-rose-200">✓ Edit Profile</Badge>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Page Content */}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function CaregiverOverviewPage({ 
  account, 
  caregiver, 
  onNavigate,
  onRefresh
}: { 
  account: ManagedAccount; 
  caregiver: CaregiverUser; 
  onNavigate?: (page: string) => void;
  onRefresh?: () => void;
}) {
  const { token } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!token) return;
    try {
      setIsSeeding(true);
      const res = await api.seedSampleData(token, account.accountId);
      alert(res.message || 'Store data successfully synced in database!');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error generating sample data:', err);
      alert(err.message || 'Failed to sync store data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome, {caregiver.fullName}
            </h1>
            <p className="text-blue-100 text-sm">
              You are managing the store and accessibility operations for <strong>{account.accountOwnerName}</strong>
              {account.schoolName && <span> ({account.schoolName})</span>}.
            </p>
          </div>
          <Button
            onClick={handleSeedData}
            disabled={isSeeding}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shrink-0"
          >
            <span>🎲</span> {isSeeding ? 'Generating...' : 'Sync / Seed Store Data'}
          </Button>
        </div>
      </Card>

      {/* Important Notice */}
      <Alert className="border-blue-200 bg-blue-50/80">
        <Shield className="size-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Accountability Notice:</strong> All actions you perform (adding products, answering inquiries, modifying items) are logged with audit trails visible to {account.accountOwnerName}
          {account.accountType === 'student_seller' && ', their teacher, and school administrator'}.
        </AlertDescription>
      </Alert>

      {/* Account Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="p-5 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onNavigate && onNavigate('products')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Products</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{account.stats.totalProducts}</p>
              <p className="text-xs text-blue-600 mt-1">Manage listings →</p>
            </div>
            <div className="size-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <Package className="size-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Orders</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{account.stats.totalSales}</p>
              <p className="text-xs text-green-600 mt-1">Verified sales</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 className="size-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {account.permissions.viewFinancials && (
          <Card 
            className="p-5 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onNavigate && onNavigate('financials')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">${account.stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-emerald-600 mt-1">View finances →</p>
              </div>
              <div className="size-11 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign className="size-6 text-green-600" />
              </div>
            </div>
          </Card>
        )}

        {account.permissions.respondToInquiries && (
          <Card 
            className="p-5 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onNavigate && onNavigate('inquiries')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Inquiries</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{account.stats.pendingInquiries}</p>
                <p className="text-xs text-orange-600 mt-1">Reply to buyers →</p>
              </div>
              <div className="size-11 rounded-xl bg-orange-50 flex items-center justify-center">
                <MessageSquare className="size-6 text-orange-600" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions for {account.accountOwnerName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {account.permissions.manageProducts && (
            <Button 
              className="h-20 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              onClick={() => onNavigate && onNavigate('products')}
            >
              <Package className="size-5" />
              <span className="font-semibold text-sm">Add / Manage Products</span>
            </Button>
          )}
          {account.permissions.respondToInquiries && (
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-blue-200 hover:bg-blue-50 text-blue-700"
              onClick={() => onNavigate && onNavigate('inquiries')}
            >
              <MessageSquare className="size-5" />
              <span className="font-semibold text-sm">Inquiries Inbox ({account.stats.pendingInquiries})</span>
            </Button>
          )}
          {account.permissions.viewFinancials && (
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-green-200 hover:bg-green-50 text-green-700"
              onClick={() => onNavigate && onNavigate('financials')}
            >
              <DollarSign className="size-5" />
              <span className="font-semibold text-sm">Store Financials (${account.stats.totalEarnings.toFixed(2)})</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Permission Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Permission Capabilities Matrix</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(account.permissions).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className={`size-5 rounded-full flex items-center justify-center text-xs font-bold ${value ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {value ? '✓' : '✗'}
              </div>
              <span className={`text-xs capitalize font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FinancialsPage({ account }: { account: ManagedAccount }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financials - {account.accountOwnerName}</h1>
          <p className="text-sm text-gray-500">Live store balances and transaction accounts</p>
        </div>
        {account.permissions.withdrawMoney && (
          <Button className="bg-emerald-600 text-white gap-2">
            <DollarSign className="size-4" />
            Request Withdrawal
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available Balance</p>
          <p className="text-3xl font-bold mt-2 text-emerald-600">${account.stats.totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-emerald-700 mt-2 font-medium">Ready for withdrawal to verified account</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales Volume</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">${(account.stats.totalEarnings * 1.25).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">{account.stats.totalSales} units delivered</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Orders</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">$0.00</p>
          <p className="text-xs text-gray-500 mt-2">All current orders finalized</p>
        </Card>
      </div>

      {!account.permissions.withdrawMoney && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="size-4 text-amber-600" />
          <AlertDescription className="text-amber-900 text-sm">
            You can view financial information for {account.accountOwnerName} but cannot initiate fund withdrawals without withdrawal permission.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function AnalyticsPage({ account }: { account: ManagedAccount }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store Analytics - {account.accountOwnerName}</h1>
        <p className="text-sm text-gray-500">Performance insights, buyer reach, and craft demand metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-md font-semibold mb-2">Sales Breakdown</h3>
          <p className="text-sm text-gray-600">Total verified orders: {account.stats.totalSales}</p>
          <p className="text-sm text-gray-600 mt-1">Total revenue: ${account.stats.totalEarnings.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-md font-semibold mb-2">Product Catalog</h3>
          <p className="text-sm text-gray-600">Active listings: {account.stats.totalProducts}</p>
          <p className="text-sm text-gray-600 mt-1">Inquiry response rate: 100%</p>
        </Card>
      </div>
    </div>
  );
}

function MyActivityPage({ caregiver }: { caregiver: CaregiverUser }) {
  const { token } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const logs = await api.getCaregiverActivities(token);
        setActivities(logs || []);
      } catch (err) {
        console.error('Failed to load caregiver activity log:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Caregiver Audit & Action Log</h1>
        <p className="text-sm text-gray-600 mt-1">
          Complete, verifiable audit trail of all products, inquiries, and store modifications you performed.
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-gray-500">Loading audit log...</Card>
      ) : activities.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Clock className="size-10 text-gray-300 mx-auto mb-2" />
          <p className="font-medium">No actions logged yet.</p>
          <p className="text-xs text-gray-400 mt-1">Whenever you add a product, update a listing, or reply to an inquiry, it will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {activity.action}
                    </Badge>
                    <span className="text-xs font-semibold text-gray-700">For: {activity.account}</span>
                  </div>
                  <p className="text-sm text-gray-800">{activity.details}</p>
                </div>
                <div className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                  <Clock className="size-3" />
                  {activity.timestamp}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

