import express from "express";
import {
  registerBuyer,
  loginBuyer,
  getBuyerProfile,
  updateBuyerProfile,
  updateBuyerPassword,
  getBuyerOrders,
  createBuyerOrder,
  getBuyerInquiries,
  deactivateBuyer,
  deleteBuyer,
} from "../controllers/buyerController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/buyers/register:
 *   post:
 *     summary: Register a new buyer account.
 *     description: Create a customer/buyer account to purchase handcrafted items.
 *     tags:
 *       - Buyers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Customer"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.buyer@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *               phoneNumber:
 *                 type: string
 *                 example: "+254798765432"
 *           example:
 *             name: "Jane Customer"
 *             email: "jane.buyer@example.com"
 *             password: "Password123!"
 *             phoneNumber: "+254798765432"
 *     responses:
 *       201:
 *         description: Buyer registered successfully.
 *         content:
 *           application/json:
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               buyer:
 *                 _id: "65f1a2b3c4d5e6f7a8b9c0d9"
 *                 name: "Jane Customer"
 *                 email: "jane.buyer@example.com"
 *                 phoneNumber: "+254798765432"
 *       400:
 *         description: Validation error or email already exists.
 *       500:
 *         description: Server error.
 */
// Public routes
router.post("/register", registerBuyer);

/**
 * @openapi
 * /api/buyers/login:
 *   post:
 *     summary: Login as a buyer.
 *     description: Authenticate buyer with email and password to receive JWT token.
 *     tags:
 *       - Buyers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.buyer@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *           example:
 *             email: "jane.buyer@example.com"
 *             password: "Password123!"
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               buyer:
 *                 _id: "65f1a2b3c4d5e6f7a8b9c0d9"
 *                 name: "Jane Customer"
 *                 email: "jane.buyer@example.com"
 *                 phoneNumber: "+254798765432"
 *       401:
 *         description: Invalid credentials.
 *       404:
 *         description: Buyer not found.
 *       500:
 *         description: Server error.
 */
router.post("/login", loginBuyer);

/**
 * @openapi
 * /api/buyers/profile:
 *   get:
 *     summary: Get the logged-in buyer profile.
 *     description: Retrieve profile information for the authenticated buyer.
 *     tags:
 *       - Buyers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer profile returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               _id: "65f1a2b3c4d5e6f7a8b9c0d9"
 *               name: "Jane Customer"
 *               email: "jane.buyer@example.com"
 *               phoneNumber: "+254798765432"
 *               isActive: true
 *       404:
 *         description: Buyer not found.
 *       500:
 *         description: Server error.
 */

// Protected routes
router.get("/profile", authMiddleware, getBuyerProfile);
router.put("/profile", authMiddleware, updateBuyerProfile);
router.put("/password", authMiddleware, updateBuyerPassword);
router.get("/orders", authMiddleware, getBuyerOrders);
router.post("/orders", authMiddleware, createBuyerOrder);
router.get("/inquiries", authMiddleware, getBuyerInquiries);

/**
 * @openapi
 * /api/buyers/deactivate:
 *   put:
 *     summary: Deactivate the logged-in buyer account.
 *     description: Set buyer account status to inactive.
 *     tags:
 *       - Buyers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer account deactivated.
 *         content:
 *           application/json:
 *             example:
 *               message: "Account deactivated"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.put("/deactivate", authMiddleware, deactivateBuyer);

/**
 * @openapi
 * /api/buyers/delete:
 *   delete:
 *     summary: Permanently delete the logged-in buyer account.
 *     description: Delete buyer account from the database.
 *     tags:
 *       - Buyers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer account deleted successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Buyer account deleted successfully"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.delete("/delete", authMiddleware, deleteBuyer);

export default router;
