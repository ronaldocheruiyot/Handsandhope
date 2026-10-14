import { useState, useRef, useEffect } from 'react';
import { X, Upload, DollarSign, Package, Plus, Trash2, AlertCircle, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface AddProductModalProps {
  onClose: () => void;
  onAddProduct: (product: {
    name: string;
    price: string;
    description: string;
    category: string;
    stock: string;
    images: string[];
    warranty?: string;
    refundDeadline?: string;
  }) => void;
  highContrast: boolean;
  userRole?: 'seller' | 'student';
  editProduct?: {
    _id?: string;
    id?: string;
    name: string;
    price: string | number;
    description: string;
    category: string;
    stock: string | number;
    images: string[];
    warranty?: string;
    refundDeadline?: string;
  } | null;
}

const DEFAULT_CATEGORIES = [
  'Pottery',
  'Painting',
  'Jewelry',
  'Textiles',
  'Sculpture',
  'Crafts',
  'Woodwork',
  'Photography',
  'Digital Art',
  'Fashion',
  'Home Decor',
  'Toys & Games',
];

export function AddProductModal({ onClose, onAddProduct, highContrast, userRole = 'seller', editProduct = null }: AddProductModalProps) {
  const isEditing = !!editProduct;
  
  const initialCategory = editProduct?.category || '';
  const isInitialPredefined = initialCategory ? DEFAULT_CATEGORIES.includes(initialCategory) : true;

  const [productName, setProductName] = useState(editProduct?.name || '');
  const [price, setPrice] = useState(editProduct?.price?.toString() || '');
  const [description, setDescription] = useState(editProduct?.description || '');
  const [category, setCategory] = useState(isInitialPredefined ? initialCategory : '');
  const [customCategory, setCustomCategory] = useState(!isInitialPredefined ? initialCategory : '');
  const [showCustomCategory, setShowCustomCategory] = useState(!isInitialPredefined && !!initialCategory);
  const [stock, setStock] = useState(editProduct?.stock?.toString() || '');
  const [images, setImages] = useState<string[]>(editProduct?.images || []);
  const [warranty, setWarranty] = useState(editProduct?.warranty || '');
  const [refundDeadline, setRefundDeadline] = useState(editProduct?.refundDeadline || '7');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when editProduct changes
  useEffect(() => {
    if (editProduct) {
      setProductName(editProduct.name || '');
      setPrice(editProduct.price?.toString() || '');
      setDescription(editProduct.description || '');
      const isPredefined = editProduct.category ? DEFAULT_CATEGORIES.includes(editProduct.category) : true;
      if (isPredefined) {
        setCategory(editProduct.category || '');
        setCustomCategory('');
        setShowCustomCategory(false);
      } else {
        setCategory('');
        setCustomCategory(editProduct.category || '');
        setShowCustomCategory(true);
      }
      setStock(editProduct.stock?.toString() || '');
      setImages(editProduct.images || []);
      setWarranty(editProduct.warranty || '');
      setRefundDeadline(editProduct.refundDeadline || '7');
    } else {
      setProductName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setCustomCategory('');
      setShowCustomCategory(false);
      setStock('');
      setImages([]);
      setWarranty('');
      setRefundDeadline('7');
    }
  }, [editProduct]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const remainingSlots = 5 - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      const readPromises = filesToProcess.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const loadedImages = await Promise.all(readPromises);
        setImages(prev => [...prev, ...loadedImages].slice(0, 5));
      } catch (err) {
        console.error('Error reading images:', err);
      } finally {
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!productName || !price || !description) {
      alert('Please fill in all required fields');
      return;
    }

    if (images.length < 3) {
      alert('Please upload at least 3 product images');
      return;
    }

    if (images.length > 5) {
      alert('Maximum 5 product images allowed');
      return;
    }

    const finalCategory = (showCustomCategory ? customCategory : category).trim();
    if (!finalCategory) {
      alert('Please select or enter a product category');
      return;
    }

    onAddProduct({
      name: productName,
      price,
      description,
      category: finalCategory,
      stock: stock || '1',
      images: images,
      warranty: warranty || undefined,
      refundDeadline: refundDeadline || '7',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <Card className={`w-full max-w-4xl max-h-[95vh] overflow-y-auto my-8 ${highContrast ? 'border-2 border-white bg-black' : 'shadow-2xl'}`}>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 sticky top-0 bg-white z-10">
          <div>
            <CardTitle className={`flex items-center gap-2 ${highContrast ? 'text-white' : 'text-gray-900'}`}>
              <Package className="h-6 w-6" />
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </CardTitle>
            <p className={`mt-1 text-sm ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
              {isEditing ? 'Update product details' : 'List a new product for sale on the marketplace'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Images - 3 to 5 Required */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className={highContrast ? 'text-gray-300' : ''}>
                  Product Images * (Minimum 3, Maximum 5)
                </Label>
                <Badge variant={images.length >= 3 && images.length <= 5 ? 'default' : 'secondary'}>
                  {images.length}/5 images
                </Badge>
              </div>

              {/* Image Upload Grid */}
              <div className="grid grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="aspect-square rounded-lg bg-cover bg-center border-2 border-gray-300"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Add More Images Button */}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                      highContrast 
                        ? 'border-white hover:bg-gray-900' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <Plus className={`h-8 w-8 ${highContrast ? 'text-gray-400' : 'text-gray-400'}`} />
                    <span className="text-xs mt-1">Add</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {images.length < 3 && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Please upload at least 3 images to list your product</span>
                </div>
              )}
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productName" className={highContrast ? 'text-gray-300' : ''}>
                Product Name *
              </Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Handmade Ceramic Bowl"
                className="h-12"
                required
              />
            </div>

            {/* Price and Stock */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price" className={highContrast ? 'text-gray-300' : ''}>
                  Price *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-12 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className={highContrast ? 'text-gray-300' : ''}>
                  Stock Quantity *
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Available quantity"
                  className="h-12"
                  required
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className={`space-y-3 rounded-xl border p-4 ${highContrast ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-gray-50/70'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label className={`font-semibold flex items-center gap-2 ${highContrast ? 'text-gray-200' : 'text-gray-900'}`}>
                  <Tag className="h-4 w-4 text-blue-600" />
                  Product Category *
                </Label>
                
                {/* Segmented Mode Selector Pills */}
                <div className={`inline-flex rounded-lg p-1 text-xs border ${highContrast ? 'bg-gray-800 border-gray-700' : 'bg-gray-200/80 border-gray-300'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(false);
                      if (!DEFAULT_CATEGORIES.includes(category)) {
                        setCategory(DEFAULT_CATEGORIES[0]);
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                      !showCustomCategory
                        ? 'bg-white text-blue-600 shadow-sm'
                        : highContrast ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Predefined</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(true);
                      if (!customCategory && category) {
                        setCustomCategory(category);
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                      showCustomCategory
                        ? 'bg-white text-blue-600 shadow-sm'
                        : highContrast ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Custom</span>
                  </button>
                </div>
              </div>
              
              {!showCustomCategory ? (
                <div className="space-y-2">
                  <Select 
                    value={DEFAULT_CATEGORIES.includes(category) ? category : ''} 
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setShowCustomCategory(true);
                        if (!customCategory && category && !DEFAULT_CATEGORIES.includes(category)) {
                          setCustomCategory(category);
                        }
                      } else {
                        setCategory(val);
                      }
                    }}
                  >
                    <SelectTrigger className={`h-12 ${highContrast ? 'bg-black text-white border-gray-700' : 'bg-white'}`}>
                      <SelectValue placeholder="Select a category from the list" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="font-semibold text-blue-600 border-t mt-1 cursor-pointer">
                        + Enter a Custom Category...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                    Can't find a matching category? Click <strong>Custom</strong> above or select <strong>+ Enter a Custom Category</strong> to type your own.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g., Book, Wood Carving, Leather Shoes..."
                      className={`h-12 pr-24 ${highContrast ? 'bg-black text-white border-gray-700' : 'bg-white'}`}
                      required
                      autoFocus
                    />
                    {customCategory && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={highContrast ? 'text-gray-400' : 'text-gray-500'}>
                      Type any custom category name for your product.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategory(false);
                        if (!DEFAULT_CATEGORIES.includes(category)) {
                          setCategory(DEFAULT_CATEGORIES[0]);
                        }
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      ← Back to Predefined List
                    </button>
                  </div>
                </div>
              )}

              {/* Current Active Category Badge */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                <span className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>Active Category:</span>
                {(showCustomCategory ? customCategory : category) ? (
                  <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                    {showCustomCategory ? customCategory : category}
                    <span className="ml-1.5 text-[10px] text-blue-500 font-normal">
                      ({showCustomCategory ? 'Custom' : 'Predefined'})
                    </span>
                  </Badge>
                ) : (
                  <span className="text-xs text-orange-600 italic">No category selected yet</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className={highContrast ? 'text-gray-300' : ''}>
                Product Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product in detail..."
                className="min-h-[120px]"
                required
              />
            </div>

            {/* Warranty and Refund Policy */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Warranty & Refund Policy</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warranty" className={highContrast ? 'text-gray-300' : ''}>
                    Warranty Period (Optional)
                  </Label>
                  <Select value={warranty} onValueChange={setWarranty}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="No warranty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Warranty</SelectItem>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="60days">60 Days</SelectItem>
                      <SelectItem value="90days">90 Days</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundDeadline" className={highContrast ? 'text-gray-300' : ''}>
                    Refund Deadline (After Delivery)
                  </Label>
                  <Select value={refundDeadline} onValueChange={setRefundDeadline}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">7 Days (Recommended)</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Buyers can request refunds within the specified deadline after receiving the product. 
                  Warranty covers manufacturing defects.
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={images.length < 3 || images.length > 5}
              >
                <Package className="mr-2 h-5 w-5" />
                {isEditing ? 'Update Product' : 'Add Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
