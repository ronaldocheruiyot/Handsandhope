import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle, Trash2, X, Plus, Minus } from 'lucide-react';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  cart: any[];
  onUpdateQuantity: (productId: string | number, quantity: number) => void;
  onRemoveFromCart: (productId: string | number) => void;
  isLoggedIn: boolean;
  onAddToCart?: (product: any, qty?: number) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  product,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  isLoggedIn,
  onAddToCart
}: CartDrawerProps) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch quick recommendations for the bottom of the drawer
  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      try {
        const res = await api.getProducts({ limit: 4 });
        if (isMounted && res?.products) {
          const cartIds = cart.map((i) => String(i.id || i._id));
          const filtered = res.products.filter(
            (p: any) => !cartIds.includes(String(p._id || p.id))
          );
          setRecommendations(filtered.slice(0, 2));
        }
      } catch (err) {
        console.error('Failed to load drawer recommendations', err);
      }
    };

    if (isOpen) {
      fetchRecs();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, cart]);

  if (!isOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  const handleProceedToCheckout = () => {
    onClose();
    if (isLoggedIn) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=/checkout');
    }
  };

  const handleGoToCart = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <>
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[999998] transition-opacity duration-200"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Amazon-Exact Right Rail Side Window */}
      <aside 
        className="fixed top-0 right-0 bottom-0 h-screen bg-white z-[999999] border-l border-gray-300 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '90vw',
          zIndex: 999999
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Side Rail"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP SECTION: Subtotal and Action Buttons */}
        <div className="p-4 border-b border-gray-200 bg-white shadow-2xs">
          {/* Close X Button and Added Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle size={16} className="text-emerald-600 fill-emerald-100" />
              <span>Added to Cart</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="Close cart side window"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subtotal Display */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 font-medium">Subtotal</div>
            <div className="text-lg font-black text-[#B12704] tracking-tight">
              ${subtotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-500">
              ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </div>
          </div>

          {/* Amazon-Styled Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-[#0f1111] font-bold py-2 px-3 rounded-full shadow-xs text-xs transition-all border border-[#fcd200]"
            >
              Proceed to checkout
            </button>

            <button
              onClick={handleGoToCart}
              className="w-full bg-white hover:bg-[#f7fafa] active:bg-[#edfdff] text-[#0f1111] font-medium py-1.5 px-3 rounded-full border border-[#d5d9d9] shadow-2xs text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={14} className="text-gray-600" />
              Go to Cart
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION: Stack of Cart Items with Amazon Yellow Steppers */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <ShoppingCart size={32} className="mx-auto mb-2 text-gray-300" />
              Your cart is empty
            </div>
          ) : (
            cart.map((item) => {
              const itemId = item.id || item._id;
              const itemPrice = Number(item.price) || 0;
              const itemQty = item.quantity || 1;
              const isRecentlyAdded = product && (product.id === itemId || product._id === itemId);

              return (
                <div key={itemId} className={`pt-3 first:pt-0 ${isRecentlyAdded ? 'bg-amber-50/40 p-2 rounded-lg' : ''}`}>
                  {/* Item Image */}
                  <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-2 flex items-center justify-center">
                    <img
                      src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300'}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-0.5">
                    {item.name}
                  </h4>

                  {/* Size indicator if applicable */}
                  {item.selectedSize && (
                    <p className="text-[11px] text-gray-500 font-medium mb-1">
                      Size: <span className="text-gray-800 font-semibold">{item.selectedSize}</span>
                    </p>
                  )}

                  {/* Price */}
                  <div className="text-sm font-extrabold text-[#0f1111] mb-2">
                    ${(itemPrice * itemQty).toFixed(2)}
                  </div>

                  {/* Amazon Yellow Quantity Pill Controller: [ Trash/- | Qty | + ] */}
                  <div className="inline-flex items-center justify-between w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] border border-[#fcd200] rounded-full px-2 py-1 shadow-2xs">
                    <button
                      onClick={() => {
                        if (itemQty <= 1) {
                          onRemoveFromCart(itemId);
                        } else {
                          onUpdateQuantity(itemId, itemQty - 1);
                        }
                      }}
                      className="p-1 hover:bg-black/10 rounded-full transition-colors"
                      aria-label={itemQty <= 1 ? "Remove item" : "Decrease quantity"}
                      title={itemQty <= 1 ? "Remove item" : "Decrease quantity"}
                    >
                      {itemQty <= 1 ? <Trash2 size={13} className="text-gray-800" /> : <Minus size={13} className="text-gray-800" />}
                    </button>

                    <span className="text-xs font-bold px-2 select-none">
                      {itemQty}
                    </span>

                    <button
                      onClick={() => onUpdateQuantity(itemId, itemQty + 1)}
                      className="p-1 hover:bg-black/10 rounded-full transition-colors"
                      aria-label="Increase quantity"
                      title="Increase quantity"
                    >
                      <Plus size={13} className="text-gray-800" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Quick Cross-sell Recommendation if present */}
          {recommendations.length > 0 && (
            <div className="pt-4 mt-2">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                Recommended for you
              </div>
              <div className="space-y-2.5">
                {recommendations.map((rec) => {
                  const recId = rec._id || rec.id;
                  return (
                    <div key={recId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <img
                        src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=100'}
                        alt={rec.name}
                        className="w-10 h-10 object-cover rounded shrink-0 border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-900 truncate">{rec.name}</p>
                        <p className="text-[11px] font-bold text-[#B12704]">${Number(rec.price).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (onAddToCart) onAddToCart(rec, 1);
                        }}
                        className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] text-[10px] font-bold px-2 py-1 rounded-full border border-[#fcd200] shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FOOTER */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline font-medium"
          >
            ← Continue shopping
          </button>
        </div>
      </aside>
    </>
  );
}
