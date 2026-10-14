import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ShoppingCart } from 'lucide-react';
import Header from './Header';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface LoginPageProps {
  onLogin: (user: any) => void;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function LoginPage({ onLogin, accessibilitySettings, onAccessibilityChange }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError('');
    setLoading(true);

    try {
      const response = await api.login(quickEmail, quickPass);
      localStorage.setItem('token', response.token);
      sessionStorage.setItem('token', response.token);
      const user = response.user || response.buyer;
      localStorage.setItem('buyer_user', JSON.stringify(user));
      sessionStorage.setItem('buyer_user', JSON.stringify(user));
      onLogin(user);
      navigate(redirectUrl);
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError(err.message || 'Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await api.login(email, password);
      
      // Save token to storage
      localStorage.setItem('token', response.token);
      sessionStorage.setItem('token', response.token);
      
      const user = response.user || response.buyer;
      localStorage.setItem('buyer_user', JSON.stringify(user));
      sessionStorage.setItem('buyer_user', JSON.stringify(user));
      onLogin(user);
      navigate(redirectUrl);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message && err.message.includes('400')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.message && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please ensure backend is running on port 5000.');
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isLoggedIn={false} 
        onLogout={() => {}}
        accessibilitySettings={accessibilitySettings}
        onAccessibilityChange={onAccessibilityChange}
      />
      <main id="main-content" className="flex items-center justify-center p-4 py-8" role="main">
        <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle className="text-center">
            <Link to="/" className="text-[#1e2875] text-2xl font-bold hover:text-[#2a3490] focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded">
              Hands and Hope
            </Link>
          </CardTitle>
          <CardDescription className="text-center">
            Login to your buyer account to support disability artisans
          </CardDescription>
        </CardHeader>

        {/* Checkout Redirect Notice */}
        {redirectUrl === '/checkout' && (
          <div className="mx-6 mb-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
            <ShoppingCart className="text-amber-700 shrink-0" size={18} />
            <span><strong>Ready to checkout?</strong> Sign in below or use a 1-click test account. Your cart is preserved!</span>
          </div>
        )}

        {/* Quick Demo Login Box */}
        <div className="mx-6 p-4 rounded-lg bg-indigo-50 border border-indigo-200 mb-2">
          <p className="text-xs font-semibold text-indigo-900 mb-2 uppercase tracking-wide">
            ⚡ Quick Test Buyer Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickLogin('david.buyer@example.com', 'Password123!')}
              className="bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-300 text-xs py-1.5 h-auto font-medium"
            >
              👤 David Buyer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickLogin('jane.buyer@example.com', 'Password123!')}
              className="bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-300 text-xs py-1.5 h-auto font-medium"
            >
              👤 Jane Customer
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email (e.g. david.buyer@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                aria-required="true"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password (Password123!)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                aria-required="true"
                disabled={loading}
              />
            </div>

            <button
              type="button"
              className="text-sm text-[#1e2875] underline"
              disabled={loading || !email}
              onClick={async () => {
                setError('');
                setInfo('');
                try {
                  const result = await api.requestPasswordReset(email);
                  setInfo(result.message);
                } catch (err: any) {
                  setError(err.message || 'Could not request a password reset.');
                }
              }}
            >
              Forgot password? Ask an administrator to reset it
            </button>
            {info && (
              <Alert>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-[#1e2875] hover:bg-[#2a3490] text-white focus:ring-2 focus:ring-yellow-400 py-2.5 font-semibold"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>

            <p className="text-center text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                to={`/signup${location.search || ''}`} 
                className="text-[#1e2875] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </main>
    </div>
  );
}