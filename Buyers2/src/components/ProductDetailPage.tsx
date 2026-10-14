import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Star, ShoppingCart, Heart, Share2, MessageSquare, CheckCircle, MapPin, Award, Loader2, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AccessibilitySettings } from './AccessibilityMenu';
import { api } from '../services/api';

interface ProductDetailPageProps {
  isLoggedIn: boolean;
  currentUser?: any;
  onLogout: () => void;
  cart?: any[];
  onAddToCart?: (product: any, qty?: number) => void;
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

export default function ProductDetailPage({ 
  isLoggedIn, 
  currentUser, 
  onLogout, 
  cart = [], 
  onAddToCart = () => {}, 
  accessibilitySettings, 
  onAccessibilityChange 
}: ProductDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Inquiry state
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryName, setInquiryName] = useState(currentUser?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(currentUser?.email || '');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Review state
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchProductAndRecs = async () => {
      setLoading(true);
      try {
        if (id) {
          const prod = await api.getProduct(id);
          if (isMounted && prod) {
            setProduct(prod);
            setActiveImage(prod.image || (prod.images && prod.images[0]) || '');
            setReviewsList(prod.reviews || []);

            const recs = await api.getRecommendations({ 
              category: prod.category, 
              excludeId: id, 
              limit: 4 
            });
            if (isMounted) setRecommendedProducts(recs);
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductAndRecs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [id]);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (isInquiryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isInquiryOpen]);

  const handleAddToCart = () => {
    if (!product) return;
    onAddToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    const prodId = product?._id || product?.id || id;
    if (!prodId) {
      alert('Product reference missing.');
      return;
    }

    setInquirySending(true);
    try {
      await api.sendInquiry(prodId, {
        buyerName: inquiryName || currentUser?.name || 'Interested Buyer',
        buyerEmail: inquiryEmail || currentUser?.email || 'buyer@example.com',
        buyerId: currentUser?.id || currentUser?._id,
        message: inquiryMessage
      });
      setInquirySuccess(true);
      setTimeout(() => {
        setIsInquiryOpen(false);
        setInquirySuccess(false);
        setInquiryMessage('');
      }, 2500);
    } catch (err: any) {
      console.error('Failed to send inquiry:', err);
      alert(err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setInquirySending(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const newRevObj = {
      id: Date.now(),
      user: currentUser?.name || 'Verified Buyer',
      rating: newRating,
      comment: newReview,
      date: new Date().toISOString()
    };

    setReviewsList([newRevObj, ...reviewsList]);
    setNewReview('');
    setNewRating(5);
    alert('Thank you for your rating & feedback!');
  };

  const ratingDistribution = [
    { stars: 5, count: 18, percentage: 70 },
    { stars: 4, count: 5, percentage: 20 },
    { stars: 3, count: 2, percentage: 7 },
    { stars: 2, count: 1, percentage: 3 },
    { stars: 1, count: 0, percentage: 0 }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#1e2875]" size={40} />
          <p className="text-gray-600 font-medium">Loading handcrafted product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">This item may have been removed or is temporarily unavailable.</p>
          <Button onClick={() => navigate('/')} className="bg-[#1e2875] text-white">
            Return to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Sidebar selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} />
      
      <div className="flex-1 min-w-0 flex flex-col">
        <Header 
          isLoggedIn={isLoggedIn} 
          currentUser={currentUser} 
          onLogout={onLogout}
          cartItemCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          accessibilitySettings={accessibilitySettings}
          onAccessibilityChange={onAccessibilityChange}
        />

        <main id="main-content" className="p-6 max-w-6xl mx-auto" role="main">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-gray-100 text-gray-700"
            aria-label="Go back"
          >
            ← Back to Marketplace
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            {/* Product Images Showcase */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4 border border-gray-100 shadow-inner">
                <img
                  src={activeImage || product.image || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              </div>

              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        activeImage === img ? 'border-[#1e2875] ring-2 ring-indigo-200' : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info & Purchase Controls */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-[#1e2875] text-white">{product.category}</Badge>
                {product.disabilityType && (
                  <Badge variant="outline" className="border-emerald-600 text-emerald-800 bg-emerald-50">
                    🤝 {product.disabilityType}
                  </Badge>
                )}
                {product.school && (
                  <Badge variant="outline" className="border-indigo-400 text-indigo-800 bg-indigo-50">
                    🏫 {product.school}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(product.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-gray-800 font-bold">{product.rating || 4.8}</span>
                <span className="text-gray-500 text-sm">({reviewsList.length || product.reviewCount || 10} verified reviews)</span>
              </div>

              <div className="text-3xl font-extrabold text-[#1e2875] mb-6">
                ${Number(product.price).toFixed(2)}
              </div>

              {/* Artisan Bio Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="text-[#1e2875]" size={20} />
                    <span className="font-semibold text-gray-900">Crafted by {product.seller || product.sellerName}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={14} /> {product.location || 'Nairobi, Kenya'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {product.sellerBio || 'Artisan creating inspiring handcrafted items through vocational special programs.'}
                </p>
                <div className="text-xs font-medium text-emerald-700">
                  ✓ In Stock: {product.stock ?? 10} available
                </div>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                {product.description || 'Authentic handmade product made with care and high quality materials.'}
              </p>

              {/* Quantity Selector & Action Buttons */}
              <div className="space-y-4 mt-auto">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock || 20, quantity + 1))}
                      className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                  {addedNotice && (
                    <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1 animate-pulse">
                      <CheckCircle size={15} /> Added to Cart!
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#1e2875] hover:bg-[#2a3490] text-white py-6 rounded-xl font-bold text-base shadow-md"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingCart className="mr-2" size={20} aria-hidden="true" />
                    Add to Cart • ${(Number(product.price) * quantity).toFixed(2)}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!inquiryName && currentUser?.name) setInquiryName(currentUser.name);
                      if (!inquiryEmail && currentUser?.email) setInquiryEmail(currentUser.email);
                      setIsInquiryOpen(true);
                    }}
                    className="border-[#1e2875] text-[#1e2875] hover:bg-indigo-50 py-6 px-4 rounded-xl font-medium"
                  >
                    <MessageSquare className="mr-1.5" size={18} />
                    Message Artisan
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <section className="mb-12" aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="text-2xl font-bold text-[#1e2875] mb-6">Customer Reviews & Ratings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <Card className="rounded-2xl border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-extrabold text-[#1e2875] mb-2">{product.rating || 4.8}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={22}
                        className={i < Math.floor(product.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">Based on {reviewsList.length || 10} verified purchases</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-2xl border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
                  {ratingDistribution.map((dist) => (
                    <div key={dist.stars} className="flex items-center gap-4 mb-2 text-sm">
                      <span className="text-gray-600 w-12">{dist.stars} star</span>
                      <Progress value={dist.percentage} className="flex-1 h-2" />
                      <span className="text-gray-400 w-10 text-right">{dist.percentage}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Write a Review Card */}
            <Card className="mb-8 rounded-2xl border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm">Rate this Artisan Craft</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewRating(rating)}
                          className="focus:outline-none"
                          aria-label={`Rate ${rating} stars`}
                        >
                          <Star
                            size={28}
                            className={rating <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="review" className="text-sm">Your Experience</Label>
                    <Textarea
                      id="review"
                      placeholder="Share your thoughts about this handmade creation..."
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      className="min-h-[100px] mt-1"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#1e2875] hover:bg-[#2a3490] text-white"
                  >
                    Submit Review
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList.map((review, idx) => (
                <Card key={review.id || idx} className="rounded-2xl border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-[#1e2875] text-white font-bold">
                          {review.user ? review.user.charAt(0) : 'B'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{review.user}</p>
                          <p className="text-gray-400 text-xs">{new Date(review.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={15}
                              className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Recommended & Related Products */}
          {recommendedProducts.length > 0 && (
            <section aria-labelledby="recommended-title" className="mt-14">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-amber-500" size={22} />
                <h2 id="recommended-title" className="text-2xl font-bold text-[#1e2875]">
                  Recommended For You & Similar Crafts
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((rec) => (
                  <Card 
                    key={rec.id || rec._id} 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden border border-gray-200"
                    onClick={() => navigate(`/product/${rec.id || rec._id}`)}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100 relative">
                      <img
                        src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300'}
                        alt={rec.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {rec.recommendationReason && (
                        <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px]">
                          ✨ {rec.recommendationReason}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 text-sm">{rec.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-[#1e2875] font-bold">${Number(rec.price).toFixed(2)}</p>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
                          <span className="text-gray-700 text-xs font-medium">{rec.rating || 4.8}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Root-level Message Artisan Modal Dialog */}
      {isInquiryOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInquiryOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-gray-200 relative overflow-hidden z-[1000000] my-auto"
            role="dialog" 
            aria-modal="true"
            aria-labelledby="inquiry-modal-title"
          >
            <button
              type="button"
              onClick={() => setIsInquiryOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#1e2875] font-bold text-xl shrink-0">
                💬
              </div>
              <div>
                <h3 id="inquiry-modal-title" className="text-lg font-bold text-gray-900">
                  Message {product.seller || product.sellerName || 'Artisan'}
                </h3>
                <p className="text-xs text-gray-500">
                  Direct communication regarding <strong>"{product.name}"</strong>
                </p>
              </div>
            </div>

            {inquirySuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="text-emerald-600 mx-auto animate-bounce" size={48} />
                <h4 className="font-bold text-gray-900 text-xl">Inquiry Sent Successfully!</h4>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  The artisan and school mentorship team have been notified. You can track replies in your profile.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <Button 
                    onClick={() => { setIsInquiryOpen(false); navigate('/profile'); }}
                    className="bg-[#1e2875] text-white text-xs px-4"
                  >
                    Go to My Profile & Inquiries
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsInquiryOpen(false)}
                    className="text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                {/* Quick Inquiry Prompts */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Quick Questions / Prompts:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Is custom sizing or engraving available?",
                      "Can I order in a different color/pattern?",
                      "Do you accept bulk/corporate orders?",
                      "How soon can this be shipped?"
                    ].map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setInquiryMessage(prompt)}
                        className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-[#1e2875] text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="inqName" className="text-xs font-medium text-gray-700">Your Full Name *</Label>
                    <Input
                      id="inqName"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. David Buyer"
                      className="text-sm bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inqEmail" className="text-xs font-medium text-gray-700">Your Email Address *</Label>
                    <Input
                      id="inqEmail"
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="e.g. david.buyer@example.com"
                      className="text-sm bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="inqMsg" className="text-xs font-medium text-gray-700">Your Message or Custom Request *</Label>
                  <Textarea
                    id="inqMsg"
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Type your question or custom order specifications here..."
                    rows={3}
                    className="text-sm bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setIsInquiryOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={inquirySending} 
                    className="bg-[#1e2875] hover:bg-[#2a3490] text-white px-5 rounded-xl font-semibold shadow-sm"
                  >
                    {inquirySending ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="animate-spin" size={16} /> Sending...
                      </span>
                    ) : (
                      'Send Message to Artisan'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
