import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  updateProfile,
  getProfile,
  deactivateAccount,
  deleteAccount,
} from "../controllers/sellerController.js";

const router = express.Router();

/**
 * @openapi
 * /api/sellers/profile:
 *   get:
 *     summary: Get the logged-in seller profile.
 *     description: Retrieve detailed profile information for the authenticated seller.
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               _id: "65f1a2b3c4d5e6f7a8b9c0d1"
 *               name: "Alice Mwangi"
 *               email: "alice.seller@example.com"
 *               phone: "+254712345678"
 *               businessName: "Alice Beadworks & Crafts"
 *               bio: "Crafting handmade jewelry and woven baskets with over 8 years of artisan experience."
 *               role: "seller"
 *               active: true
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Seller not found.
 */
// Get seller profile
router.get("/profile", authMiddleware, getProfile);

/**
 * @openapi
 * /api/sellers/profile:
 *   put:
 *     summary: Update the logged-in seller profile.
 *     description: Update seller basic information (full name, phone, business name, email).
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Alice Mwangi"
 *               phoneNumber:
 *                 type: string
 *                 example: "+254712345678"
 *               businessName:
 *                 type: string
 *                 example: "Alice Beadworks & Crafts"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice.seller@example.com"
 *               bio:
 *                 type: string
 *                 example: "Artisan specializing in sustainable woven handicrafts and recycled glass bead jewelry."
 *           example:
 *             fullName: "Alice Mwangi"
 *             phoneNumber: "+254712345678"
 *             businessName: "Alice Beadworks & Crafts"
 *             email: "alice.seller@example.com"
 *     responses:
 *       200:
 *         description: Seller profile updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Profile updated"
 *               user:
 *                 _id: "65f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Alice Mwangi"
 *                 businessName: "Alice Beadworks & Crafts"
 *                 email: "alice.seller@example.com"
 *                 phone: "+254712345678"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Seller not found.
 */
// Update seller profile
router.put("/profile", authMiddleware, updateProfile);

/**
 * @openapi
 * /api/sellers/deactivate:
 *   put:
 *     summary: Deactivate the logged-in seller account.
 *     description: Temporarily deactivate the authenticated seller account.
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller account deactivated.
 *         content:
 *           application/json:
 *             example:
 *               message: "Account deactivated"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */
// Deactivate account
router.put("/deactivate", authMiddleware, deactivateAccount);

/**
 * @openapi
 * /api/sellers/delete:
 *   delete:
 *     summary: Permanently delete the logged-in seller account.
 *     description: Delete the authenticated seller's user record permanently.
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller account deleted.
 *         content:
 *           application/json:
 *             example:
 *               message: "Account deleted permanently"
 *       401:
 *         description: Unauthorized.
 */
// Delete account
router.delete("/delete", authMiddleware, deleteAccount);

export default router;
