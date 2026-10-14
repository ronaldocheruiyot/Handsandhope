import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import ProductDetailPage from './components/ProductDetailPage';
import ProfilePage from './components/ProfilePage';
import SchoolsPage from './components/SchoolsPage';
import AboutPage from './components/AboutPage';
import ServicesPage from './components/ServicesPage';
import CheckoutPage from './components/CheckoutPage';
import CartPage from './components/CartPage';
import CartDrawer from './components/CartDrawer';
import SizeSelectionModal, { isClothingOrWearable } from './components/SizeSelectionModal';
import TeamPage from './components/TeamPage';
import TeamMemberDetailPage from './components/TeamMemberDetailPage';
import { AccessibilitySettings } from './AccessibilityMenu';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('buyer_user') || sessionStorage.getItem('buyer_user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const saved = localStorage.getItem('buyer_user') || sessionStorage.getItem('buyer_user');
    return !!(token && saved);
  });

  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('buyer_cart');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<any>(null);

  // Clothing / Wearable Size Selection Modal State
  const [pendingSizingProduct, setPendingSizingProduct] = useState<any>(null);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('buyer_cart', JSON.stringify(cart));
  }, [cart]);

  // Main Add to Cart initiation
  const addToCart = (product: any, quantity = 1, forceSkipSizeDialog = false) => {
    if (!forceSkipSizeDialog && isClothingOrWearable(product) && !product.selectedSize) {
      // Open Size Selection Dialog for clothing/wearables
      setPendingSizingProduct({ ...product, quantity });
      setIsSizeModalOpen(true);
      return;
    }
    // Directly commit to cart for non-clothing items or when size is already chosen
    commitAddToCart(product, quantity, product.selectedSize);
  };

  const commitAddToCart = (product: any, quantity = 1, selectedSize?: string) => {
    const prodId = product.id || product._id;
    const itemToAdd = {
      ...product,
      id: prodId,
      _id: prodId,
      selectedSize: selectedSize || product.selectedSize || undefined,
      quantity
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => (item.id || item._id) === prodId && item.selectedSize === itemToAdd.selectedSize
      );
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, itemToAdd];
    });

    setLastAddedProduct(itemToAdd);
    setIsCartDrawerOpen(true);
  };

  const updateCartQuantity = (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => ((item.id || item._id) === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => (item.id || item._id) !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Load accessibility settings from localStorage or use defaults
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('handsAndHopeAccessibility');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      textSize: 100,
      highContrast: false,
      screenReader: false,
      voiceNavigation: false,
      underlineLinks: false,
      keyboardNavigation: true,
      reduceMotion: false
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('handsAndHopeAccessibility', JSON.stringify(accessibilitySettings));
  }, [accessibilitySettings]);

  // Apply accessibility settings to the document
  useEffect(() => {
    const root = document.documentElement;

    // Text size
    root.style.fontSize = `${accessibilitySettings.textSize}%`;

    // High contrast
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Underline links
    if (accessibilitySettings.underlineLinks) {
      root.classList.add('underline-links');
    } else {
      root.classList.remove('underline-links');
    }

    // Keyboard navigation
    if (accessibilitySettings.keyboardNavigation) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Reduce motion
    if (accessibilitySettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [accessibilitySettings]);

  const handleLogin = (user: any) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('buyer_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('buyer_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('buyer_user');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} cart={cart} onAddToCart={addToCart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/preview_page_v2.html" element={<HomePage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} cart={cart} onAddToCart={addToCart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/signup" element={<SignUpPage onSignUp={handleLogin} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/cart" element={<CartPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} cart={cart} onUpdateQuantity={updateCartQuantity} onRemoveFromCart={removeFromCart} onClearCart={clearCart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/product/:id" element={<ProductDetailPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} cart={cart} onAddToCart={addToCart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/profile" element={isLoggedIn ? <ProfilePage currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleLogin} cart={cart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} /> : <Navigate to="/login" />} />
        <Route path="/schools" element={<SchoolsPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/about" element={<AboutPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/services" element={<ServicesPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/team" element={<TeamPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/team/:id" element={<TeamMemberDetailPage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
        <Route path="/checkout" element={isLoggedIn ? <CheckoutPage currentUser={currentUser} onLogout={handleLogout} cart={cart} onRemoveFromCart={removeFromCart} onClearCart={clearCart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} /> : <Navigate to="/login" />} />
        <Route path="*" element={<HomePage isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} cart={cart} onAddToCart={addToCart} accessibilitySettings={accessibilitySettings} onAccessibilityChange={setAccessibilitySettings} />} />
      </Routes>

      {/* Amazon-Style Right Rail Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        product={lastAddedProduct}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveFromCart={removeFromCart}
        isLoggedIn={isLoggedIn}
        onAddToCart={addToCart}
      />

      {/* Clothing / Wearable Size Confirmation Dialog */}
      <SizeSelectionModal
        isOpen={isSizeModalOpen}
        onClose={() => {
          setIsSizeModalOpen(false);
          setPendingSizingProduct(null);
        }}
        product={pendingSizingProduct}
        onConfirmAddToCart={(product, size, quantity) => {
          commitAddToCart(product, quantity || 1, size);
        }}
      />
    </Router>
  );
}
