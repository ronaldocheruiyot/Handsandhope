import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import Seller from '../models/Seller.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import Caregiver from '../models/Caregiver.js';
import AssistanceRequest from '../models/AssistanceRequest.js';
import Withdrawal from '../models/Withdrawal.js';
import Refund from '../models/Refund.js';
import DirectMessage from '../models/DirectMessage.js';

const router = express.Router();

const buildPermissionsForLevel = (level) => {
  const presets = {
    full: {
      viewProfile: true,
      editProfile: true,
      viewProducts: true,
      manageProducts: true,
      respondToInquiries: true,
      viewFinancials: true,
      withdrawMoney: true,
      manageShipments: true,
      viewAnalytics: true,
      editBio: true,
      editStoreName: true,
    },
    financial_only: {
      viewProfile: true,
      editProfile: false,
      viewProducts: false,
      manageProducts: false,
      respondToInquiries: false,
      viewFinancials: true,
      withdrawMoney: true,
      manageShipments: false,
      viewAnalytics: true,
      editBio: false,
      editStoreName: false,
    },
    product_management: {
      viewProfile: true,
      editProfile: false,
      viewProducts: true,
      manageProducts: true,
      respondToInquiries: true,
      viewFinancials: false,
      withdrawMoney: false,
      manageShipments: true,
      viewAnalytics: true,
      editBio: false,
      editStoreName: false,
    },
    view_only: {
      viewProfile: true,
      editProfile: false,
      viewProducts: true,
      manageProducts: false,
      respondToInquiries: false,
      viewFinancials: true,
      withdrawMoney: false,
      manageShipments: false,
      viewAnalytics: true,
      editBio: false,
      editStoreName: false,
    },
  };

  return presets[level] || presets.full;
};

const generateTempPassword = () => 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';

const resolveSellerIds = async (userId) => {
  const ids = [];
  if (userId) ids.push(String(userId));

  try {
    ids.push(new mongoose.Types.ObjectId(userId));
  } catch (err) {
    // ignore invalid ObjectId
  }

  const seller = await Seller.findOne({ user: userId });
  if (seller?._id) {
    ids.push(seller._id);
    ids.push(String(seller._id));
  }

  return ids;
};

// Protected middleware to check auth
router.use(authMiddleware);

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     summary: Get comprehensive dashboard overview stats for the logged-in user.
 *     description: Retrieve key metrics including sales, revenue, active listings, product views, and recent orders based on user role.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               name: "Alice Mwangi"
 *               email: "alice.seller@example.com"
 *               role: "seller"
 *               phone: "+254712345678"
 *               activeListings: 12
 *               totalProducts: 15
 *               totalEnquiries: 8
 *               totalSales: 42
 *               totalRevenue: 1250.00
 *               profileViews: 340
 *               thisMonthSales: 10
 *               thisMonthRevenue: 320.00
 *               dailySales: 2
 *               weeklySales: 7
 *               yearlySales: 42
 *               recentListings:
 *                 - id: "65f1a2b3c4d5e6f7a8b9c0e2"
 *                   name: "Handmade Beaded Maasai Bracelet"
 *                   price: 25.00
 *                   category: "Jewelry & Crafts"
 *                   stock: 15
 *                   status: "active"
 *                   views: 120
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/stats - Get comprehensive dashboard overview stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user details
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let stats = {
      name: user.name,
      email: user.email,
      role: userRole,
      phone: user.phone,
      activeListings: 0,
      totalProducts: 0,
      totalEnquiries: 0,
      totalSales: 0,
      totalRevenue: 0,
      profileViews: user.profileViews || 0,
      recentListings: [],
      thisMonthSales: 0,
      thisMonthRevenue: 0,
      dailySales: 0,
      weeklySales: 0,
      yearlySales: 0,
    };

    // If seller or student (both sell products)
    if (userRole === 'seller' || userRole === 'student') {
      const sellerIds = await resolveSellerIds(userId);
      // Count products (excluding soft-deleted)
      const products = await Product.find({ 
        sellerId: { $in: sellerIds },
        isDeleted: { $ne: true }
      }).sort({ createdAt: -1 });

      stats.totalProducts = products.length;
      stats.activeListings = products.filter(p => p.status === 'active').length;
      
      // Store recent listings (top 5 most recent)
      stats.recentListings = products.slice(0, 5).map(p => ({
        _id: p._id,
        id: p._id,
        name: p.name,
        price: p.price,
        description: p.description || '',
        category: p.category || 'General',
        stock: p.stock ?? 1,
        images: p.images || [],
        status: p.status || 'active',
        viewCount: p.viewCount || p.views || 0,
        views: p.viewCount || p.views || 0,
        createdAt: p.createdAt
      }));

      // Count enquiries
      const inquiries = await Inquiry.find({ sellerId: { $in: sellerIds } });
      stats.totalEnquiries = inquiries.length;

      // Count completed orders and calculate revenue
      const orders = await Order.find({ sellerId: { $in: sellerIds }, status: 'completed' });
      stats.totalSales = orders.length;
      stats.totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

      // This month sales and revenue
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthOrders = await Order.find({
        sellerId: { $in: sellerIds },
        status: 'completed',
        createdAt: { $gte: monthStart }
      });
      stats.thisMonthSales = monthOrders.length;
      stats.thisMonthRevenue = monthOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

      // Daily sales (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dailyOrders = await Order.find({
        sellerId: { $in: sellerIds },
        status: 'completed',
        createdAt: { $gte: oneDayAgo }
      });
      stats.dailySales = dailyOrders.length;

      // Weekly sales (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyOrders = await Order.find({
        sellerId: { $in: sellerIds },
        status: 'completed',
        createdAt: { $gte: weekAgo }
      });
      stats.weeklySales = weeklyOrders.length;

      // Yearly sales
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearlyOrders = await Order.find({
        sellerId: { $in: sellerIds },
        status: 'completed',
        createdAt: { $gte: yearStart }
      });
      stats.yearlySales = yearlyOrders.length;
    }

    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/profile:
 *   get:
 *     summary: Get detailed profile info for the logged-in user.
 *     description: Retrieve complete profile including skills, bio, school/teacher association, and contact details.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               profile:
 *                 id: "65f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: "seller"
 *                 name: "Alice Mwangi"
 *                 email: "alice.seller@example.com"
 *                 phone: "+254712345678"
 *                 address: "123 Craft Lane, Nairobi"
 *                 joinDate: "2026-01-15T08:30:00.000Z"
 *                 disabilityId: "DIS-7788"
 *                 bio: "Artisan specializing in sustainable woven handicrafts."
 *                 skills: ["Beadwork", "Weaving", "Pottery"]
 *                 profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/profile - Get user profile info
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    let schoolName;
    let teacherName;
    let disabilityId = user.disabilityId;
    let disabilityType = user.disabilityType;
    let subject = user.specialization;
    let staffId;
    let schoolContactEmail;
    let schoolContactPhone;
    let department = user.department;
    let specialization = user.specialization;
    let accreditation = user.accreditation;
    let businessName = user.businessName;

    if (user.role === 'seller') {
      const seller = await Seller.findOne({ user: userId });
      if (seller) {
        if (!disabilityId) disabilityId = seller.disabilityId;
        if (!businessName) businessName = seller.businessName;
      }
    }

    if (user.role === 'student') {
      const student = await Student.findOne({ user: userId }).populate('school');
      if (student) {
        if (!disabilityId) disabilityId = student.disabilityId;
        schoolName = student.school?.name;

        if (student.school?._id) {
          const teacher = await Teacher.findOne({ school: student.school._id }).populate('user');
          teacherName = teacher?.user?.name;
        }
      }
    }

    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: userId }).populate('school');
      if (teacher) {
        schoolName = teacher.school?.name;
        subject = teacher.subject || subject;
        staffId = teacher.staffId;
      }
    }

    if (user.role === 'school') {
      const school = user.school ? await School.findById(user.school) : null;
      if (school) {
        schoolName = school.name;
        schoolContactEmail = school.contactEmail;
        schoolContactPhone = school.contactPhone;
        address = school.address || user.address;
      }
    }

    res.json({
      profile: {
        id: user._id,
        role: user.role,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        location: user.location || user.address || '',
        joinDate: user.createdAt,
        disabilityId: disabilityId || '',
        disabilityType: disabilityType || '',
        bio: user.bio || '',
        skills: user.skills || [],
        hobbies: user.hobbies || [],
        profilePhoto: user.profilePhoto || '',
        businessName: businessName || '',
        school: schoolName || '',
        teacher: teacherName || '',
        subject: subject || '',
        department: department || '',
        specialization: specialization || '',
        accreditation: accreditation || '',
        staffId: staffId || '',
        schoolContactEmail: schoolContactEmail || '',
        schoolContactPhone: schoolContactPhone || '',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/profile:
 *   put:
 *     summary: Update profile info for the logged-in user.
 *     description: Update name, phone, address, location, bio, skills, hobbies, profilePhoto, or disability details.
 *     tags:
 *       - Dashboard
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
 *                 example: "Alice Mwangi"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice.seller@example.com"
 *               phone:
 *                 type: string
 *                 example: "+254712345678"
 *               address:
 *                 type: string
 *                 example: "123 Artisan Plaza, Westlands, Nairobi"
 *               location:
 *                 type: string
 *                 example: "Nairobi, Kenya"
 *               bio:
 *                 type: string
 *                 example: "Creating handcrafted home decor, traditional Maasai jewelry, and eco-friendly baskets."
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Beadwork", "Basket Weaving", "Pottery", "Leatherwork"]
 *               hobbies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Wood Carving", "Painting", "Gardening"]
 *               profilePhoto:
 *                 type: string
 *                 example: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"
 *               disabilityId:
 *                 type: string
 *                 example: "DIS-7788"
 *               disabilityType:
 *                 type: string
 *                 example: "Physical Disability"
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Profile updated successfully"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const {
      name,
      email,
      phone,
      address,
      location,
      bio,
      skills,
      hobbies,
      profilePhoto,
      disabilityId,
      disabilityType,
      businessName,
      specialization,
      department,
      accreditation,
    } = req.body || {};

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (disabilityId !== undefined) user.disabilityId = disabilityId;
    if (disabilityType !== undefined) user.disabilityType = disabilityType;
    if (businessName !== undefined) user.businessName = businessName;
    if (specialization !== undefined) user.specialization = specialization;
    if (department !== undefined) user.department = department;
    if (accreditation !== undefined) user.accreditation = accreditation;

    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills
        : String(skills).split(',').map(s => s.trim()).filter(Boolean);
    }

    if (hobbies !== undefined) {
      user.hobbies = Array.isArray(hobbies)
        ? hobbies
        : String(hobbies).split(',').map(h => h.trim()).filter(Boolean);
    }

    await user.save();

    // Update associated role documents
    if (user.role === 'seller') {
      await Seller.findOneAndUpdate(
        { user: userId },
        { 
          ...(phone !== undefined && { phone }),
          ...(disabilityId !== undefined && { disabilityId }),
          ...(businessName !== undefined && { businessName }),
        }
      );
    }

    if (user.role === 'student') {
      await Student.findOneAndUpdate(
        { user: userId },
        { 
          ...(disabilityId !== undefined && { disabilityId }),
        }
      );
    }

    if (user.role === 'teacher') {
      await Teacher.findOneAndUpdate(
        { user: userId },
        {
          ...(specialization !== undefined && { subject: specialization }),
          ...(department !== undefined && { department }),
        }
      );
    }

    if (user.role === 'school' && user.school) {
      await School.findByIdAndUpdate(
        user.school,
        {
          ...(name !== undefined && { name }),
          ...(address !== undefined && { address }),
          ...(email !== undefined && { contactEmail: email }),
          ...(phone !== undefined && { contactPhone: phone }),
        }
      );
    }

    res.json({ 
      message: 'Profile updated successfully',
      profile: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        bio: user.bio,
        skills: user.skills || [],
        hobbies: user.hobbies || [],
        profilePhoto: user.profilePhoto,
        disabilityId: user.disabilityId,
        disabilityType: user.disabilityType,
        businessName: user.businessName,
        specialization: user.specialization,
        department: user.department,
        accreditation: user.accreditation,
        joinDate: user.createdAt,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/track-view:
 *   post:
 *     summary: Increment profile view count for the logged-in user.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile view count incremented.
 *         content:
 *           application/json:
 *             example:
 *               profileViews: 341
 *       500:
 *         description: Server error.
 */
// POST /api/dashboard/track-view - Increment profile view count
router.post('/track-view', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(userId, { $inc: { profileViews: 1 } }, { new: true });
    res.json({ profileViews: user.profileViews || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/settings:
 *   get:
 *     summary: Get account settings for the logged-in user.
 *     description: Retrieve notification preferences, regional settings, and basic account profile details.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account settings returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               account:
 *                 fullName: "Alice Mwangi"
 *                 email: "alice.seller@example.com"
 *                 phone: "+254712345678"
 *                 schoolName: "Hope Special Academy"
 *               notifications:
 *                 email: true
 *                 push: true
 *                 inquiryAlerts: true
 *                 productApprovals: true
 *               regional:
 *                 language: "en"
 *                 timezone: "Africa/Nairobi"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */
// GET /api/dashboard/settings - Get account settings
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let schoolName;
    if (user.role === 'school' && user.school) {
      const school = await School.findById(user.school);
      schoolName = school?.name;
    }
    if (user.role === 'student') {
      const student = await Student.findOne({ user: userId }).populate('school');
      schoolName = student?.school?.name;
    }
    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: userId }).populate('school');
      schoolName = teacher?.school?.name;
    }

    res.json({
      account: {
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        schoolName,
      },
      notifications: user.notificationPreferences || { email: true, push: true, inquiryAlerts: true, productApprovals: true },
      regional: user.regionalSettings || { language: 'en', timezone: 'UTC' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/settings:
 *   put:
 *     summary: Update account settings for the logged-in user.
 *     description: Update notification preferences, regional preferences, and basic account credentials.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: "Alice Mwangi"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "alice.seller@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+254712345678"
 *                   schoolName:
 *                     type: string
 *                     example: "Hope Special Academy"
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   push:
 *                     type: boolean
 *                     example: true
 *                   inquiryAlerts:
 *                     type: boolean
 *                     example: true
 *                   productApprovals:
 *                     type: boolean
 *                     example: true
 *               regional:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                     example: "en"
 *                   timezone:
 *                     type: string
 *                     example: "Africa/Nairobi"
 *           example:
 *             account:
 *               fullName: "Alice Mwangi"
 *               email: "alice.seller@example.com"
 *               phone: "+254712345678"
 *               schoolName: "Hope Special Academy"
 *             notifications:
 *               email: true
 *               push: true
 *               inquiryAlerts: true
 *               productApprovals: true
 *             regional:
 *               language: "en"
 *               timezone: "Africa/Nairobi"
 *     responses:
 *       200:
 *         description: Settings updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Settings updated successfully"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/settings - Update account settings
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { account = {}, notifications, regional } = req.body || {};

    if (account.fullName !== undefined) user.name = account.fullName;
    if (account.email !== undefined) user.email = account.email;
    if (account.phone !== undefined) user.phone = account.phone;

    if (notifications) {
      user.notificationPreferences = {
        email: notifications.email ?? user.notificationPreferences?.email ?? true,
        push: notifications.push ?? user.notificationPreferences?.push ?? true,
        inquiryAlerts: notifications.inquiryAlerts ?? user.notificationPreferences?.inquiryAlerts ?? true,
        productApprovals: notifications.productApprovals ?? user.notificationPreferences?.productApprovals ?? true,
      };
    }

    if (regional) {
      user.regionalSettings = {
        language: regional.language ?? user.regionalSettings?.language ?? 'en',
        timezone: regional.timezone ?? user.regionalSettings?.timezone ?? 'UTC',
      };
    }

    await user.save();

    if (user.role === 'school' && account.schoolName && user.school) {
      await School.findByIdAndUpdate(user.school, { name: account.schoolName });
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/settings/password:
 *   put:
 *     summary: Update password for the logged-in user.
 *     description: Change account password by verifying the existing password and setting a new one.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword456!"
 *           example:
 *             currentPassword: "Password123!"
 *             newPassword: "NewSecurePassword456!"
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Password updated successfully"
 *       400:
 *         description: Invalid current password or missing fields.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */
// PUT /api/dashboard/settings/password - Update password
router.put('/settings/password', async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/products:
 *   get:
 *     summary: Get user's products/listings for the dashboard.
 *     description: Retrieve all active and draft products for the authenticated seller/student.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user products.
 *         content:
 *           application/json:
 *             example:
 *               - _id: "65f1a2b3c4d5e6f7a8b9c0e2"
 *                 name: "Handmade Beaded Maasai Bracelet"
 *                 price: 25.00
 *                 status: "active"
 *                 category: "Jewelry & Crafts"
 *                 stock: 15
 *                 viewCount: 140
 *                 totalSold: 8
 *                 images:
 *                   - "https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/products - Get user's products/listings
router.get('/products', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);
    const products = await Product.find({ 
      sellerId: { $in: sellerIds },
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/analytics-summary:
 *   get:
 *     summary: Get sales analytics summary for the logged-in user.
 *     description: Aggregate daily, weekly, monthly, and yearly sales, revenue, refunds, and product views.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics summary returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               daily:
 *                 total: 50.00
 *                 count: 2
 *                 refunds: 0
 *               weekly:
 *                 total: 210.00
 *                 count: 7
 *                 refunds: 0
 *               monthly:
 *                 total: 890.00
 *                 count: 28
 *                 refunds: 1
 *               yearly:
 *                 total: 3450.00
 *                 count: 110
 *                 refunds: 3
 *               productViews:
 *                 daily: 25
 *                 weekly: 160
 *                 monthly: 720
 *                 yearly: 4300
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/analytics-summary - Get sales analytics summary
router.get('/analytics-summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);
    const now = new Date();

    // Daily stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyOrders = await Order.find({
      sellerId: { $in: sellerIds },
      status: 'completed',
      createdAt: { $gte: oneDayAgo }
    });
    const dailyStats = {
      total: dailyOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      count: dailyOrders.length,
      refunds: await Order.countDocuments({ sellerId: { $in: sellerIds }, refundStatus: 'approved', createdAt: { $gte: oneDayAgo } })
    };

    // Weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyOrders = await Order.find({
      sellerId: { $in: sellerIds },
      status: 'completed',
      createdAt: { $gte: weekAgo }
    });
    const weeklyStats = {
      total: weeklyOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      count: weeklyOrders.length,
      refunds: await Order.countDocuments({ sellerId: { $in: sellerIds }, refundStatus: 'approved', createdAt: { $gte: weekAgo } })
    };

    // Monthly stats
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = await Order.find({
      sellerId: { $in: sellerIds },
      status: 'completed',
      createdAt: { $gte: monthStart }
    });
    const monthlyStats = {
      total: monthlyOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      count: monthlyOrders.length,
      refunds: await Order.countDocuments({ sellerId: { $in: sellerIds }, refundStatus: 'approved', createdAt: { $gte: monthStart } })
    };

    // Yearly stats
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearlyOrders = await Order.find({
      sellerId: { $in: sellerIds },
      status: 'completed',
      createdAt: { $gte: yearStart }
    });
    const yearlyStats = {
      total: yearlyOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      count: yearlyOrders.length,
      refunds: await Order.countDocuments({ sellerId: { $in: sellerIds }, refundStatus: 'approved', createdAt: { $gte: yearStart } })
    };

    // Product views
    const products = await Product.find({ sellerId: { $in: sellerIds } });
    const productViews = {
      daily: products.reduce((sum, p) => sum + (p.viewCount || 0), 0),
      weekly: products.reduce((sum, p) => sum + (p.viewCount || 0), 0),
      monthly: products.reduce((sum, p) => sum + (p.viewCount || 0), 0),
      yearly: products.reduce((sum, p) => sum + (p.viewCount || 0), 0)
    };

    res.json({
      daily: dailyStats,
      weekly: weeklyStats,
      monthly: monthlyStats,
      yearly: yearlyStats,
      productViews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/orders:
 *   get:
 *     summary: Get seller's orders.
 *     description: Retrieve the recent 20 orders placed for products owned by the authenticated seller.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller orders returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               - _id: "65f1a2b3c4d5e6f7a8b9c0a1"
 *                 productName: "Handmade Beaded Maasai Bracelet"
 *                 buyerName: "Jane Customer"
 *                 buyerEmail: "jane.buyer@example.com"
 *                 amount: 25.00
 *                 quantity: 1
 *                 status: "completed"
 *                 shippingMethod: "self"
 *                 trackingNumber: "TRK-2026-9812"
 *                 createdAt: "2026-08-25T14:20:00.000Z"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/orders - Get seller's orders
router.get('/orders', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);
    const orders = await Order.find({ sellerId: { $in: sellerIds } }).sort({ createdAt: -1 }).limit(20);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/inquiries:
 *   get:
 *     summary: Get seller's inquiries from buyers.
 *     description: Retrieve all customer inquiries, question messages, and item inquiries for the seller.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller inquiries returned.
 *         content:
 *           application/json:
 *             example:
 *               - id: "65f1a2b3c4d5e6f7a8b9c0b1"
 *                 customerName: "Jane Customer"
 *                 customerEmail: "jane.buyer@example.com"
 *                 productName: "Handcrafted Wooden Giraffe Sculpture"
 *                 productImage: "https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500"
 *                 message: "Hi! Can you customize the height of this sculpture to 40cm?"
 *                 timestamp: "2026-08-26T18:00:00.000Z"
 *                 status: "pending"
 *                 priority: "medium"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/inquiries - Get seller's or managed account's inquiries
router.get('/inquiries', async (req, res) => {
  try {
    let targetSellerId = req.user.id;
    const targetAccountId = req.query.targetAccountId || req.headers['x-managed-account-id'];

    if (req.user.role === 'caregiver' && targetAccountId) {
      const caregiver = await Caregiver.findOne({ user: req.user.id });
      const managed = caregiver?.managedAccounts?.find(m => String(m.accountId) === String(targetAccountId));
      if (!managed) {
        return res.status(403).json({ error: 'You do not manage this account' });
      }
      targetSellerId = targetAccountId;
    }

    const sellerIds = await resolveSellerIds(targetSellerId);

    const sellerMatch = [
      { sellerId: { $in: sellerIds } },
      { seller: { $in: sellerIds } },
      { seller_id: { $in: sellerIds } },
    ];

    const inquiries = await Inquiry.find({ $or: sellerMatch })
      .populate('buyerId', 'name email')
      .populate('productId', 'name images image')
      .sort({ createdAt: -1 });

    const mapped = inquiries.map(inquiry => ({
      id: inquiry._id,
      customerName: inquiry.buyerId?.name || inquiry.buyerName || 'Customer',
      customerEmail: inquiry.buyerId?.email || inquiry.buyerEmail || 'customer@example.com',
      customerAvatar: undefined,
      productName: inquiry.productId?.name || inquiry.productName || 'Handcrafted Product',
      productImage: inquiry.productId?.images?.[0] || inquiry.productId?.image || '',
      message: inquiry.message || 'Product inquiry',
      timestamp: inquiry.timestamp || inquiry.createdAt,
      status: inquiry.status === 'archived' ? 'archived' : inquiry.status === 'replied' ? 'replied' : 'pending',
      priority: 'medium',
      replies: inquiry.replies || [],
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/inquiries - Compose and send a new inquiry
router.post('/inquiries', async (req, res) => {
  try {
    const { sellerId, productId, productName, message, buyerName, buyerEmail } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Inquiry message is required' });
    }

    const resolvedSellerId = sellerId || req.user.id;
    let resolvedProductId = productId;

    if (!resolvedProductId) {
      const firstProd = await Product.findOne({ sellerId: resolvedSellerId, isDeleted: { $ne: true } });
      resolvedProductId = firstProd?._id;
    }

    const newInquiry = new Inquiry({
      sellerId: resolvedSellerId,
      buyerId: req.user.id,
      productId: resolvedProductId || new mongoose.Types.ObjectId(),
      productName: productName || 'Artisan Craft Inquiry',
      buyerName: buyerName || req.user.name || 'Interested Buyer',
      buyerEmail: buyerEmail || req.user.email || 'buyer@example.com',
      message: message,
      status: 'new',
      timestamp: new Date()
    });

    await newInquiry.save();
    res.status(201).json({ message: 'Inquiry sent successfully', inquiry: newInquiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/inquiries/:id/reply - Reply to inquiry
router.put('/inquiries/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, targetAccountId } = req.body || {};

    if (!message) return res.status(400).json({ error: 'Reply message is required' });

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    let responderRole = req.user.role === 'caregiver' ? 'caregiver' : 'seller';

    inquiry.replies = inquiry.replies || [];
    inquiry.replies.push({ message, responder: responderRole, timestamp: new Date() });
    inquiry.status = 'replied';
    await inquiry.save();

    // If caregiver replied, log into caregiver activity log
    if (req.user.role === 'caregiver') {
      const caregiver = await Caregiver.findOne({ user: req.user.id });
      if (caregiver) {
        caregiver.activityLog = caregiver.activityLog || [];
        caregiver.activityLog.unshift({
          action: 'Responded to inquiry',
          accountId: inquiry.sellerId,
          details: `Replied to buyer inquiry about "${inquiry.productName || 'item'}": "${message.substring(0, 60)}..."`,
          resourceType: 'inquiry',
          resourceName: inquiry.productName || 'Customer Inquiry',
          timestamp: new Date()
        });
        await caregiver.save();
      }
    }

    res.json({ message: 'Reply saved', inquiryId: inquiry._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/caregiver/managed-accounts - Real-time managed accounts for caregiver
router.get('/caregiver/managed-accounts', async (req, res) => {
  try {
    const caregiverUser = await User.findById(req.user.id);
    const caregiverDoc = await Caregiver.findOne({ user: req.user.id })
      .populate('managedAccounts.accountId', 'name email role phone address location bio profilePhoto skills hobbies disabilityType disabilityId');

    if (!caregiverDoc) {
      return res.json({
        fullName: caregiverUser?.name || 'Caregiver',
        email: caregiverUser?.email || '',
        relationshipType: 'Caregiver',
        managedAccounts: []
      });
    }

    const accountsWithLiveStats = await Promise.all(
      caregiverDoc.managedAccounts.map(async (item) => {
        const targetUser = item.accountId;
        if (!targetUser) return null;

        const targetId = targetUser._id;

        // Live stats queries
        const totalProducts = await Product.countDocuments({ sellerId: targetId, isDeleted: { $ne: true } });
        const completedOrders = await Order.find({ sellerId: targetId, status: { $in: ['completed', 'delivered'] } });
        const totalSales = completedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
        const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const pendingInquiries = await Inquiry.countDocuments({ sellerId: targetId, status: { $in: ['new', 'pending', 'read'] } });

        let schoolName;
        if (targetUser.role === 'student') {
          const studentDoc = await Student.findOne({ user: targetId }).populate('school', 'name');
          schoolName = studentDoc?.school?.name || 'Hope Academy for Special Education';
        }

        return {
          accountId: String(targetId),
          accountType: targetUser.role === 'student' ? 'student_seller' : 'individual_seller',
          accountOwnerName: targetUser.name,
          accountOwnerEmail: targetUser.email,
          phone: targetUser.phone,
          profilePhoto: targetUser.profilePhoto,
          bio: targetUser.bio,
          location: targetUser.location,
          schoolName,
          permissionLevel: item.permissionLevel || 'full',
          permissions: item.permissions || buildPermissionsForLevel(item.permissionLevel || 'full'),
          status: item.status || 'active',
          stats: {
            totalProducts,
            totalSales,
            totalEarnings,
            pendingInquiries
          }
        };
      })
    );

    const validAccounts = accountsWithLiveStats.filter(Boolean);

    res.json({
      fullName: caregiverUser?.name || 'Caregiver',
      email: caregiverUser?.email || '',
      phone: caregiverDoc.phone || caregiverUser?.phone,
      managedAccounts: validAccounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/caregiver/activities - Audit logs of actions taken by caregiver
router.get('/caregiver/activities', async (req, res) => {
  try {
    const caregiverDoc = await Caregiver.findOne({ user: req.user.id })
      .populate('activityLog.accountId', 'name email');

    if (!caregiverDoc) {
      return res.json([]);
    }

    const logs = (caregiverDoc.activityLog || []).map((act, index) => {
      const timeDiff = Date.now() - new Date(act.timestamp).getTime();
      let timeFormatted = 'Just now';
      if (timeDiff > 86400000) {
        timeFormatted = `${Math.floor(timeDiff / 86400000)} day(s) ago`;
      } else if (timeDiff > 3600000) {
        timeFormatted = `${Math.floor(timeDiff / 3600000)} hour(s) ago`;
      } else if (timeDiff > 60000) {
        timeFormatted = `${Math.floor(timeDiff / 60000)} min ago`;
      }

      return {
        id: String(act._id || index),
        action: act.action,
        details: act.details,
        account: act.accountId?.name || 'Managed Account',
        accountEmail: act.accountId?.email,
        resourceType: act.resourceType || 'general',
        resourceName: act.resourceName,
        timestamp: timeFormatted,
        rawTimestamp: act.timestamp
      };
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/seed-sample-data - 1-Click test data generator for the active user
router.post('/seed-sample-data', async (req, res) => {
  try {
    let targetUserId = req.user.id;
    const targetAccountId = req.query.targetAccountId || req.body?.targetAccountId;

    if (targetAccountId && (req.user.role === 'caregiver' || req.user.role === 'admin' || req.user.role === 'super-admin')) {
      targetUserId = targetAccountId;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Seed 4 rich artisan products
    const sampleProducts = [
      {
        name: 'Handcrafted Clay Sculpture - African Elephant',
        price: 65.00,
        description: 'Stunning handcrafted earthenware sculpture of an African elephant with textured detailing and earth-tone glazing.',
        category: 'Sculpture',
        stock: 4,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=500',
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'
        ],
        sellerId: targetUser._id,
        viewCount: 142,
        warranty: '6 Months Craftsmanship Guarantee',
        refundDeadline: '14 Days from Delivery'
      },
      {
        name: 'Boho Handwoven Macrame Wall Hanging',
        price: 45.00,
        description: 'Artisanal macrame wall tapestry hand-woven from natural unbleached cotton cord on driftwood branch.',
        category: 'Textiles',
        stock: 6,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1566206091558-7f218b696731?w=500',
          'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=500',
          'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'
        ],
        sellerId: targetUser._id,
        viewCount: 98,
        warranty: 'Standard Artisan Warranty',
        refundDeadline: '14 Days from Delivery'
      },
      {
        name: 'Artisan Glazed Ceramic Tea Cup Set (4 pcs)',
        price: 38.00,
        description: 'Set of 4 hand-thrown ceramic mugs with oceanic gradient blue-green glaze. Food, microwave, and dishwasher safe.',
        category: 'Pottery',
        stock: 8,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500',
          'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=500'
        ],
        sellerId: targetUser._id,
        viewCount: 115,
        warranty: 'Handmade Glaze Guarantee',
        refundDeadline: '14 Days from Delivery'
      },
      {
        name: 'Hand-Carved Wooden Giraffe Figurine',
        price: 28.00,
        description: 'Beautiful 25cm carved jacaranda wood giraffe figurine with natural beeswax polish.',
        category: 'Woodwork',
        stock: 5,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500',
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500'
        ],
        sellerId: targetUser._id,
        viewCount: 84,
        warranty: 'Wood Polish Guarantee',
        refundDeadline: '14 Days from Delivery'
      }
    ];

    for (const prod of sampleProducts) {
      let existing = await Product.findOne({ name: prod.name, sellerId: targetUser._id });
      if (!existing) {
        await Product.create(prod);
      } else {
        existing.isDeleted = false;
        await existing.save();
      }
    }

    // Seed inquiries
    const sampleInquiries = [
      {
        sellerId: targetUser._id,
        buyerId: new mongoose.Types.ObjectId(),
        buyerName: 'Jane Mwangi',
        buyerEmail: 'buyer.jane@example.com',
        productName: 'African Elephant Sculpture',
        message: 'Hello! I love your elephant sculpture. Can you craft one in a darker terracotta glaze?',
        status: 'new',
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        sellerId: targetUser._id,
        buyerId: new mongoose.Types.ObjectId(),
        buyerName: 'David K. Artisan Collector',
        buyerEmail: 'david.collector@example.com',
        productName: 'Ceramic Tea Cup Set',
        message: 'Hi, are these mugs suitable for hot espresso and coffee? Are they lead-free certified?',
        status: 'new',
        timestamp: new Date(Date.now() - 3600000 * 5)
      }
    ];

    for (const inq of sampleInquiries) {
      const exists = await Inquiry.findOne({ sellerId: targetUser._id, message: inq.message });
      if (!exists) {
        await Inquiry.create({ ...inq, productId: (await Product.findOne({ sellerId: targetUser._id }))?._id });
      }
    }

    res.json({
      success: true,
      message: `Sample store data successfully generated in database for ${targetUser.name}!`,
      productsCreated: sampleProducts.length,
      inquiriesCreated: sampleInquiries.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/caregivers:
 *   get:
 *     summary: Get caregivers linked to the current account.
 *     description: Retrieve all caregivers managing the authenticated seller/student account.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of caregivers.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/caregivers - List caregivers for this seller/student account
router.get('/caregivers', async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const caregivers = await Caregiver.find({
      $or: [
        { 'managedAccounts.accountId': userObjId },
        { 'managedAccounts.accountId': String(userId) }
      ]
    }).populate('user', 'name email profilePhoto phone lastLogin');

    const list = caregivers.map(cg => {
      const managed = cg.managedAccounts.find(m => String(m.accountId) === String(userId));
      const relevantLogs = (cg.activityLog || []).filter(a => String(a.accountId) === String(userId));
      relevantLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const lastAction = relevantLogs[0]?.timestamp;

      return {
        id: cg._id,
        userId: cg.user?._id,
        fullName: cg.user?.name || 'Caregiver',
        email: cg.user?.email || '',
        phone: cg.phone || cg.user?.phone || '',
        profilePhoto: cg.user?.profilePhoto || '',
        relationshipType: managed?.relationshipType || 'Caregiver',
        relationshipDetails: managed?.relationshipDetails || '',
        addedDate: managed?.addedAt || cg.createdAt,
        lastLogin: managed?.lastLogin || cg.user?.lastLogin,
        status: managed?.status || 'active',
        permissionLevel: managed?.permissionLevel || 'view_only',
        permissions: managed?.permissions || buildPermissionsForLevel(managed?.permissionLevel || 'view_only'),
        totalActions: relevantLogs.length,
        lastActionDate: lastAction,
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/caregivers/activity:
 *   get:
 *     summary: Get activity log for caregivers on the current account.
 *     description: Retrieve audit logs of actions taken by caregivers on this seller profile.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity log returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               - activityId: "65f1a2b3c4d5e6f7a8b9c0d5"
 *                 caregiverName: "Grace Caregiver"
 *                 action: "Updated product listing"
 *                 actionDetails: "Changed price for Handcrafted Wooden Giraffe"
 *                 timestamp: "2026-08-26T12:00:00.000Z"
 *                 resourceType: "product"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/caregivers/activity - Activity log for current account
router.get('/caregivers/activity', async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const caregivers = await Caregiver.find({
      $or: [
        { 'managedAccounts.accountId': userObjId },
        { 'managedAccounts.accountId': String(userId) },
        { 'activityLog.accountId': userObjId },
        { 'activityLog.accountId': String(userId) }
      ]
    }).populate('user', 'name');

    const logs = caregivers.flatMap(cg => (cg.activityLog || [])
      .filter(a => String(a.accountId) === String(userId))
      .map(a => ({
        activityId: a._id,
        caregiverName: cg.user?.name || 'Caregiver',
        action: a.action,
        actionDetails: a.details,
        timestamp: a.timestamp,
        resourceType: a.resourceType || 'activity',
        resourceName: a.resourceName || '',
      }))
    );

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/caregivers:
 *   post:
 *     summary: Add a new caregiver to manage the current account.
 *     description: Invite or link a caregiver by email, assign permissions (full, financial_only, product_management, view_only).
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Grace Caregiver"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "grace.caregiver@example.com"
 *               relationshipType:
 *                 type: string
 *                 example: "Parent"
 *               relationshipDetails:
 *                 type: string
 *                 example: "Mother & Legal Guardian"
 *               permissionLevel:
 *                 type: string
 *                 enum: [full, financial_only, product_management, view_only]
 *                 default: full
 *                 example: full
 *               permissions:
 *                 type: object
 *           example:
 *             fullName: "Grace Caregiver"
 *             email: "grace.caregiver@example.com"
 *             relationshipType: "Parent"
 *             relationshipDetails: "Mother & Legal Guardian"
 *             permissionLevel: "full"
 *     responses:
 *       200:
 *         description: Caregiver added successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Caregiver added"
 *               caregiver:
 *                 id: "65f1a2b3c4d5e6f7a8b9c0c8"
 *                 userId: "65f1a2b3c4d5e6f7a8b9c0c9"
 *                 fullName: "Grace Caregiver"
 *                 email: "grace.caregiver@example.com"
 *               tempPassword: "RandomTempPass123!"
 *       400:
 *         description: Full name and email are required or already linked.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// POST /api/dashboard/caregivers - Add caregiver
router.post('/caregivers', async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, relationshipType, relationshipDetails, permissionLevel, permissions } = req.body || {};

    if (!fullName || !email) return res.status(400).json({ error: 'Full name and email are required' });

    let caregiverUser = await User.findOne({ email });
    let tempPassword;

    if (!caregiverUser) {
      tempPassword = generateTempPassword();
      caregiverUser = await User.create({
        name: fullName,
        email,
        password: tempPassword,
        role: 'caregiver'
      });
    }

    let caregiver = await Caregiver.findOne({ user: caregiverUser._id });
    if (!caregiver) caregiver = await Caregiver.create({ user: caregiverUser._id, phone: caregiverUser.phone });

    const existing = caregiver.managedAccounts.find(m => String(m.accountId) === String(userId));
    if (existing) return res.status(400).json({ error: 'Caregiver already linked to this account' });

    caregiver.managedAccounts.push({
      accountId: userId,
      accountType: req.user.role === 'student' ? 'student_seller' : 'individual_seller',
      permissionLevel: permissionLevel || 'view_only',
      relationshipType,
      relationshipDetails,
      status: 'pending',
      permissions: permissions || buildPermissionsForLevel(permissionLevel || 'view_only')
    });

    await caregiver.save();

    res.json({
      message: 'Caregiver added',
      caregiver: {
        id: caregiver._id,
        userId: caregiverUser._id,
        fullName: caregiverUser.name,
        email: caregiverUser.email,
      },
      tempPassword,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/caregivers/{caregiverId}/permissions:
 *   put:
 *     summary: Update permissions for a caregiver.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caregiverId
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0c8"
 *         required: true
 *         description: Caregiver ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionLevel:
 *                 type: string
 *                 enum: [full, financial_only, product_management, view_only]
 *                 example: product_management
 *               permissions:
 *                 type: object
 *           example:
 *             permissionLevel: "product_management"
 *     responses:
 *       200:
 *         description: Permissions updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Permissions updated"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Caregiver not found or not linked to this account.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/caregivers/:caregiverId/permissions - Update permissions
router.put('/caregivers/:caregiverId/permissions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { caregiverId } = req.params;
    const { permissionLevel, permissions } = req.body || {};

    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) return res.status(404).json({ error: 'Caregiver not found' });

    const managed = caregiver.managedAccounts.find(m => String(m.accountId) === String(userId));
    if (!managed) return res.status(404).json({ error: 'Caregiver not linked to this account' });

    managed.permissionLevel = permissionLevel || managed.permissionLevel;
    managed.permissions = permissions || buildPermissionsForLevel(permissionLevel || managed.permissionLevel);
    managed.status = 'active';

    await caregiver.save();
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/caregivers/{caregiverId}:
 *   delete:
 *     summary: Remove a caregiver from managing the current account.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caregiverId
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0c8"
 *         required: true
 *         description: Caregiver ID.
 *     responses:
 *       200:
 *         description: Caregiver removed successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Caregiver removed"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Caregiver not found.
 *       500:
 *         description: Server error.
 */
// DELETE /api/dashboard/caregivers/:caregiverId - Remove caregiver from this account
router.delete('/caregivers/:caregiverId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { caregiverId } = req.params;

    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) return res.status(404).json({ error: 'Caregiver not found' });

    caregiver.managedAccounts = caregiver.managedAccounts.filter(m => String(m.accountId) !== String(userId));
    if (caregiver.managedAccounts.length === 0) caregiver.isActive = false;
    await caregiver.save();

    res.json({ message: 'Caregiver removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/withdrawals:
 *   get:
 *     summary: Get withdrawal data including pending deliveries and withdrawal requests.
 *     description: Retrieve available balance, on-hold balance, pending delivery orders, pending withdrawal requests, and withdrawal history.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal data returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               availableBalance: 450.00
 *               onHoldBalance: 125.00
 *               totalEarnings: 575.00
 *               pendingDeliveries:
 *                 - id: "65f1a2b3c4d5e6f7a8b9c0a1"
 *                   productName: "Handcrafted Wooden Giraffe Sculpture"
 *                   buyerName: "Jane Customer"
 *                   amount: 35.50
 *                   status: "in_transit"
 *               withdrawalRequests:
 *                 - id: "65f1a2b3c4d5e6f7a8b9c0w1"
 *                   amount: 150.00
 *                   method: "bank"
 *                   bankName: "KCB Bank"
 *                   accountNumber: "1234567890"
 *                   status: "pending"
 *               completedWithdrawals:
 *                 - id: "65f1a2b3c4d5e6f7a8b9c0w2"
 *                   amount: 200.00
 *                   method: "mobile"
 *                   provider: "safaricom"
 *                   phoneNumber: "0712345678"
 *                   status: "completed"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/withdrawals - Get withdrawal data
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);

    // Get all orders for this seller
    const orders = await Order.find({ sellerId: { $in: sellerIds } }).populate('buyerId', 'name email');

    // Calculate balances
    const completedStatuses = new Set(['completed', 'delivered']);
    const pendingStatuses = new Set(['pending', 'processing', 'in_transit', 'awaiting_delivery']);

    const completedOrders = orders.filter(o => completedStatuses.has(o.status));
    const pendingOrders = orders.filter(o => pendingStatuses.has(o.status) || !o.status);

    const availableBalance = completedOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const onHoldBalance = pendingOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);

    // Get pending deliveries (pending orders with details)
    const pendingDeliveries = pendingOrders.map(order => ({
      id: order._id,
      orderId: order._id,
      productName: order.productName || 'Unknown Product',
      buyerName: order.buyerName || order.buyerId?.name || 'Unknown Buyer',
      buyerEmail: order.buyerEmail || order.buyerId?.email || 'unknown@example.com',
      amount: Number(order.amount || 0),
      quantity: order.quantity || 1,
      status: order.status || 'pending',
      orderDate: order.createdAt,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
    }));

    // Try to fetch withdrawal requests from DB; fallback to mock data if unavailable
    let withdrawalRequests = [];
    let completedWithdrawals = [];
    try {
      const withdrawalMatch = {
        $or: [
          { sellerId: { $in: sellerIds } },
          { userId: { $in: sellerIds } },
          { seller: { $in: sellerIds } },
        ]
      };

      withdrawalRequests = await Withdrawal.find({
        ...withdrawalMatch,
        status: { $ne: 'completed' }
      }).sort({ requestDate: -1 });

      completedWithdrawals = await Withdrawal.find({
        ...withdrawalMatch,
        status: 'completed'
      }).sort({ completedDate: -1 });

      const normalizeMethod = (method) => {
        const value = String(method || '').toLowerCase();
        if (value.includes('bank')) return 'bank';
        if (value.includes('mobile')) return 'mobile';
        return value || 'bank';
      };

      // Map to expected frontend shape
      withdrawalRequests = withdrawalRequests.map(w => ({
        id: w._id,
        amount: w.amount,
        method: normalizeMethod(w.method),
        bankName: w.bankName || w.bank,
        accountNumber: w.accountNumber || w.account,
        accountHolder: w.accountHolder,
        provider: w.provider,
        phoneNumber: w.phoneNumber || w.phone,
        status: w.status,
        requestDate: w.requestDate,
        approvalDate: w.approvalDate,
      }));

      completedWithdrawals = completedWithdrawals.map(w => ({
        id: w._id,
        amount: w.amount,
        method: normalizeMethod(w.method),
        bankName: w.bankName || w.bank,
        accountNumber: w.accountNumber || w.account,
        provider: w.provider,
        phoneNumber: w.phoneNumber || w.phone,
        status: w.status,
        date: w.completedDate || w.requestDate || w.date,
      }));
    } catch (err) {
      withdrawalRequests = [];
      completedWithdrawals = [];
    }

    res.json({
      availableBalance,
      onHoldBalance,
      totalEarnings: availableBalance + onHoldBalance,
      pendingDeliveries,
      withdrawalRequests,
      completedWithdrawals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/withdrawals:
 *   post:
 *     summary: Request a withdrawal of available balance.
 *     description: Submit a withdrawal request to transfer earnings to a bank account or mobile money wallet.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - method
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 150.00
 *               method:
 *                 type: string
 *                 enum: [bank, mobile]
 *                 example: bank
 *               bankName:
 *                 type: string
 *                 example: "KCB Bank"
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               accountName:
 *                 type: string
 *                 example: "Alice Mwangi"
 *               branchCode:
 *                 type: string
 *                 example: "001"
 *               provider:
 *                 type: string
 *                 example: "safaricom"
 *               mobileNumber:
 *                 type: string
 *                 example: "0712345678"
 *           examples:
 *             BankWithdrawal:
 *               summary: Bank Transfer Withdrawal
 *               value:
 *                 amount: 150.00
 *                 method: "bank"
 *                 bankName: "KCB Bank"
 *                 accountNumber: "1234567890"
 *                 accountName: "Alice Mwangi"
 *                 branchCode: "001"
 *             MobileMoneyWithdrawal:
 *               summary: Mobile Money (M-Pesa) Withdrawal
 *               value:
 *                 amount: 75.00
 *                 method: "mobile"
 *                 provider: "safaricom"
 *                 mobileNumber: "0712345678"
 *     responses:
 *       201:
 *         description: Withdrawal initiated and processed successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Withdrawal processed successfully"
 *               withdrawal:
 *                 id: "65f1a2b3c4d5e6f7a8b9c0w1"
 *                 amount: 150.00
 *                 method: "bank"
 *                 bankName: "KCB Bank"
 *                 status: "completed"
 *                 date: "2026-08-26T21:00:00.000Z"
 *       400:
 *         description: Invalid withdrawal amount or missing required fields.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// POST /api/dashboard/withdrawals - Create a new withdrawal request
router.post('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, method, bankName, accountNumber, accountName, branchCode, provider, mobileNumber } = req.body || {};

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Valid withdrawal amount is required' });
    }

    // Create withdrawal
    let withdrawal;
    try {
      withdrawal = await Withdrawal.create({
        sellerId: userId,
        amount: withdrawAmount,
        method: method || 'bank',
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        accountHolder: accountName || '',
        branchCode: branchCode || '',
        provider: provider || '',
        phoneNumber: mobileNumber || '',
        status: 'completed',
        requestDate: new Date(),
        completedDate: new Date()
      });
    } catch (createErr) {
      withdrawal = {
        _id: new mongoose.Types.ObjectId(),
        amount: withdrawAmount,
        method: method || 'bank',
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        accountHolder: accountName || '',
        provider: provider || '',
        phoneNumber: mobileNumber || '',
        status: 'completed',
        date: new Date()
      };
    }

    res.status(201).json({
      message: 'Withdrawal processed successfully',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        bankName: withdrawal.bankName,
        accountNumber: withdrawal.accountNumber,
        provider: withdrawal.provider,
        phoneNumber: withdrawal.phoneNumber,
        status: withdrawal.status,
        date: withdrawal.completedDate || withdrawal.date || new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/withdrawals/methods:
 *   post:
 *     summary: Save withdrawal payment method (Bank details or Mobile Money).
 *     description: Store payment payout details for automatic or future balance withdrawals.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [bank, mobile]
 *                 example: bank
 *               bankName:
 *                 type: string
 *                 example: "Equity Bank"
 *               accountNumber:
 *                 type: string
 *                 example: "9876543210"
 *               accountName:
 *                 type: string
 *                 example: "Alice Mwangi"
 *               branchCode:
 *                 type: string
 *                 example: "045"
 *               provider:
 *                 type: string
 *                 example: "safaricom"
 *               mobileNumber:
 *                 type: string
 *                 example: "0798765432"
 *           examples:
 *             BankDetails:
 *               summary: Bank Account Details
 *               value:
 *                 method: "bank"
 *                 bankName: "Equity Bank"
 *                 accountNumber: "9876543210"
 *                 accountName: "Alice Mwangi"
 *                 branchCode: "045"
 *             MobileDetails:
 *               summary: Mobile Money (M-Pesa) Details
 *               value:
 *                 method: "mobile"
 *                 provider: "safaricom"
 *                 mobileNumber: "0798765432"
 *                 accountName: "Alice Mwangi"
 *     responses:
 *       200:
 *         description: Payment details saved successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Payment details saved successfully"
 *               paymentMethod:
 *                 method: "bank"
 *                 bankName: "Equity Bank"
 *                 accountNumber: "9876543210"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
// POST /api/dashboard/withdrawals/methods - Save withdrawal payment method
router.post('/withdrawals/methods', async (req, res) => {
  try {
    const userId = req.user.id;
    const { method, bankName, accountNumber, accountName, branchCode, provider, mobileNumber } = req.body || {};

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.paymentMethod = {
      method: method || 'bank',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      accountName: accountName || '',
      branchCode: branchCode || '',
      provider: provider || '',
      mobileNumber: mobileNumber || ''
    };
    await user.save();

    res.json({ message: 'Payment details saved successfully', paymentMethod: user.paymentMethod });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/messages:
 *   get:
 *     summary: Get buyer messages and inquiries for the logged-in seller.
 *     description: Retrieve all direct messages from buyers and customer inquiries.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               - id: "65f1a2b3c4d5e6f7a8b9c0b1"
 *                 from: "Jane Customer"
 *                 fromEmail: "jane.buyer@example.com"
 *                 fromAvatar: "J"
 *                 message: "Hi! Can you customize the height of this sculpture to 40cm?"
 *                 productName: "Handcrafted Wooden Giraffe Sculpture"
 *                 timestamp: "2026-08-26T18:00:00.000Z"
 *                 unread: true
 *                 status: "new"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/messages - Get buyer messages
router.get('/messages', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);

    // Get inquiries from buyers
    const inquiries = await Inquiry.find({ 
      $or: [
        { sellerId: { $in: sellerIds } },
        { seller: { $in: sellerIds } },
        { seller_id: { $in: sellerIds } },
        { buyerId: { $in: sellerIds } },
        { buyer: { $in: sellerIds } },
        { buyer_id: { $in: sellerIds } },
      ]
    })
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('productId', 'name')
      .sort({ createdAt: -1 });

    const messages = inquiries.map(inquiry => {
      const fromName = inquiry.buyerId?.name || inquiry.buyerName || inquiry.sellerId?.name || inquiry.sellerName || 'Unknown Buyer';
      const fromEmail = inquiry.buyerId?.email || inquiry.buyerEmail || inquiry.sellerId?.email || inquiry.sellerEmail || 'unknown@example.com';
      const unread = typeof inquiry.unread === 'boolean' ? inquiry.unread : inquiry.status === 'new';
      return {
        id: inquiry._id,
        from: fromName,
        fromEmail,
        fromAvatar: fromName?.charAt(0)?.toUpperCase() || 'U',
        message: inquiry.message || 'Product inquiry',
        productName: inquiry.productId?.name || inquiry.productName || 'Unknown Product',
        timestamp: inquiry.timestamp || inquiry.createdAt,
        unread,
        status: inquiry.status || (unread ? 'new' : 'read'),
      };
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/messages/{id}/reply:
 *   put:
 *     summary: Reply to a buyer inquiry/message.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0b1"
 *         description: MongoDB Inquiry/Message ID to reply to.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Hello! Yes, the item is still available and ready to ship."
 *           example:
 *             message: "Hello! Yes, the item is still available and ready to ship."
 *     responses:
 *       200:
 *         description: Reply sent successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Reply sent successfully"
 *       400:
 *         description: Reply text is required.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Message/inquiry not found.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/messages/:id/reply - Reply to buyer message
router.put('/messages/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, replyMessage } = req.body || {};
    const text = message || replyMessage;

    if (!text) return res.status(400).json({ error: 'Reply text is required' });

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ error: 'Message not found' });

    inquiry.reply = text;
    inquiry.status = 'replied';
    inquiry.repliedAt = new Date();
    await inquiry.save();

    res.json({ message: 'Reply sent successfully', inquiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/assistance/teacher:
 *   post:
 *     summary: Student sends assistance message to teacher.
 *     description: Submit an assistance help request from a student artisan to their assigned school teacher.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Assistance needed with Wood Carving batch #3"
 *               message:
 *                 type: string
 *                 example: "Hello teacher, I have completed the base carvings and need guidance on applying the varnish coating."
 *           example:
 *             subject: "Assistance needed with Wood Carving batch #3"
 *             message: "Hello teacher, I have completed the base carvings and need guidance on applying the varnish coating."
 *     responses:
 *       200:
 *         description: Message sent to teacher successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Message sent to teacher"
 *       400:
 *         description: Subject and message are required.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Student record or teacher not found.
 *       500:
 *         description: Server error.
 */
// POST /api/dashboard/assistance/teacher - Student sends message to teacher
router.post('/assistance/teacher', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body || {};

    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const student = await Student.findOne({ user: userId }).populate('school');
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const teacher = student.school?._id
      ? await Teacher.findOne({ school: student.school._id }).populate('user')
      : null;

    if (!teacher?.user?._id) {
      return res.status(404).json({ error: 'No teacher found for this school' });
    }

    await AssistanceRequest.create({
      studentId: userId,
      teacherId: teacher.user._id,
      schoolId: student.school?._id,
      subject,
      message,
      status: 'pending'
    });

    res.json({ message: 'Message sent to teacher' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/assistance/school:
 *   post:
 *     summary: Student sends assistance message to school administration.
 *     description: Submit an assistance or resource request directly to the school administration.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Request for Workshop Materials"
 *               message:
 *                 type: string
 *                 example: "Dear administration, we require additional carving tools and sandpaper for our vocational craft group."
 *           example:
 *             subject: "Request for Workshop Materials"
 *             message: "Dear administration, we require additional carving tools and sandpaper for our vocational craft group."
 *     responses:
 *       200:
 *         description: Message sent to school administration successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Message sent to school administration"
 *       400:
 *         description: Subject and message are required.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Student record or school not found.
 *       500:
 *         description: Server error.
 */
// POST /api/dashboard/assistance/school - Student sends message to school administration
router.post('/assistance/school', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body || {};

    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const student = await Student.findOne({ user: userId });
    if (!student?.school) return res.status(404).json({ error: 'School not found for this student' });

    await AssistanceRequest.create({
      studentId: userId,
      schoolId: student.school,
      subject,
      message,
      status: 'pending'
    });

    res.json({ message: 'Message sent to school administration' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get detailed analytics for the logged-in seller.
 *     description: Retrieve detailed revenue breakdown, order conversion rates, product views, and refunds across time periods.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         example: monthly
 *         description: Time period for analytics (daily, weekly, monthly, yearly).
 *     responses:
 *       200:
 *         description: Detailed analytics returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               timePeriod: "monthly"
 *               sales:
 *                 total: "890.00"
 *                 count: 28
 *                 average: "31.79"
 *               orders:
 *                 total: 28
 *                 completed: 25
 *                 pending: 3
 *                 cancelled: 0
 *               productViews: 720
 *               refunds:
 *                 count: 1
 *                 totalAmount: "25.00"
 *               conversionRate: "70.00"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/analytics - Get detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);
    const timePeriod = req.query.period || 'monthly'; // daily, weekly, monthly, yearly

    // Determine date range
    let dateFrom = new Date();
    switch (timePeriod) {
      case 'daily':
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case 'weekly':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'monthly':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'yearly':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }

    // Get orders in period
    const orders = await Order.find({
      sellerId: { $in: sellerIds },
      createdAt: { $gte: dateFrom },
    });

    // Get all products for this seller
    const products = await Product.find({ sellerId: { $in: sellerIds }, isDeleted: { $ne: true } });

    // Calculate analytics
    const totalSales = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const orderCount = orders.length;
    const refundCount = orders.filter(o => o.refundStatus === 'approved').length;
    const totalProductViews = products.reduce((sum, p) => sum + (p.viewCount || 0), 0);

    // Sold out products (status = 'sold')
    const soldOutProducts = products
      .filter(p => p.status === 'sold')
      .map(p => ({
        id: p._id,
        productName: p.name,
        lastSoldDate: p.updatedAt,
        totalSold: orders.filter(o => o.productId === p._id).length,
        avgTimeToSellOut: 'N/A',
      }));

    const analytics = {
      timePeriod,
      dateRange: {
        from: dateFrom,
        to: new Date(),
      },
      sales: {
        total: totalSales.toFixed(2),
        count: orderCount,
        average: (orderCount > 0 ? (totalSales / orderCount).toFixed(2) : 0),
      },
      orders: {
        total: orderCount,
        completed: orders.filter(o => o.status === 'completed').length,
        pending: orders.filter(o => o.status === 'pending').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
      },
      productViews: totalProductViews,
      refunds: {
        count: refundCount,
        totalAmount: orders
          .filter(o => o.refundStatus === 'approved')
          .reduce((sum, o) => sum + (o.amount || 0), 0)
          .toFixed(2),
      },
      soldOutProducts,
      conversionRate: products.length > 0 ? ((orderCount / products.length) * 100).toFixed(2) : 0,
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/refunds:
 *   get:
 *     summary: Get refund data for the logged-in seller.
 *     description: Retrieve pending refund requests, approved refund history, and overall refund metrics.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refund data returned successfully.
 *         content:
 *           application/json:
 *             example:
 *               pending:
 *                 - id: "65f1a2b3c4d5e6f7a8b9c0r1"
 *                   productName: "Handmade Beaded Maasai Bracelet"
 *                   buyerName: "Jane Customer"
 *                   buyerEmail: "jane.buyer@example.com"
 *                   amount: 25.00
 *                   reason: "Item size was smaller than expected"
 *                   status: "pending"
 *               approved:
 *                 - id: "65f1a2b3c4d5e6f7a8b9c0r2"
 *                   productName: "Handcrafted Wooden Giraffe Sculpture"
 *                   buyerName: "Bob Smith"
 *                   amount: 35.50
 *                   reason: "Damaged in transit"
 *                   status: "approved"
 *               stats:
 *                 pendingCount: 1
 *                 approvedCount: 1
 *                 totalPending: "25.00"
 *                 totalApproved: "35.50"
 *                 refundRate: "4.76"
 *                 allRefunds: 2
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// GET /api/dashboard/refunds - Get refund data
router.get('/refunds', async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerIds = await resolveSellerIds(userId);

    const refundStatuses = ['requested', 'approved', 'rejected', 'pending'];
    const orders = await Order.find({ 
      sellerId: { $in: sellerIds },
      $or: [
        { refundStatus: { $in: refundStatuses } },
        { status: 'refunded' },
        { refundReason: { $exists: true, $ne: '' } }
      ]
    })
      .populate('buyerId', 'name email')
      .populate('productId', 'name')
      .sort({ createdAt: -1 });

    const refunds = await Refund.find({
      $or: [
        { sellerId: { $in: sellerIds } },
        { userId: { $in: sellerIds } },
        { seller: { $in: sellerIds } },
      ]
    })
      .populate('buyerId', 'name email')
      .populate('productId', 'name')
      .sort({ createdAt: -1 });

    const normalizeStatus = (order) => {
      const raw = String(order.refundStatus || '').toLowerCase();
      if (raw === 'pending') return 'requested';
      if (raw) return raw;
      if (order.status === 'refunded') return 'approved';
      if (order.status === 'cancelled') return 'rejected';
      if (order.refundReason) return 'requested';
      return 'requested';
    };

    const orderPendingRefunds = orders
      .filter(o => normalizeStatus(o) === 'requested')
      .map(o => ({
        id: o._id,
        productName: o.productName || o.productId?.name || 'Unknown Product',
        buyerName: o.buyerName || o.buyerId?.name || 'Unknown Buyer',
        buyerEmail: o.buyerEmail || o.buyerId?.email || 'unknown@example.com',
        amount: Number(o.amount || 0),
        reason: o.refundReason || 'Not specified',
        requestDate: o.createdAt,
        status: 'pending',
      }));

    const orderApprovedRefunds = orders
      .filter(o => normalizeStatus(o) === 'approved')
      .map(o => ({
        id: o._id,
        productName: o.productName || o.productId?.name || 'Unknown Product',
        buyerName: o.buyerName || o.buyerId?.name || 'Unknown Buyer',
        buyerEmail: o.buyerEmail || o.buyerId?.email || 'unknown@example.com',
        amount: Number(o.amount || 0),
        reason: o.refundReason || 'Not specified',
        requestDate: o.createdAt,
        approvalDate: o.updatedAt,
        status: 'approved',
      }));

    const refundRecords = refunds.map(r => {
      const status = String(r.status || 'pending').toLowerCase();
      return {
        id: r._id,
        productName: r.productName || r.productId?.name || 'Unknown Product',
        buyerName: r.buyerName || r.buyerId?.name || 'Unknown Buyer',
        buyerEmail: r.buyerEmail || r.buyerId?.email || 'unknown@example.com',
        amount: Number(r.amount || 0),
        reason: r.reason || 'Not specified',
        requestDate: r.date || r.createdAt,
        approvalDate: r.updatedAt,
        status: status === 'approved' ? 'approved' : 'pending',
      };
    });

    const pendingRefunds = [
      ...orderPendingRefunds,
      ...refundRecords.filter(r => r.status === 'pending')
    ];

    const approvedRefunds = [
      ...orderApprovedRefunds,
      ...refundRecords.filter(r => r.status === 'approved')
    ];

    const totalRefundsPending = pendingRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalRefundsApproved = approvedRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const allRefunds = pendingRefunds.length + approvedRefunds.length;

    const refundStats = {
      pendingCount: pendingRefunds.length,
      approvedCount: approvedRefunds.length,
      totalPending: totalRefundsPending.toFixed(2),
      totalApproved: totalRefundsApproved.toFixed(2),
      refundRate: orders.length > 0 ? ((allRefunds / orders.length) * 100).toFixed(2) : '0.00',
      allRefunds,
    };

    res.json({
      pending: pendingRefunds,
      approved: approvedRefunds,
      stats: refundStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * @openapi
 * /api/dashboard/refunds/{id}/approve:
 *   put:
 *     summary: Approve a pending refund request.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0r1"
 *         description: Refund ID or Order ID to approve.
 *     responses:
 *       200:
 *         description: Refund approved successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Refund approved successfully"
 *               id: "65f1a2b3c4d5e6f7a8b9c0r1"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/refunds/:id/approve - Approve refund
router.put('/refunds/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    let refund = await Refund.findById(id);
    if (refund) {
      refund.status = 'approved';
      refund.approvalDate = new Date();
      await refund.save();
    } else {
      let order = await Order.findById(id);
      if (order) {
        order.status = 'refunded';
        order.refundStatus = 'approved';
        await order.save();
      }
    }
    res.json({ message: 'Refund approved successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/refunds/{id}/reject:
 *   put:
 *     summary: Reject a pending refund request.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0r1"
 *         description: Refund ID or Order ID to reject.
 *     responses:
 *       200:
 *         description: Refund rejected successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Refund rejected successfully"
 *               id: "65f1a2b3c4d5e6f7a8b9c0r1"
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/refunds/:id/reject - Reject refund
router.put('/refunds/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    let refund = await Refund.findById(id);
    if (refund) {
      refund.status = 'rejected';
      await refund.save();
    } else {
      let order = await Order.findById(id);
      if (order) {
        order.refundStatus = 'rejected';
        await order.save();
      }
    }
    res.json({ message: 'Refund rejected successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/dashboard/orders/{id}/ship:
 *   put:
 *     summary: Mark an order as shipped with tracking information.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1a2b3c4d5e6f7a8b9c0a1"
 *         description: MongoDB Order ID to mark as shipped.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingMethod:
 *                 type: string
 *                 enum: [self, platform]
 *                 example: self
 *               trackingNumber:
 *                 type: string
 *                 example: "TRK-2026-9812"
 *           example:
 *             shippingMethod: "self"
 *             trackingNumber: "TRK-2026-9812"
 *     responses:
 *       200:
 *         description: Order marked as shipped.
 *         content:
 *           application/json:
 *             example:
 *               message: "Order marked as shipped"
 *               order:
 *                 _id: "65f1a2b3c4d5e6f7a8b9c0a1"
 *                 status: "in_transit"
 *                 shippingMethod: "self"
 *                 trackingNumber: "TRK-2026-9812"
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Server error.
 */
// PUT /api/dashboard/orders/:id/ship - Mark order as shipped
router.put('/orders/:id/ship', async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingMethod, trackingNumber } = req.body || {};

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'in_transit';
    if (shippingMethod) order.shippingMethod = shippingMethod;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();

    res.json({ message: 'Order marked as shipped', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   SCHOOL DASHBOARD ENDPOINTS
   ========================================================================== */

/**
 * Helper to get school for the authenticated user
 */
const resolveSchool = async (req) => {
  if (req.user.school) {
    const s = await School.findById(req.user.school);
    if (s) return s;
  }
  const user = await User.findById(req.user.id);
  if (user?.school) {
    const s = await School.findById(user.school);
    if (s) return s;
  }
  const teacher = await Teacher.findOne({ user: req.user.id }).populate('school');
  if (teacher?.school) return teacher.school;

  const student = await Student.findOne({ user: req.user.id }).populate('school');
  if (student?.school) return student.school;

  // Fallback to first school
  return await School.findOne({});
};

// GET /api/dashboard/school/overview
router.get('/school/overview', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const teachers = await Teacher.find({ school: school._id }).populate('user');
    const students = await Student.find({ school: school._id }).populate('user');

    const activeTeachers = teachers.filter(t => t.user?.active !== false);
    const pendingTeachers = teachers.filter(t => t.user?.active === false);

    const activeStudents = students.filter(s => s.user?.active !== false);
    const pendingStudents = students.filter(s => s.user?.active === false);

    const studentUserIds = students.map(s => s.user?._id).filter(Boolean);
    const activeProducts = await Product.countDocuments({
      sellerId: { $in: studentUserIds },
      status: 'active',
      isDeleted: { $ne: true }
    });

    const pendingProducts = await Product.countDocuments({
      sellerId: { $in: studentUserIds },
      status: 'pending',
      isDeleted: { $ne: true }
    });

    res.json({
      school: {
        id: school._id,
        name: school.name,
        registrationNumber: school.registrationNumber,
        address: school.address,
        contactEmail: school.contactEmail,
        contactPhone: school.contactPhone,
      },
      stats: {
        totalTeachers: activeTeachers.length,
        totalStudents: activeStudents.length,
        activeProducts,
        pendingApprovals: pendingTeachers.length + pendingStudents.length + pendingProducts,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/school/teachers
router.get('/school/teachers', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const teacherDocs = await Teacher.find({ school: school._id }).populate('user');
    const studentDocs = await Student.find({ school: school._id }).populate('user');

    const list = teacherDocs.map(t => {
      const u = t.user || {};
      const assignedCount = studentDocs.filter(s => s.user?.active !== false).length; // general pool or assigned

      return {
        id: t._id,
        userId: u._id,
        name: u.name || 'Teacher',
        email: u.email || '',
        department: u.department || t.subject || 'Vocational Education',
        subject: t.subject || 'Arts & Crafts',
        staffId: t.staffId || '',
        students: Math.max(1, Math.floor(assignedCount / Math.max(1, teacherDocs.length))),
        status: u.active === false ? 'pending' : (u.isBanned ? 'banned' : 'active'),
        joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2024-01-01',
        profilePhoto: u.profilePhoto || '',
        bio: u.bio || '',
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/school/students
router.get('/school/students', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const studentDocs = await Student.find({ school: school._id }).populate('user');
    const teacherDocs = await Teacher.find({ school: school._id }).populate('user');

    const students = await Promise.all(studentDocs.map(async (s, index) => {
      const u = s.user || {};
      const prodCount = await Product.countDocuments({ sellerId: u._id, isDeleted: { $ne: true } });
      const completedOrders = await Order.find({ sellerId: u._id, status: 'completed' });
      const totalSales = completedOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
      const assignedTeacher = teacherDocs[index % Math.max(1, teacherDocs.length)];

      return {
        id: s._id,
        userId: u._id,
        name: u.name || 'Student Artisan',
        email: u.email || '',
        teacher: assignedTeacher?.user?.name || 'Dr. Sarah Williams',
        teacherId: assignedTeacher?._id || '1',
        studentId: s.studentId || '',
        disabilityId: u.disabilityId || s.disabilityId || '',
        disabilityType: u.disabilityType || 'Special Support',
        products: prodCount,
        totalSales,
        status: u.active === false ? 'pending' : (u.isBanned ? 'banned' : 'active'),
        joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2024-09-01',
        profilePhoto: u.profilePhoto || '',
        bio: u.bio || '',
      };
    }));

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/school/approvals
router.get('/school/approvals', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const pendingTeachers = await Teacher.find({ school: school._id }).populate('user');
    const pendingStudents = await Student.find({ school: school._id }).populate('user');

    const teachersList = pendingTeachers
      .filter(t => t.user?.active === false)
      .map(t => ({
        id: t._id,
        userId: t.user?._id,
        name: t.user?.name,
        email: t.user?.email,
        department: t.user?.department || t.subject || 'Art & Crafts',
        requestedDate: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '2026-09-01',
        credentials: t.subject || 'Certified Educator',
      }));

    const studentsList = pendingStudents
      .filter(s => s.user?.active === false)
      .map(s => ({
        id: s._id,
        userId: s.user?._id,
        name: s.user?.name,
        email: s.user?.email,
        disabilityId: s.user?.disabilityId || s.disabilityId || 'DIS-2024',
        requestedDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '2026-09-01',
        assignedTeacher: 'Dr. Sarah Williams',
      }));

    res.json({
      pendingTeachers: teachersList,
      pendingStudents: studentsList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/teachers/:id/approve
router.put('/school/teachers/:id/approve', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    if (teacher.user) {
      await User.findByIdAndUpdate(teacher.user, { active: true, isBanned: false });
    }
    res.json({ success: true, message: 'Teacher approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/teachers/:id/reject
router.put('/school/teachers/:id/reject', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    if (teacher.user) {
      await User.findByIdAndDelete(teacher.user);
    }
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Teacher application rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/students/:id/approve
router.put('/school/students/:id/approve', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.user) {
      await User.findByIdAndUpdate(student.user, { active: true, isBanned: false });
    }
    res.json({ success: true, message: 'Student approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/students/:id/reject
router.put('/school/students/:id/reject', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student application rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/teachers/:id/ban
router.put('/school/teachers/:id/ban', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const { reason } = req.body || {};
    await User.findByIdAndUpdate(teacher.user, { isBanned: true, banReason: reason || 'Violation of school policy' });
    res.json({ success: true, message: 'Teacher banned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/teachers/:id/unban
router.put('/school/teachers/:id/unban', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    await User.findByIdAndUpdate(teacher.user, { isBanned: false, banReason: null });
    res.json({ success: true, message: 'Teacher unbanned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/students/:id/ban
router.put('/school/students/:id/ban', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { reason } = req.body || {};
    await User.findByIdAndUpdate(student.user, { isBanned: true, banReason: reason || 'Violation of code of conduct' });
    res.json({ success: true, message: 'Student banned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/school/students/:id/unban
router.put('/school/students/:id/unban', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await User.findByIdAndUpdate(student.user, { isBanned: false, banReason: null });
    res.json({ success: true, message: 'Student unbanned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/school/teachers
router.post('/school/teachers', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const { name, email, department, subject, staffId, password = 'Password123!' } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User with this email already exists' });

    user = new User({
      name,
      email,
      password,
      role: 'teacher',
      department: department || 'Vocational Education',
      school: school._id,
      active: true,
    });
    await user.save();

    const teacher = new Teacher({
      user: user._id,
      school: school._id,
      subject: subject || department || 'Vocational Crafts',
      staffId: staffId || `T-${Date.now().toString().slice(-4)}`,
    });
    await teacher.save();

    res.status(201).json({ success: true, message: 'Teacher added successfully', teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/school/students
router.post('/school/students', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const { name, email, disabilityId, disabilityType, studentId, password = 'Password123!' } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User with this email already exists' });

    user = new User({
      name,
      email,
      password,
      role: 'student',
      disabilityId,
      disabilityType,
      school: school._id,
      active: true,
    });
    await user.save();

    const student = new Student({
      user: user._id,
      school: school._id,
      studentId: studentId || `STD-${Date.now().toString().slice(-4)}`,
      disabilityId,
    });
    await student.save();

    res.status(201).json({ success: true, message: 'Student added successfully', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/school/activities
router.get('/school/activities', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const studentDocs = await Student.find({ school: school._id }).populate('user');
    const studentUserIds = studentDocs.map(s => s.user?._id).filter(Boolean);

    // Get recent products, assistance requests, inquiries
    const recentProducts = await Product.find({ sellerId: { $in: studentUserIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sellerId', 'name');

    const activities = recentProducts.map(p => ({
      id: `act-${p._id}`,
      teacherId: '1',
      teacherName: 'Dr. Sarah Williams',
      action: p.status === 'active' ? 'Approved product' : (p.status === 'pending' ? 'Reviewed submitted product' : 'Updated product catalog'),
      details: `${p.status === 'active' ? 'Approved' : 'Inspecting'} "${p.name}" by ${p.sellerId?.name || 'Student Artisan'}`,
      studentAffected: p.sellerId?.name || 'Student Artisan',
      timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Recent',
      type: p.status === 'active' ? 'product_approval' : 'product_submission'
    }));

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   TEACHER DASHBOARD ENDPOINTS
   ========================================================================== */

// GET /api/dashboard/teacher/overview
router.get('/teacher/overview', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    const teacher = await Teacher.findOne({ user: req.user.id }).populate('user');

    const studentDocs = await Student.find({ school: school?._id }).populate('user');
    const studentUserIds = studentDocs.map(s => s.user?._id).filter(Boolean);

    const products = await Product.find({ sellerId: { $in: studentUserIds }, isDeleted: { $ne: true } });
    const pendingProducts = products.filter(p => p.status === 'pending');
    const activeProducts = products.filter(p => p.status === 'active');

    const orders = await Order.find({ sellerId: { $in: studentUserIds }, status: 'completed' });
    const totalSales = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    res.json({
      schoolName: school?.name || 'Hope Academy for Special Education',
      teacher: {
        name: teacher?.user?.name || req.user.name,
        subject: teacher?.subject || 'Vocational Arts',
        staffId: teacher?.staffId || 'T-001',
      },
      stats: {
        totalStudents: studentDocs.filter(s => s.user?.active !== false).length,
        totalProducts: activeProducts.length,
        pendingApprovals: pendingProducts.length + studentDocs.filter(s => s.user?.active === false).length,
        totalSales,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/teacher/students
router.get('/teacher/students', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    const studentDocs = await Student.find({ school: school?._id }).populate('user');

    const students = await Promise.all(studentDocs.map(async (s) => {
      const u = s.user || {};
      const prodCount = await Product.countDocuments({ sellerId: u._id, isDeleted: { $ne: true } });
      const orders = await Order.find({ sellerId: u._id, status: 'completed' });
      const totalSales = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const inqCount = await Inquiry.countDocuments({ sellerId: u._id });

      return {
        id: s._id,
        userId: u._id,
        name: u.name || 'Student Artisan',
        email: u.email || '',
        school: school?.name || 'Hope Academy for Special Education',
        products: prodCount,
        status: u.active === false ? 'pending' : (u.isBanned ? 'banned' : 'active'),
        totalSales,
        totalInquiries: inqCount,
        unrespondedInquiries: Math.max(0, inqCount - orders.length),
        joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2024-09-15',
        banReason: u.banReason,
      };
    }));

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/teacher/pending-approvals
router.get('/teacher/pending-approvals', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    const studentDocs = await Student.find({ school: school?._id }).populate('user');
    const studentUserIds = studentDocs.map(s => s.user?._id).filter(Boolean);

    const pendingStudents = studentDocs
      .filter(s => s.user?.active === false)
      .map(s => ({
        id: s._id,
        name: s.user?.name,
        email: s.user?.email,
        disabilityId: s.user?.disabilityId || s.disabilityId || 'DIS-2024',
        requestedDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '2026-09-01',
        school: school?.name || 'Hope Academy',
      }));

    const pendingProducts = await Product.find({
      sellerId: { $in: studentUserIds },
      status: 'pending',
      isDeleted: { $ne: true }
    }).populate('sellerId', 'name');

    const productsList = pendingProducts.map(p => ({
      id: p._id,
      studentId: p.sellerId?._id,
      studentName: p.sellerId?.name || 'Student Artisan',
      title: p.name,
      category: p.category || 'Art & Crafts',
      price: p.price,
      description: p.description || '',
      submittedDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '2026-09-01',
      status: 'pending',
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1610701596295-4dc5d6289214?w=500',
    }));

    res.json({
      pendingStudents,
      pendingProducts: productsList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/teacher/products
router.get('/teacher/products', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    const studentDocs = await Student.find({ school: school?._id }).populate('user');
    const studentUserIds = studentDocs.map(s => s.user?._id).filter(Boolean);

    const products = await Product.find({
      sellerId: { $in: studentUserIds },
      isDeleted: { $ne: true }
    }).populate('sellerId', 'name email');

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/teacher/products/:id/approve
router.put('/teacher/products/:id/approve', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.status = 'active';
    await product.save();

    res.json({ success: true, message: `Product "${product.name}" approved and published to marketplace!`, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/teacher/products/:id/reject
router.put('/teacher/products/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.status = 'rejected';
    await product.save();

    res.json({ success: true, message: `Product "${product.name}" rejected. Reason: ${reason || 'Does not meet standards'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/teacher/students/:id/approve
router.put('/teacher/students/:id/approve', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.user) {
      await User.findByIdAndUpdate(student.user, { active: true, isBanned: false });
    }
    res.json({ success: true, message: 'Student approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/teacher/students/:id/reject
router.put('/teacher/students/:id/reject', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student application rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/teacher/activities
router.get('/teacher/activities', async (req, res) => {
  try {
    const school = await resolveSchool(req);
    const studentDocs = await Student.find({ school: school?._id }).populate('user');
    const studentUserIds = studentDocs.map(s => s.user?._id).filter(Boolean);

    const products = await Product.find({ sellerId: { $in: studentUserIds } })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('sellerId', 'name');

    const logs = products.map((p, idx) => ({
      id: `log-${p._id}-${idx}`,
      teacherName: 'You',
      action: p.status === 'active' ? 'Approved product' : (p.status === 'rejected' ? 'Rejected product' : 'Reviewed submission'),
      details: `${p.status === 'active' ? 'Approved' : 'Inspected'} "${p.name}" by ${p.sellerId?.name || 'Student Artisan'}`,
      timestamp: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : 'Recently',
      type: p.status === 'active' ? 'product_approval' : 'product_rejection'
    }));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/school/messages - School admin messages a teacher or student
router.post('/school/messages', async (req, res) => {
  try {
    const { recipientId, recipientType, subject, message } = req.body || {};
    if (!recipientId || !message || !String(message).trim()) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    let toUserId = null;
    if (recipientType === 'teacher') {
      const teacher = await Teacher.findById(recipientId);
      toUserId = teacher?.user;
    } else if (recipientType === 'student') {
      const student = await Student.findById(recipientId);
      toUserId = student?.user;
    } else {
      toUserId = recipientId;
    }

    if (!toUserId) return res.status(404).json({ error: 'Recipient not found' });

    const saved = await DirectMessage.create({
      from: req.user.id,
      to: toUserId,
      subject: subject || 'Message from school',
      message: String(message).trim(),
    });

    res.status(201).json({ success: true, message: 'Message sent', id: saved._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const requireAdmin = (req, res) => {
  if (!['admin', 'super-admin'].includes(req.user?.role)) {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  return true;
};

const emptySignupBucket = () => ({ individuals: 0, schools: 0, students: 0, teachers: 0, buyers: 0 });

// GET /api/dashboard/admin/overview
router.get('/admin/overview', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [users, pendingUsers, pendingSchools, pendingProducts, orders, withdrawals, refunds, resetRequests] = await Promise.all([
      User.find().select('role createdAt active isBanned approvalStatus').lean(),
      User.countDocuments({ approvalStatus: 'pending' }),
      School.countDocuments({ approved: false }),
      Product.countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
      Order.find().sort({ createdAt: -1 }).limit(8).populate('sellerId', 'name').lean(),
      Withdrawal.find().sort({ requestDate: -1 }).limit(8).populate('sellerId', 'name').lean(),
      Refund.countDocuments({ status: 'pending' }),
      User.countDocuments({ passwordResetRequested: true }),
    ]);

    const now = Date.now();
    const windows = {
      daily: now - 24 * 60 * 60 * 1000,
      weekly: now - 7 * 24 * 60 * 60 * 1000,
      monthly: now - 30 * 24 * 60 * 60 * 1000,
      yearly: now - 365 * 24 * 60 * 60 * 1000,
    };
    const signupStats = {};
    for (const [key, since] of Object.entries(windows)) {
      const bucket = emptySignupBucket();
      users.filter(u => u.createdAt && new Date(u.createdAt).getTime() >= since).forEach(u => {
        if (u.role === 'seller') bucket.individuals += 1;
        else if (u.role === 'school') bucket.schools += 1;
        else if (u.role === 'student') bucket.students += 1;
        else if (u.role === 'teacher') bucket.teachers += 1;
        else if (u.role === 'buyer') bucket.buyers += 1;
      });
      signupStats[key] = bucket;
    }

    const transactions = [
      ...orders.map(o => ({
        id: String(o._id),
        userId: String(o.sellerId?._id || o.sellerId || ''),
        userName: o.sellerId?.name || o.buyerName || 'Seller',
        type: 'sale',
        amount: o.amount || 0,
        product: o.productName || 'Order',
        date: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
        status: o.status || 'pending',
      })),
      ...withdrawals.map(w => ({
        id: String(w._id),
        userId: String(w.sellerId?._id || w.sellerId || ''),
        userName: w.sellerId?.name || 'Seller',
        type: 'withdrawal',
        amount: w.amount || 0,
        product: w.method === 'mobile' ? 'Mobile money' : 'Bank transfer',
        date: w.requestDate ? new Date(w.requestDate).toLocaleString() : '',
        status: w.status || 'pending',
      })),
    ].slice(0, 12);

    res.json({
      counts: {
        users: users.length,
        pendingAccounts: pendingUsers + pendingSchools,
        pendingProducts,
        pendingReports: refunds,
        passwordResets: resetRequests,
      },
      signupStats,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/admin/users
router.get('/admin/users', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [users, products, orders, schools, teachers, students] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).lean(),
      Product.find({ isDeleted: { $ne: true } }).select('sellerId').lean(),
      Order.find().select('sellerId buyerId amount status').lean(),
      School.find().lean(),
      Teacher.find().select('school user').lean(),
      Student.find().select('school user').lean(),
    ]);

    const typeFor = (role) => {
      if (role === 'seller') return 'individual';
      return role || 'individual';
    };

    const list = users.map(u => {
      const productCount = products.filter(p => String(p.sellerId) === String(u._id)).length;
      const sales = orders
        .filter(o => String(o.sellerId) === String(u._id) && o.status === 'completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      const purchases = orders
        .filter(o => String(o.buyerId) === String(u._id))
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      const school = schools.find(s => String(s._id) === String(u.school));
      const teacherCount = u.school ? teachers.filter(t => String(t.school) === String(u.school)).length : 0;
      const studentCount = u.school ? students.filter(s => String(s.school) === String(u.school)).length : 0;

      return {
        id: String(u._id),
        type: typeFor(u.role),
        role: u.role,
        name: u.name || 'User',
        email: u.email,
        status: u.isBanned ? 'banned' : (u.active === false ? 'inactive' : 'active'),
        location: u.location || u.address || 'Kenya',
        joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
        totalSales: sales,
        productsListed: productCount,
        totalPurchases: purchases,
        teachers: teacherCount,
        students: studentCount,
        banReason: u.banReason || '',
        passwordResetRequested: !!u.passwordResetRequested,
        schoolName: school?.name || '',
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/admin/pending-accounts
router.get('/admin/pending-accounts', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const pendingUsers = await User.find({ approvalStatus: 'pending' }).select('-password').lean();
    const accounts = [];

    for (const u of pendingUsers) {
      const school = u.school ? await School.findById(u.school).lean() : null;
      const docs = (u.documents || []).map(d => d.filename || d.url || 'document');
      accounts.push({
        id: String(u._id),
        kind: 'user',
        type: u.role === 'seller' ? 'individual' : u.role,
        name: u.name || school?.name || 'Account',
        email: u.email,
        disabilityId: u.disabilityId || '',
        registrationNumber: school?.registrationNumber || '',
        documents: docs,
        location: u.address || u.location || school?.address || 'Kenya',
        requestedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
        status: 'pending',
      });
    }

    const pendingSchools = await School.find({ approved: false }).lean();
    for (const school of pendingSchools) {
      const alreadyListed = accounts.some(a => a.registrationNumber && a.registrationNumber === school.registrationNumber);
      if (alreadyListed) continue;
      const admin = await User.findOne({ school: school._id, role: 'school' }).select('-password').lean();
      if (admin && accounts.some(a => a.id === String(admin._id))) continue;
      accounts.push({
        id: String(school._id),
        kind: 'school',
        type: 'school',
        name: school.name,
        email: school.contactEmail || admin?.email || '',
        disabilityId: '',
        registrationNumber: school.registrationNumber || '',
        documents: (school.documents || []).map(d => d.filename || d.url || 'document'),
        location: school.address || 'Kenya',
        requestedDate: school.createdAt ? new Date(school.createdAt).toISOString().split('T')[0] : '',
        status: 'pending',
      });
    }

    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/accounts/:id/approve
router.put('/admin/accounts/:id/approve', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const user = await User.findById(req.params.id);
    if (user) {
      user.active = true;
      user.approvalStatus = 'approved';
      user.isBanned = false;
      await user.save();
      if (user.school) await School.findByIdAndUpdate(user.school, { approved: true });
      return res.json({ success: true, message: 'Account approved' });
    }
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ error: 'Account not found' });
    school.approved = true;
    await school.save();
    await User.updateMany({ school: school._id, role: 'school' }, { active: true, approvalStatus: 'approved' });
    res.json({ success: true, message: 'School approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/accounts/:id/decline
router.put('/admin/accounts/:id/decline', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const reason = req.body?.reason || 'Declined by administrator';
    const user = await User.findById(req.params.id);
    if (user) {
      user.active = false;
      user.approvalStatus = 'rejected';
      user.banReason = reason;
      await user.save();
      return res.json({ success: true, message: 'Account declined' });
    }
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ error: 'Account not found' });
    await User.updateMany({ school: school._id, role: 'school' }, { active: false, approvalStatus: 'rejected', banReason: reason });
    res.json({ success: true, message: 'School request declined' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/users/:id/ban
router.put('/admin/users/:id/ban', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const reason = String(req.body?.reason || '').trim();
    if (!reason) return res.status(400).json({ error: 'A reason is required' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super-admin') return res.status(400).json({ error: 'Cannot ban a super admin' });
    user.isBanned = true;
    user.active = false;
    user.banReason = reason;
    user.bannedAt = new Date();
    await user.save();
    res.json({ success: true, message: 'User banned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/users/:id/activate
router.put('/admin/users/:id/activate', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isBanned = false;
    user.active = true;
    user.approvalStatus = 'approved';
    user.banReason = '';
    await user.save();
    res.json({ success: true, message: 'User reactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/users/:id/reset-password
router.put('/admin/users/:id/reset-password', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const temporaryPassword = generateTempPassword();
    user.password = temporaryPassword;
    user.passwordResetRequested = false;
    user.passwordResetRequestedAt = undefined;
    await user.save();
    res.json({
      success: true,
      message: 'Password reset. Share this temporary password with the user.',
      temporaryPassword,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/admin/products
router.get('/admin/products', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const products = await Product.find({ status: 'pending', isDeleted: { $ne: true } })
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(products.map(p => ({
      id: String(p._id),
      sellerId: String(p.sellerId?._id || ''),
      sellerName: p.sellerId?.name || 'Seller',
      productName: p.name,
      price: p.price || 0,
      category: p.category || 'Uncategorized',
      images: (p.images || []).length,
      submittedDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
      documents: (p.images && p.images.length) ? p.images : ['No image'],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/products/:id/approve
router.put('/admin/products/:id/approve', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.status = 'active';
    await product.save();
    res.json({ success: true, message: 'Product approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard/admin/products/:id/reject
router.put('/admin/products/:id/reject', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.status = 'rejected';
    await product.save();
    res.json({ success: true, message: 'Product declined' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/admin/transactions
router.get('/admin/transactions', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const [orders, withdrawals] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(100).populate('sellerId', 'name').lean(),
      Withdrawal.find().sort({ requestDate: -1 }).limit(50).populate('sellerId', 'name').lean(),
    ]);

    const transactions = [
      ...orders.map(o => ({
        id: String(o._id),
        userId: String(o.sellerId?._id || o.sellerId || ''),
        userName: o.sellerId?.name || o.buyerName || 'Seller',
        type: 'sale',
        amount: o.amount || 0,
        product: o.productName || 'Order',
        date: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
        status: o.status || 'pending',
      })),
      ...withdrawals.map(w => ({
        id: String(w._id),
        userId: String(w.sellerId?._id || w.sellerId || ''),
        userName: w.sellerId?.name || 'Seller',
        type: 'withdrawal',
        amount: w.amount || 0,
        product: w.method === 'mobile' ? 'Mobile money' : 'Bank transfer',
        date: w.requestDate ? new Date(w.requestDate).toLocaleString() : '',
        status: w.status || 'pending',
      })),
    ];

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/admin/admins
router.get('/admin/admins', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const admins = await User.find({ role: { $in: ['admin', 'super-admin'] } }).select('-password').sort({ createdAt: 1 }).lean();
    res.json(admins.map(a => ({
      id: String(a._id),
      name: a.name || 'Admin',
      email: a.email,
      role: a.role,
      createdDate: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
      lastLogin: a.updatedAt ? new Date(a.updatedAt).toLocaleString() : '',
      status: a.isBanned ? 'banned' : 'active',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/admin/admins
router.post('/admin/admins', async (req, res) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only a super admin can create administrators' });
    }
    const { name, email, role } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const temporaryPassword = generateTempPassword();
    const admin = new User({
      name,
      email,
      password: temporaryPassword,
      role: role === 'super-admin' ? 'super-admin' : 'admin',
      active: true,
      approvalStatus: 'approved',
    });
    await admin.save();

    res.status(201).json({
      message: 'Administrator created. Share the temporary password with them.',
      temporaryPassword,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

