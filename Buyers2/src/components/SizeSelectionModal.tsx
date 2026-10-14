import { useState, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SizeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onConfirmAddToCart: (product: any, size: string, quantity?: number) => void;
}

export const isClothingOrWearable = (product: any): boolean => {
  if (!product) return false;
  const category = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  const clothingKeywords = [
    'wearable', 'wearables', 'clothing', 'textile', 'textiles', 'fashion',
    'apparel', 'shirt', 't-shirt', 'pants', 'joggers', 'trousers', 'scarf',
    'sweatpants', 'sweater', 'hoodie', 'jacket', 'coat', 'shoe', 'shoes',
    'sneaker', 'sneakers', 'sock', 'socks', 'dress', 'skirt', 'glove', 'gloves',
    'hat', 'cap', 'beanie'
  ];

  if (product.requiresSize || (Array.isArray(product.sizes) && product.sizes.length > 0)) {
    return true;
  }

  if (['wearables', 'clothing', 'textiles', 'fashion', 'apparel', 'shoes'].includes(category)) {
    return true;
  }

  return clothingKeywords.some(keyword => name.includes(keyword) || category.includes(keyword));
};

export default function SizeSelectionModal({
  isOpen,
  onClose,
  product,
  onConfirmAddToCart
}: SizeSelectionModalProps) {
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedColor, setSelectedColor] = useState('Standard / As Shown');

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize('Medium');
    }
  }, [product]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const availableSizes = product.sizes && product.sizes.length > 0 
    ? product.sizes 
    : ['Small', 'Medium', 'Large', 'X-Large', 'XX-Large'];

  const prodId = product._id || product.id;
  const price = Number(product.price) || 0;
  const listPrice = (price * 1.35).toFixed(2);

  const handleAddToCart = () => {
    onConfirmAddToCart(product, selectedSize, 1);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative border border-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm Size & Details"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Product Info Section */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Product Thumbnail */}
          <div className="w-full sm:w-36 h-40 sm:h-44 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
            <img
              src={product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400'}
              alt={product.name}
              className="w-full h-full object-contain p-2"
            />
          </div>

          {/* Details & Selectors */}
          <div className="flex-1 min-w-0 space-y-3">
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
              {product.name}
            </h3>

            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Artisan:</span> {product.seller || product.sellerName || 'Special Artisan'}
            </p>

            <Link
              to={`/product/${prodId}`}
              onClick={onClose}
              className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline font-medium inline-block"
            >
              See all item details
            </Link>

            {/* Size Dropdown Selector */}
            <div className="pt-2">
              <label htmlFor="size-select" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Size:
              </label>
              <div className="relative">
                <select
                  id="size-select"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-900 text-sm font-semibold rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:outline-none cursor-pointer transition-colors"
                >
                  {availableSizes.map((sz: string) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Price & Savings */}
            <div className="pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#0f1111]">
                  ${price.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  List: ${listPrice}
                </span>
              </div>
              <p className="text-xs text-[#067d62] font-semibold mt-0.5">
                FREE delivery by Thursday • Fastest delivery by Tuesday
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Cancel & Add to Cart */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-sm font-medium transition-all focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            className="px-7 py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-[#0f1111] text-sm font-bold shadow-xs transition-all border border-[#fcd200] focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
