import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { ShoppingCart } from 'lucide-react';
import Header from './Header';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface SignUpPageProps {
  onSignUp: (user: any) => void;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function SignUpPage({ onSignUp, accessibilitySettings, onAccessibilityChange }: SignUpPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [allowLocation, setAllowLocation] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
        address: formData.address
      });

      if (res.token) {
        localStorage.setItem('token', res.token);
        sessionStorage.setItem('token', res.token);
      }
      const user = res.user || res.buyer || {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'buyer'
      };
      localStorage.setItem('buyer_user', JSON.stringify(user));
      sessionStorage.setItem('buyer_user', JSON.stringify(user));

      onSignUp(user);
      navigate(redirectUrl);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create buyer account.');
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
      <main id="main-content" className="flex items-center justify-center p-4" role="main">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <Link to="/" className="text-[#1e2875] hover:text-[#2a3490] focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded">
              Hands and Hope
            </Link>
          </CardTitle>
          <CardDescription className="text-center">
            Create your buyer account to support disability artisans
          </CardDescription>
        </CardHeader>

        {/* Checkout Redirect Notice */}
        {redirectUrl === '/checkout' && (
          <div className="mx-6 mb-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
            <ShoppingCart className="text-amber-700 shrink-0" size={18} />
            <span><strong>Ready to checkout?</strong> Create your account below to complete your order. Your cart items are saved!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="focus:border-[#1e2875] focus:ring-[#1e2875]"
                aria-required="true"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="location"
                checked={allowLocation}
                onCheckedChange={(checked) => setAllowLocation(checked as boolean)}
                className="border-[#1e2875] data-[state=checked]:bg-[#1e2875] data-[state=checked]:border-[#1e2875]"
              />
              <Label
                htmlFor="location"
                className="cursor-pointer"
              >
                Allow location tracking for order delivery
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-[#1e2875] hover:bg-[#2a3490] text-white focus:ring-2 focus:ring-yellow-400"
            >
              Sign Up
            </Button>

            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-[#1e2875] hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </main>
    </div>
  );
}