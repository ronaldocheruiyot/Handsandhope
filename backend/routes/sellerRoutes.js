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
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile returned.
 *       401:
 *         description: Unauthorized.
 */
// Get seller profile
router.get("/profile", authMiddleware, getProfile);

/**
 * @openapi
 * /api/sellers/profile:
 *   put:
 *     summary: Update the logged-in seller profile.
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
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seller profile updated.
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
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller account deactivated.
 *       401:
 *         description: Unauthorized.
 */
// Deactivate account
router.put("/deactivate", authMiddleware, deactivateAccount);

/**
 * @openapi
 * /api/sellers/delete:
 *   delete:
 *     summary: Permanently delete the logged-in seller account.
 *     tags:
 *       - Sellers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller account deleted.
 *       401:
 *         description: Unauthorized.
 */
// Delete account
router.delete("/delete", authMiddleware, deleteAccount);

export default router;
