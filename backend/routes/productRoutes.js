import express from "express";
import Product from "../models/Product.js";
import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import Inquiry from "../models/Inquiry.js";
import Order from "../models/Order.js";
import School from "../models/School.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Helper to resolve target seller ID and check caregiver permissions
 */
const resolveSellerAccess = async (req, requiredPermission = 'viewProducts') => {
  const targetId = req.query.targetAccountId || req.headers['x-managed-account-id'] || req.body?.targetAccountId || req.query.sellerId;
  
  if (req.user.role === 'caregiver' && targetId) {
    const caregiver = await Caregiver.findOne({ user: req.user.id });
    const managed = caregiver?.managedAccounts?.find(m => String(m.accountId) === String(targetId));
    
    if (!managed) {
      return { authorized: false, error: 'You do not manage this account' };
    }
    
    if (requiredPermission && managed.permissions && !managed.permissions[requiredPermission] && !managed.permissions.manageProducts) {
      return { authorized: false, error: `You do not have ${requiredPermission} permission for this account` };
    }
    
    return { authorized: true, sellerId: targetId, caregiver, managedAccount: managed };
  }
  
  return { authorized: true, sellerId: req.user.id };
};

// ==============================
// @desc    Get all active products with search, category filtering & populated seller
// @route   GET /api/products
// @access  Public
// ==============================
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, schoolId, sort } = req.query;

    let query = {
      isDeleted: { $ne: true },
      status: 'active'
    };

    if (category && category !== 'All' && category !== 'all') {
      const cats = Array.isArray(category) ? category : [category];
      query.category = { $in: cats };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc') sortOptions = { price: 1 };
    if (sort === 'price-desc') sortOptions = { price: -1 };
    if (sort === 'popular') sortOptions = { viewCount: -1, totalSold: -1 };

    const products = await Product.find(query)
      .populate('sellerId', 'name email businessName role school profilePhoto bio disabilityType location')
      .sort(sortOptions);

    const formatted = products.map(p => {
      const seller = p.sellerId || {};
      return {
        id: p._id,
        _id: p._id,
        name: p.name,
        price: p.price,
        status: p.status || 'active',
        category: p.category || 'Handmade Crafts',
        description: p.description || '',
        stock: p.stock ?? 1,
        images: (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : ['https://images.unsplash.com/photo-1503602642458-232111445657?w=500']),
        image: (p.images && p.images[0]) || p.image || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500',
        seller: seller.businessName || seller.name || 'Artisan Partner',
        sellerName: seller.name || 'Artisan Partner',
        sellerRole: seller.role || 'seller',
        sellerBio: seller.bio || 'Talented artisan crafting unique handmade goods with heart and hope.',
        disabilityType: seller.disabilityType || 'Artisan Creator',
        location: seller.location || 'Kenya',
        rating: 4.8,
        reviewCount: Math.max(1, p.totalSold ? p.totalSold * 2 : 5),
        totalSold: p.totalSold || 0,
        viewCount: p.viewCount || 0,
        warranty: p.warranty || 'Craftsmanship guarantee',
        refundDeadline: p.refundDeadline || '14 days'
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

// ==============================
// @desc    Recommendation Engine for Buyers Marketplace
// @route   GET /api/products/recommendations
// @access  Public
// ==============================
router.get("/recommendations", async (req, res) => {
  try {
    const { category, excludeId, limit = 8 } = req.query;

    const products = await Product.find({
      isDeleted: { $ne: true },
      status: 'active'
    }).populate('sellerId', 'name email businessName role school profilePhoto bio disabilityType location');

    // Score products based on recommendation engine algorithms
    const scoredProducts = products
      .filter(p => !excludeId || String(p._id) !== String(excludeId))
      .map(p => {
        const seller = p.sellerId || {};
        let score = 50; // base score
        let reasons = [];

        // 1. Boost student artisans & special schools
        if (seller.role === 'student' || seller.school) {
          score += 40;
          reasons.push('Special Needs Student Artisan');
        }

        // 2. Category relevance
        if (category && p.category && p.category.toLowerCase().includes(String(category).toLowerCase())) {
          score += 35;
          reasons.push(`Top in ${p.category}`);
        }

        // 3. Popularity / trending boost
        const views = p.viewCount || 0;
        const sold = p.totalSold || 0;
        score += (sold * 12) + (views * 0.8);
        if (sold > 2 || views > 15) {
          reasons.push('Trending Community Craft');
        }

        // 4. Default badge if none
        if (reasons.length === 0) {
          reasons.push('Featured Artisan Craft');
        }

        return {
          id: p._id,
          _id: p._id,
          name: p.name,
          title: p.name,
          price: p.price,
          status: p.status || 'active',
          category: p.category || 'Handmade Crafts',
          description: p.description || '',
          stock: p.stock ?? 1,
          images: (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : ['https://images.unsplash.com/photo-1503602642458-232111445657?w=500']),
          image: (p.images && p.images[0]) || p.image || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500',
          seller: seller.businessName || seller.name || 'Artisan Partner',
          sellerName: seller.name || 'Artisan Partner',
          sellerRole: seller.role || 'seller',
          sellerBio: seller.bio || 'Talented artisan crafting unique goods.',
          disabilityType: seller.disabilityType || 'Artisan Creator',
          rating: 4.9,
          reviewCount: Math.max(3, sold * 2 + 3),
          totalSold: sold,
          viewCount: views,
          recommendationScore: score,
          recommendationReason: reasons[0],
          recommendationBadges: reasons
        };
      });

    // Sort descending by score
    scoredProducts.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json(scoredProducts.slice(0, parseInt(limit)));
  } catch (err) {
    res.status(500).json({ message: "Error generating recommendations", error: err.message });
  }
}); 

/**
 * @openapi
 * /api/products/seller:
 *   get:
 *     summary: Get products for the logged-in seller (excluding soft-deleted).
 *     description: Retrieve all products owned by the authenticated seller.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller products.
 *         content:
 *           application/json:
 *             example:
 *               - _id: "65f1a2b3c4d5e6f7a8b9c0e2"
 *                 name: "Handmade Beaded Maasai Bracelet"
 *                 price: 25.00
 *                 status: "active"
 *                 category: "Jewelry & Crafts"
 *                 stock: 15
 *                 images:
 *                   - "https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500"
 *                   - "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500"
 *                   - "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500"
 *       401:
 *         description: Unauthorized - JWT token missing or invalid.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Get products for logged-in seller (excluding soft-deleted)
// @route   GET /api/products/seller
// @access  Private (seller only)
// ==============================
router.get("/seller", authMiddleware, async (req, res) => {
  try {
    const access = await resolveSellerAccess(req, 'viewProducts');
    if (!access.authorized) {
      return res.status(403).json({ message: access.error });
    }

    const products = await Product.find({ 
      sellerId: access.sellerId,
      isDeleted: { $ne: true } // Exclude soft-deleted products
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching seller products", error: err.message });
  }
}); 

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create a new product for the logged-in seller.
 *     description: "Add a new product listing. Note: At least 3 images (and up to 5) are required."
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Handcrafted Wooden Giraffe Sculpture"
 *               price:
 *                 type: number
 *                 example: 35.50
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 default: active
 *                 example: active
 *               category:
 *                 type: string
 *                 example: "Wood Carvings & Sculptures"
 *               description:
 *                 type: string
 *                 example: "Polished mahogany wood giraffe carving created by artisans with mobility disabilities."
 *               stock:
 *                 type: integer
 *                 default: 1
 *                 example: 10
 *               images:
 *                 type: array
 *                 minItems: 3
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                 description: "Array of image URLs (min 3, max 5 images)"
 *                 example:
 *                   - "https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500"
 *                   - "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500"
 *                   - "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500"
 *               warranty:
 *                 type: string
 *                 example: "1 Year replacement guarantee on craftsmanship"
 *               refundDeadline:
 *                 type: string
 *                 example: "14 days from delivery date"
 *           example:
 *             name: "Handcrafted Wooden Giraffe Sculpture"
 *             price: 35.50
 *             status: "active"
 *             category: "Wood Carvings"
 *             description: "Polished mahogany wood giraffe carving created by artisans with disabilities."
 *             stock: 10
 *             images:
 *               - "https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500"
 *               - "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500"
 *               - "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500"
 *             warranty: "1 Year warranty"
 *             refundDeadline: "14 days"
 *     responses:
 *       201:
 *         description: Product created successfully.
 *         content:
 *           application/json:
 *             example:
 *               _id: "65f1a2b3c4d5e6f7a8b9c0e3"
 *               name: "Handcrafted Wooden Giraffe Sculpture"
 *               price: 35.50
 *               status: "active"
 *               category: "Wood Carvings"
 *               stock: 10
 *               sellerId: "65f1a2b3c4d5e6f7a8b9c0d1"
 *               createdAt: "2026-08-26T21:00:00.000Z"
 *       400:
 *         description: Validation error (e.g. missing name/price or fewer than 3 images).
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Add a new product (seller or caregiver on behalf of seller)
// @route   POST /api/products
// @access  Private
// ==============================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const access = await resolveSellerAccess(req, 'manageProducts');
    if (!access.authorized) {
      return res.status(403).json({ message: access.error });
    }

    const { name, price, status, category, description, stock, images, warranty, refundDeadline } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    if (!images || images.length < 3) {
      return res.status(400).json({ message: "At least 3 product images are required" });
    }

    if (images.length > 5) {
      return res.status(400).json({ message: "Maximum 5 product images allowed" });
    }

    const sellerUser = await User.findById(access.sellerId).select('role');
    let listingStatus = status || "active";
    if (sellerUser?.role === 'student' && listingStatus === 'active') {
      listingStatus = 'pending';
    }

    const newProduct = new Product({
      name,
      price: parseFloat(price),
      status: listingStatus,
      category: category || "Uncategorized",
      description: description || "",
      stock: parseInt(stock) || 1,
      images: images,
      warranty: warranty,
      refundDeadline: refundDeadline,
      sellerId: access.sellerId, // attach resolved seller (student/seller)
    });

    const savedProduct = await newProduct.save();

    // If added by caregiver, log in caregiver activity log
    if (access.caregiver) {
      access.caregiver.activityLog = access.caregiver.activityLog || [];
      access.caregiver.activityLog.unshift({
        action: 'Added product',
        accountId: access.sellerId,
        details: `Created new listing for "${name}" ($${parseFloat(price).toFixed(2)})`,
        resourceType: 'product',
        resourceName: name,
        timestamp: new Date()
      });
      await access.caregiver.save();
    }

    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: "Error adding product", error: err.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Soft-delete a product by ID for the logged-in seller.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0e2"
 *         description: MongoDB Product ID to delete.
 *     responses:
 *       200:
 *         description: Product removed from listing.
 *         content:
 *           application/json:
 *             example:
 *               message: "Product removed from your listing"
 *       403:
 *         description: Not authorized to delete this product.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Soft delete a product by ID (seller or authorized caregiver)
// @route   DELETE /api/products/:id
// @access  Private
// ==============================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let isOwner = product.sellerId.toString() === req.user.id;
    let caregiver = null;

    if (!isOwner && req.user.role === 'caregiver') {
      caregiver = await Caregiver.findOne({ user: req.user.id });
      const managed = caregiver?.managedAccounts?.find(m => String(m.accountId) === String(product.sellerId));
      if (managed && (managed.permissions?.manageProducts || managed.permissions?.canDeleteProducts)) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    // Soft delete - mark as deleted instead of removing from database
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();
    
    if (caregiver) {
      caregiver.activityLog = caregiver.activityLog || [];
      caregiver.activityLog.unshift({
        action: 'Deleted product',
        accountId: product.sellerId,
        details: `Deleted listing for "${product.name}"`,
        resourceType: 'product',
        resourceName: product.name,
        timestamp: new Date()
      });
      await caregiver.save();
    }

    res.json({ message: "Product removed from your listing" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID for the logged-in seller.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0e2"
 *         description: MongoDB Product ID to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Handmade Beaded Maasai Bracelet (Premium)"
 *               price:
 *                 type: number
 *                 example: 29.99
 *               status:
 *                 type: string
 *                 enum: [active, inactive, sold, draft]
 *                 example: active
 *               category:
 *                 type: string
 *                 example: "Jewelry & Crafts"
 *               description:
 *                 type: string
 *                 example: "Updated description for premium handmade beaded bracelet."
 *               stock:
 *                 type: integer
 *                 example: 20
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - "https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500"
 *                   - "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500"
 *                   - "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500"
 *               warranty:
 *                 type: string
 *                 example: "1 Year replacement guarantee"
 *               refundDeadline:
 *                 type: string
 *                 example: "30 days from delivery"
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               _id: "65f1a2b3c4d5e6f7a8b9c0e2"
 *               name: "Handmade Beaded Maasai Bracelet (Premium)"
 *               price: 29.99
 *               status: "active"
 *               category: "Jewelry & Crafts"
 *               stock: 20
 *       403:
 *         description: Not authorized.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Update a product by ID (seller or authorized caregiver)
// @route   PUT /api/products/:id
// @access  Private
// ==============================
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, price, status, category, description, stock, images, warranty, refundDeadline } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let isOwner = product.sellerId.toString() === req.user.id;
    let caregiver = null;

    if (!isOwner && req.user.role === 'caregiver') {
      caregiver = await Caregiver.findOne({ user: req.user.id });
      const managed = caregiver?.managedAccounts?.find(m => String(m.accountId) === String(product.sellerId));
      if (managed && (managed.permissions?.manageProducts || managed.permissions?.canEditProducts)) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = parseFloat(price);
    if (status !== undefined) product.status = status;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) product.stock = parseInt(stock) || 0;
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (warranty !== undefined) product.warranty = warranty;
    if (refundDeadline !== undefined) product.refundDeadline = refundDeadline;

    const updatedProduct = await product.save();

    if (caregiver) {
      caregiver.activityLog = caregiver.activityLog || [];
      caregiver.activityLog.unshift({
        action: 'Updated product listing',
        accountId: product.sellerId,
        details: `Updated details for "${product.name}" ($${product.price.toFixed(2)})`,
        resourceType: 'product',
        resourceName: product.name,
        timestamp: new Date()
      });
      await caregiver.save();
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
});

// ==============================
// @desc    Get single product by ID with populated seller & school details
// @route   GET /api/products/:id
// @access  Public
// ==============================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name email businessName role school profilePhoto bio disabilityType location phone');

    if (!product || product.isDeleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increment view count asynchronously
    Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    const seller = product.sellerId || {};
    let schoolName = 'Hope Community Academy';
    if (seller.school) {
      const schoolDoc = await School.findById(seller.school);
      if (schoolDoc) schoolName = schoolDoc.name;
    }

    res.json({
      id: product._id,
      _id: product._id,
      name: product.name,
      price: product.price,
      status: product.status || 'active',
      category: product.category || 'Handmade Crafts',
      description: product.description || '',
      stock: product.stock ?? 1,
      images: (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1503602642458-232111445657?w=500']),
      image: (product.images && product.images[0]) || product.image || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500',
      seller: seller.businessName || seller.name || schoolName,
      sellerName: seller.name || 'Artisan Partner',
      sellerId: seller._id,
      sellerRole: seller.role || 'seller',
      sellerBio: seller.bio || 'Talented artisan crafting unique handmade goods with passion and care.',
      disabilityType: seller.disabilityType || 'Special Needs Artisan',
      school: schoolName,
      location: seller.location || 'Nairobi, Kenya',
      rating: 4.8,
      reviewCount: Math.max(3, (product.totalSold || 0) * 2 + 5),
      totalSold: product.totalSold || 0,
      viewCount: (product.viewCount || 0) + 1,
      warranty: product.warranty || '6-month craftsmanship guarantee',
      refundDeadline: product.refundDeadline || '14 days from delivery',
      reviews: [
        { id: 1, user: 'Sarah M.', rating: 5, comment: 'Absolutely beautiful craftsmanship! Proud to support this cause.', date: '2026-08-15' },
        { id: 2, user: 'David K.', rating: 5, comment: 'High quality and prompt delivery. Highly recommend!', date: '2026-08-20' },
        { id: 3, user: 'Emma W.', rating: 4, comment: 'Wonderful texture and lovely finish.', date: '2026-09-02' }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching product details", error: err.message });
  }
});

// ==============================
// @desc    Send inquiry / message to product seller from buyer
// @route   POST /api/products/:id/inquiry
// @access  Public or Protected
// ==============================
router.post("/:id/inquiry", async (req, res) => {
  try {
    const { buyerName, buyerEmail, message, buyerId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Resolve buyer ID or default to an existing user
    let bId = buyerId;
    if (!bId) {
      const buyerUser = await User.findOne({ email: buyerEmail || 'david.buyer@example.com' });
      bId = buyerUser?._id || product.sellerId;
    }

    const inquiry = new Inquiry({
      sellerId: product.sellerId,
      buyerId: bId,
      productId: product._id,
      productName: product.name,
      buyerName: buyerName || 'Interested Buyer',
      buyerEmail: buyerEmail || 'buyer@example.com',
      message: message,
      status: 'new',
      replies: []
    });

    await inquiry.save();

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully to the artisan!",
      inquiry
    });
  } catch (err) {
    res.status(500).json({ message: "Error sending inquiry", error: err.message });
  }
});

export default router;
