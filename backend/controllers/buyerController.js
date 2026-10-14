import Buyer from "../models/Buyer.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Inquiry from "../models/Inquiry.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, role: "buyer" },
    process.env.JWT_SECRET || "secretKey",
    { expiresIn: "7d" }
  );
};

// @desc Register buyer
export const registerBuyer = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, phone } = req.body;

    const existingUser = await User.findOne({ email });
    const existingBuyer = await Buyer.findOne({ email });
    if (existingUser || existingBuyer) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phoneNumber || phone,
      role: 'buyer'
    });

    const buyer = await Buyer.create({
      name,
      email,
      password,
      phoneNumber: phoneNumber || phone,
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      buyer: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'buyer'
      },
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'buyer'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login buyer
export const loginBuyer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check User collection first
    let user = await User.findOne({ email });
    let isMatch = false;

    if (user) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    // Fallback to Buyer collection if not found in User or password mismatch
    if (!user || !isMatch) {
      const buyer = await Buyer.findOne({ email });
      if (buyer) {
        isMatch = await bcrypt.compare(password, buyer.password);
        if (isMatch) {
          user = {
            _id: buyer._id,
            id: buyer._id,
            name: buyer.name,
            email: buyer.email,
            phone: buyer.phoneNumber,
            role: 'buyer'
          };
        }
      }
    }

    if (!user) return res.status(404).json({ message: "Buyer not found with this email" });
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });
    if (user.isBanned) return res.status(403).json({ message: "This account has been suspended. Contact support." });
    if (user.approvalStatus === "pending") return res.status(403).json({ message: "Your account is waiting for approval." });
    if (user.active === false) return res.status(403).json({ message: "This account is deactivated." });

    const token = generateToken(user);
    res.json({
      token,
      buyer: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.phoneNumber,
        address: user.address || '',
        role: 'buyer'
      },
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.phoneNumber,
        address: user.address || '',
        role: 'buyer'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update buyer profile
export const updateBuyerProfile = async (req, res) => {
  try {
    const { name, phone, phoneNumber, address } = req.body || {};
    const user = await User.findById(req.user.id);
    const buyer = user
      ? await Buyer.findOne({ email: user.email })
      : await Buyer.findById(req.user.id);

    if (!user && !buyer) return res.status(404).json({ message: "Buyer not found" });

    if (user) {
      if (name) user.name = name;
      if (phone || phoneNumber) user.phone = phone || phoneNumber;
      if (address !== undefined) user.address = address;
      await user.save();
    }

    if (buyer) {
      if (name) buyer.name = name;
      if (phone || phoneNumber) buyer.phoneNumber = phone || phoneNumber;
      if (address !== undefined) buyer.address = address;
      await buyer.save();
    }

    const profile = user || buyer;
    res.json({
      id: profile._id,
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || profile.phoneNumber || '',
      address: profile.address || '',
      role: 'buyer'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Change buyer password
export const updateBuyerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    const buyer = user
      ? await Buyer.findOne({ email: user.email })
      : await Buyer.findById(req.user.id);

    const account = user || buyer;
    if (!account) return res.status(404).json({ message: "Buyer not found" });

    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    if (user) {
      user.password = newPassword;
      await user.save();
    }
    if (buyer) {
      buyer.password = newPassword;
      await buyer.save();
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get buyer profile
export const getBuyerProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("-password");
    if (!user) {
      user = await Buyer.findById(req.user.id).select("-password");
    }
    if (!user) return res.status(404).json({ message: "Buyer not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get buyer orders
export const getBuyerOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId) || await Buyer.findById(userId);

    const query = {
      $or: [
        { buyerId: userId },
        ...(user?.email ? [{ buyerEmail: user.email }] : [])
      ]
    };

    const orders = await Order.find(query)
      .populate('sellerId', 'name businessName school phone email')
      .populate('productId', 'name price images image category description')
      .sort({ createdAt: -1 });

    const formatted = orders.map(o => {
      const seller = o.sellerId || {};
      const prod = o.productId || {};
      return {
        id: o._id,
        _id: o._id,
        product: o.productName || prod.name || 'Artisan Craft',
        productName: o.productName || prod.name || 'Artisan Craft',
        price: o.amount || prod.price || 0,
        amount: o.amount || 0,
        quantity: o.quantity || 1,
        date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '2026-09-20',
        orderDate: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '2026-09-20',
        status: o.status === 'completed' ? 'Delivered'
          : (o.status === 'shipped' || o.status === 'in_transit') ? 'In Transit'
          : o.status === 'cancelled' ? 'Cancelled'
          : o.status === 'refunded' ? 'Refunded'
          : 'Processing',
        rawStatus: o.status,
        image: (prod.images && prod.images[0]) || prod.image || 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300',
        trackingNumber: o.trackingNumber || `TRK-${String(o._id).substring(18).toUpperCase()}`,
        seller: seller.businessName || seller.name || 'Artisan Center',
        sellerName: seller.name || 'Artisan',
        shippingAddress: o.shippingAddress || 'Nairobi, Kenya',
        feedback: o.feedback || '',
        rating: o.rating || 5
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Error fetching buyer orders", error: error.message });
  }
};

// @desc Create buyer order (checkout)
export const createBuyerOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress, paymentMethod, trackingConsent } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Cart items are required to place an order" });
    }

    const buyerUser = await User.findById(userId) || await Buyer.findById(userId);
    const createdOrders = [];

    for (const item of items) {
      const prodId = item.productId || item.id || item._id;
      const product = await Product.findById(prodId);
      
      const qty = parseInt(item.quantity) || 1;
      const amount = (product ? product.price : parseFloat(item.price)) * qty;
      const trackingNumber = `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`;

      const order = new Order({
        sellerId: product?.sellerId || item.sellerId || userId,
        buyerId: userId,
        buyerName: buyerUser?.name || shippingAddress?.fullName || 'Valued Customer',
        buyerEmail: buyerUser?.email || 'buyer@example.com',
        productId: product?._id || prodId,
        productName: product?.name || item.name || item.product || 'Artisan Craft',
        quantity: qty,
        amount: amount,
        status: 'pending',
        shippingAddress: typeof shippingAddress === 'object' 
          ? `${shippingAddress.address}, ${shippingAddress.city} (${shippingAddress.zipCode})`
          : (shippingAddress || 'Standard Delivery Address'),
        trackingNumber: trackingNumber,
        trackingConsent: !!trackingConsent,
        paymentMethod: paymentMethod || 'credit-card'
      });

      await order.save();
      createdOrders.push(order);

      // Decrement stock and increment totalSold if product exists
      if (product) {
        product.stock = Math.max(0, (product.stock || 1) - qty);
        product.totalSold = (product.totalSold || 0) + qty;
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      orders: createdOrders,
      orderCount: createdOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
};

// @desc Get buyer inquiries
export const getBuyerInquiries = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId) || await Buyer.findById(userId);

    const inquiries = await Inquiry.find({
      $or: [
        { buyerId: userId },
        ...(user?.email ? [{ buyerEmail: user.email }] : [])
      ]
    })
      .populate('sellerId', 'name businessName phone email')
      .populate('productId', 'name price images image')
      .sort({ updatedAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inquiries", error: error.message });
  }
};

// @desc Deactivate buyer
export const deactivateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: "Account deactivated", buyer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete buyer account
export const deleteBuyer = async (req, res) => {
  try {
    await Buyer.findByIdAndDelete(req.user.id);
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Buyer account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
