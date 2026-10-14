import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';

interface ProductCardProps {
  product: {
    id: string | number;
    _id?: string;
    name: string;
    price: number;
    category: string;
    image: string;
    seller: string;
    sellerName?: string;
    disabilityType?: string;
    rating: number;
    reviewCount: number;
    recommendationReason?: string;
  };
  onAddToCart: (product: any) => void;
  isInCart: boolean;
}

export default function ProductCard({ product, onAddToCart, isInCart }: ProductCardProps) {
  const navigate = useNavigate();
  const productId = product.id || product._id;

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-yellow-400 border border-gray-200 flex flex-col justify-between"
      role="article"
      aria-label={`${product.name} product card`}
    >
      <div 
        onClick={() => navigate(`/product/${productId}`)}
        className="focus:outline-none"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/product/${productId}`);
          }
        }}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500'}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <Badge className="bg-[#1e2875] text-white shadow-sm text-xs">
              {product.category}
            </Badge>
            {product.recommendationReason && (
              <Badge className="bg-amber-500 text-white shadow-sm text-[10px] font-medium">
                ✨ {product.recommendationReason}
              </Badge>
            )}
          </div>
          {product.disabilityType && !product.recommendationReason && (
            <Badge className="absolute bottom-2 left-2 bg-emerald-700/90 text-white backdrop-blur-sm text-[10px]">
              🤝 {product.disabilityType}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 text-base">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-2 line-clamp-1">By {product.seller || product.sellerName || 'Special Artisan'}</p>
          
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <Star className="fill-yellow-400 text-yellow-400" size={15} aria-hidden="true" />
              <span className="text-gray-700 text-sm font-medium">{product.rating || 4.8}</span>
              <span className="text-gray-400 text-xs">({product.reviewCount || 10})</span>
            </div>
            <p className="text-[#1e2875] font-bold text-lg">${Number(product.price).toFixed(2)}</p>
          </div>
        </CardContent>
      </div>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`w-full ${isInCart ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1e2875] hover:bg-[#2a3490]'} text-white focus:ring-2 focus:ring-yellow-400 shadow-sm`}
          aria-label={isInCart ? 'Already in cart' : `Add ${product.name} to cart`}
        >
          <ShoppingCart className="mr-2" size={16} aria-hidden="true" />
          {isInCart ? 'Added in Cart' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
