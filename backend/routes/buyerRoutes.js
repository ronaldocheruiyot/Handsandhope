import express from "express";
import {
  registerBuyer,
  loginBuyer,
  getBuyerProfile,
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
 *     tags:
 *       - Buyers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Buyer registered successfully.
 *       400:
 *         description: Validation error or email already exists.
 */
// Public routes
router.post("/register", registerBuyer);

/**
 * @openapi
 * /api/buyers/login:
 *   post:
 *     summary: Login as a buyer.
 *     tags:
 *       - Buyers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful.
 *       400:
 *         description: Invalid credentials.
 */
router.post("/login", loginBuyer);

/**
 * @openapi
 * /api/buyers/profile:
 *   get:
 *     summary: Get the logged-in buyer profile.
 *     tags:
 *       - Buyers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer profile returned.
 *       401:
 *         description: Unauthorized.
 */
// Protected routes
router.get("/profile", authMiddleware, getBuyerProfile);

/**
 * @openapi
 * /api/buyers/deactivate:
 *   put:
 *     summary: Deactivate the logged-in buyer account.
 *     tags:
 *       - Buyers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer account deactivated.
 *       401:
 *         description: Unauthorized.
 */
router.put("/deactivate", authMiddleware, deactivateBuyer);

/**
 * @openapi
 * /api/buyers/delete:
 *   delete:
 *     summary: Permanently delete the logged-in buyer account.
 *     tags:
 *       - Buyers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer account deleted.
 *       401:
 *         description: Unauthorized.
 */
router.delete("/delete", authMiddleware, deleteBuyer);

export default router;
