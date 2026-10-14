import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import AccessibilityMenu, { AccessibilitySettings } from './AccessibilityMenu';

interface HeaderProps {
  isLoggedIn: boolean;
  currentUser?: any;
  onLogout: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: () => void;
  cartItemCount?: number;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function Header({ 
  isLoggedIn, 
  currentUser, 
  onLogout, 
  searchQuery = '', 
  onSearchChange = () => {}, 
  onSearch = () => {},
  cartItemCount = 0,
  accessibilitySettings,
  onAccessibilityChange
}: HeaderProps) {
  const navigate = useNavigate();
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#1e2875] focus:text-white focus:rounded focus:ring-2 focus:ring-yellow-400"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50" role="banner">
        <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded">
          <h1 className="text-[#1e2875]">Hands and Hope</h1>
        </Link>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-8" role="search">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-4 pr-12 py-2 w-full border-gray-300 focus:border-[#1e2875] focus:ring-[#1e2875]"
              aria-label="Search products"
            />
            <Button
              type="submit"
              className="absolute right-0 top-0 h-full px-4 bg-[#1e2875] hover:bg-[#2a3490] text-white rounded-l-none"
              aria-label="Search"
            >
              <Search size={20} aria-hidden="true" />
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-700 hover:text-[#1e2875] focus:ring-2 focus:ring-yellow-400 rounded-full w-12 h-12"
            aria-label="Accessibility settings"
          >
            <SettingsIcon size={20} aria-hidden="true" />
          </Button>

          <button
            onClick={() => setIsAccessibilityMenuOpen(!isAccessibilityMenuOpen)}
            className="fixed bottom-4 right-4 bg-yellow-400 text-[#1e2875] rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-yellow-500 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-yellow-600 z-50 transition-all duration-300 animate-pulse"
            aria-label="Toggle accessibility menu"
            aria-expanded={isAccessibilityMenuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9" aria-hidden="true">
              <path d="M12 2a2 2 0 100 4 2 2 0 000-4zM8.5 8a1.5 1.5 0 00-1.5 1.5V14a1 1 0 01-2 0V9.5a3.5 3.5 0 013-3.465A3.5 3.5 0 0111.5 3h1a3.5 3.5 0 013.5 3.5V14a1 1 0 11-2 0V9.5A1.5 1.5 0 0012.5 8h-1a1.5 1.5 0 00-1.5 1.5V18l2.5 4a1 1 0 11-1.714 1.028L8 18.618l-2.786 4.41A1 1 0 013.5 22l2.5-4V9.5A1.5 1.5 0 018.5 8z"/>
            </svg>
          </button>

          {/* Accessibility Menu */}
          {accessibilitySettings && onAccessibilityChange && (
            <AccessibilityMenu
              isOpen={isAccessibilityMenuOpen}
              onClose={() => setIsAccessibilityMenuOpen(false)}
              settings={accessibilitySettings}
              onSettingsChange={onAccessibilityChange}
            />
          )}

          {/* Shopping Cart Button (Always visible to both guests & logged-in buyers) */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-700 hover:text-[#1e2875] focus:ring-2 focus:ring-yellow-400 rounded-full cursor-pointer"
            onClick={() => navigate('/cart')}
            aria-label={`Shopping cart with ${cartItemCount} items`}
          >
            <ShoppingCart size={22} aria-hidden="true" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow animate-scale" aria-hidden="true">
                {cartItemCount}
              </span>
            )}
          </Button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Direct Profile Button */}
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 bg-indigo-50/80 hover:bg-indigo-100/80 text-[#1e2875] px-3 py-1.5 rounded-full border border-indigo-200 text-xs sm:text-sm font-semibold transition-all focus:ring-2 focus:ring-yellow-400 cursor-pointer"
                title="View My Profile & Purchases"
              >
                <div className="w-6 h-6 rounded-full bg-[#1e2875] text-white flex items-center justify-center text-xs font-bold">
                  {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">{currentUser?.name || 'My Profile'}</span>
                <span className="text-[10px] bg-[#1e2875] text-white px-1.5 py-0.5 rounded-full">Buyer</span>
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 text-xs px-2 sm:px-3 h-8"
                title="Logout"
              >
                <LogOut size={16} className="mr-1 hidden sm:inline" /> Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="border-[#1e2875] text-[#1e2875] hover:bg-[#1e2875] hover:text-white text-xs sm:text-sm h-9 px-3 font-semibold focus:ring-2 focus:ring-yellow-400"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => { window.location.href = 'https://handsandhope-sellers.vercel.app/'; }}
                className="bg-yellow-400 text-[#1e2875] hover:bg-yellow-500 text-xs sm:text-sm h-9 px-3 font-bold focus:ring-2 focus:ring-yellow-600 hidden sm:inline-flex"
              >
                Register as Seller
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
