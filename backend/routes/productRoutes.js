import express from "express";
import Product from "../models/Product.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Get all products.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of products.
 *       500:
 *         description: Server error.
 */
// ==============================\
// @desc    Get all products
// @route   GET /api/products
// @access  Public
// ==============================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find(); // fetch all from MongoDB
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
}); 

/**
 * @openapi
 * /api/products/seller:
 *   get:
 *     summary: Get products for the logged-in seller (excluding soft-deleted).
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller products.
 *       401:
 *         description: Unauthorized.
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
    const products = await Product.find({ 
      sellerId: req.user.id,
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
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               warranty:
 *                 type: string
 *               refundDeadline:
 *                 type: string
 *             required:
 *               - name
 *               - price
 *               - images
 *     responses:
 *       201:
 *         description: Product created.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Add a new product (seller)
// @route   POST /api/products
// @access  Private (seller only)
// ==============================
router.post("/", authMiddleware, async (req, res) => {
  try {
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

    const newProduct = new Product({
      name,
      price: parseFloat(price),
      status: status || "active",
      category: category || "Uncategorized",
      description: description || "",
      stock: parseInt(stock) || 1,
      images: images,
      warranty: warranty,
      refundDeadline: refundDeadline,
      sellerId: req.user.id, // attach seller
    });

    const savedProduct = await newProduct.save();
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
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID.
 *     responses:
 *       200:
 *         description: Product removed from listing.
 *       403:
 *         description: Not authorized.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Soft delete a product by ID (seller) - keeps in database for records
// @route   DELETE /api/products/:id
// @access  Private (seller only)
// ==============================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Soft delete - mark as deleted instead of removing from database
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();
    
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
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               warranty:
 *                 type: string
 *               refundDeadline:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated.
 *       403:
 *         description: Not authorized.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
// ==============================
// @desc    Update a product by ID (seller)
// @route   PUT /api/products/:id
// @access  Private (seller only)
// ==============================
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, price, status, category, description, stock, images, warranty, refundDeadline } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update fields
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (status) product.status = status;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (stock) product.stock = parseInt(stock);
    if (images) product.images = images;
    if (warranty !== undefined) product.warranty = warranty;
    if (refundDeadline !== undefined) product.refundDeadline = refundDeadline;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
});

export default router;
