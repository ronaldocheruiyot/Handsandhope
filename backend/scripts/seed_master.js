import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User from '../models/User.js';
import School from '../models/School.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Seller from '../models/Seller.js';
import Caregiver from '../models/Caregiver.js';
import Buyer from '../models/Buyer.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hands-and-hope';

const runSeed = async () => {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    // 1. Clear old collections for fresh master seed
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      School.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Seller.deleteMany({}),
      Caregiver.deleteMany({}),
      Buyer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Inquiry.deleteMany({})
    ]);

    // 2. Default password for test accounts
    const defaultPass = 'Password123!';

    // 2. Create Super Admin & Admin
    console.log('Creating Admin accounts...');
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@handsandhope.org',
      password: defaultPass,
      role: 'super-admin',
      phone: '+254700000001',
      active: true
    });

    const admin = await User.create({
      name: 'Platform Admin',
      email: 'admin@handsandhope.org',
      password: defaultPass,
      role: 'admin',
      phone: '+254700000002',
      active: true
    });

    // 3. Create Sunshine Special Needs Academy (School)
    console.log('Creating School accounts...');
    const schoolUser = await User.create({
      name: 'Principal Grace Wambui',
      email: 'admin@sunshine.school',
      password: defaultPass,
      businessName: 'Sunshine Special Needs Academy',
      role: 'school',
      phone: '+254722001122',
      location: 'Nairobi, Kenya',
      address: 'P.O. Box 4500, Nairobi',
      active: true
    });

    const schoolDoc = await School.create({
      user: schoolUser._id,
      name: 'Sunshine Special Needs Academy',
      registrationNumber: 'SCH-2024-099',
      address: 'P.O. Box 4500, Nairobi',
      contactEmail: 'admin@sunshine.school',
      contactPhone: '+254722001122',
      approved: true,
      description: 'Premier inclusive education and vocational craft development center for learners with special needs.'
    });

    schoolUser.school = schoolDoc._id;
    await schoolUser.save();

    // 4. Create Teacher (John Teacher)
    console.log('Creating Teacher...');
    const teacherUser = await User.create({
      name: 'John Teacher',
      email: 'john.teacher@example.com',
      password: defaultPass,
      role: 'teacher',
      phone: '+254700000002',
      specialization: 'Woodwork & Handicrafts',
      school: schoolDoc._id,
      location: 'Nairobi, Kenya',
      active: true
    });

    const teacherDoc = await Teacher.create({
      user: teacherUser._id,
      school: schoolDoc._id,
      subject: 'Woodwork & Crafts',
      staffId: 'T-9876'
    });

    // 5. Create Student Artisan (John Smith)
    console.log('Creating Student Artisan (John Smith)...');
    const studentUser = await User.create({
      name: 'John Smith',
      email: 'john.smith@handsandhope.org',
      password: defaultPass,
      role: 'student',
      phone: '+254733445566',
      disabilityType: 'Mobility Impairment',
      disabilityId: 'DIS-2024-889',
      school: schoolDoc._id,
      bio: 'Vocational student at Sunshine Academy. Passionate about handcrafting durable wooden chairs, decorative carved animals, and ceramic bowls.',
      skills: ['Wood Carving', 'Polishing', 'Ceramic Molding'],
      location: 'Nairobi, Kenya',
      active: true,
      totalSales: 480
    });

    const studentDoc = await Student.create({
      user: studentUser._id,
      school: schoolDoc._id,
      studentId: 'STD-2024-001',
      disabilityId: 'DIS-2024-889'
    });

    // 6. Create Independent Seller (Alice Mwangi)
    console.log('Creating Independent Seller (Alice)...');
    const sellerUser = await User.create({
      name: 'Alice Mwangi',
      email: 'alice.seller@example.com',
      password: defaultPass,
      businessName: 'Alice Beadworks & Textiles',
      role: 'seller',
      phone: '+254712345678',
      disabilityType: 'Hearing Impairment',
      disabilityId: 'DIS-2024-102',
      bio: 'Artisan hand-making colorful African glass beadwork, winter scarves, and canvas tote bags.',
      skills: ['Bead Crafting', 'Knitting', 'Textiles'],
      location: 'Mombasa, Kenya',
      active: true,
      totalSales: 750
    });

    await Seller.create({
      user: sellerUser._id,
      businessName: 'Alice Beadworks & Textiles',
      phone: '+254712345678',
      disabilityId: 'DIS-2024-102'
    });

    // 7. Create Caregiver (Maria Garcia) linked to John Smith
    console.log('Creating Caregiver (Maria Garcia)...');
    const caregiverUser = await User.create({
      name: 'Maria Garcia',
      email: 'maria.garcia@handsandhope.org',
      password: defaultPass,
      role: 'caregiver',
      phone: '+254700000003',
      location: 'Nairobi, Kenya',
      active: true
    });

    await Caregiver.create({
      user: caregiverUser._id,
      phone: '+254700000003',
      managedAccounts: [
        {
          accountId: studentUser._id,
          accountType: 'student_seller',
          permissionLevel: 'full',
          relationshipType: 'Guardian / Vocational Caregiver',
          relationshipDetails: 'Assisting John Smith in product listings, photography, and customer inquiries.',
          status: 'active',
          permissions: {
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
            canViewProducts: true,
            canEditProducts: true,
            canDeleteProducts: true,
            canViewOrders: true,
            canManageOrders: true,
            canViewInquiries: true,
            canReplyToInquiries: true,
            canWithdrawFunds: true,
            canViewAnalytics: true,
            canManagePermissions: true,
            canRemoveAccount: false
          }
        }
      ]
    });

    // 8. Create Buyers (David Buyer & Jane Buyer)
    console.log('Creating Buyers (David & Jane)...');
    const davidUser = await User.create({
      name: 'David Buyer',
      email: 'david.buyer@example.com',
      password: defaultPass,
      phone: '+254711223344',
      role: 'buyer',
      location: 'Nairobi, Kenya',
      address: 'Kileleshwa Heights, Apt 4B, Nairobi',
      active: true
    });

    await Buyer.create({
      name: 'David Buyer',
      email: 'david.buyer@example.com',
      password: defaultPass,
      phoneNumber: '+254711223344',
      isActive: true
    });

    const janeUser = await User.create({
      name: 'Jane Customer',
      email: 'jane.buyer@example.com',
      password: defaultPass,
      phone: '+254799887766',
      role: 'buyer',
      location: 'Mombasa, Kenya',
      address: 'Nyali Beach Road, Mombasa',
      active: true
    });

    await Buyer.create({
      name: 'Jane Customer',
      email: 'jane.buyer@example.com',
      password: defaultPass,
      phoneNumber: '+254799887766',
      isActive: true
    });

    // 9. Create Pending Demo Accounts for Admin review
    console.log('Creating Pending accounts for Admin approval review...');
    await User.create({
      name: 'Peter Pending Artisan',
      email: 'peter.pending@example.com',
      password: defaultPass,
      role: 'seller',
      businessName: 'Peter Woodcrafts',
      phone: '+254788112233',
      location: 'Kisumu, Kenya',
      disabilityId: 'DIS-2026-99',
      active: false,
      documents: [
        {
          url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500',
          filename: 'disability_card.pdf',
          verified: false
        }
      ]
    });

    // 10. Create Products (John Smith, Alice Mwangi, and Sunshine Academy)
    console.log('Creating Products...');
    const productsData = [
      {
        sellerId: studentUser._id,
        name: 'Handmade Wooden Dining Chair',
        price: 89.99,
        status: 'active',
        category: 'Furniture',
        description: 'Solid handcrafted mahogany dining chair made with precision joinery by students at Sunshine Special Needs Academy. Sturdy, sustainable, and polished to perfection.',
        stock: 6,
        images: [
          'https://images.unsplash.com/photo-1503602642458-232111445657?w=600',
          'https://images.unsplash.com/photo-1580481077197-90c1f59bd502?w=600',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600'
        ],
        viewCount: 68,
        totalSold: 5,
        warranty: '1 Year craftsmanship warranty',
        refundDeadline: '14 days from delivery'
      },
      {
        sellerId: studentUser._id,
        name: 'Carved Wooden Giraffe Sculpture (Set of 2)',
        price: 45.00,
        status: 'active',
        category: 'Handmade Crafts',
        description: 'Pair of decorative African giraffe sculptures hand-carved and oil-polished from reclaimed teak wood. An eye-catching accent for any modern or rustic interior.',
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'
        ],
        viewCount: 84,
        totalSold: 8,
        warranty: '6 Months warranty',
        refundDeadline: '14 days'
      },
      {
        sellerId: studentUser._id,
        name: 'Glazed Ceramic Salad Bowl Set',
        price: 38.50,
        status: 'active',
        category: 'Ceramics',
        description: 'Set of 4 hand-thrown ceramic nesting bowls with food-safe earthy glaze. Perfect for salads, side dishes, and soups.',
        stock: 8,
        images: [
          'https://images.unsplash.com/photo-1610701596295-4dc5d6289214?w=600',
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600'
        ],
        viewCount: 45,
        totalSold: 4,
        warranty: 'Guaranteed safe arrival',
        refundDeadline: '14 days'
      },
      {
        sellerId: sellerUser._id,
        name: 'Authentic Beaded Maasai Statement Necklace',
        price: 32.00,
        status: 'active',
        category: 'Jewelry',
        description: 'Vibrant handcrafted African beaded collar necklace with geometric patterns. Hand-threaded with high quality glass seed beads.',
        stock: 15,
        images: [
          'https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=600',
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600'
        ],
        viewCount: 110,
        totalSold: 12,
        warranty: '1 Year beading warranty',
        refundDeadline: '14 days'
      },
      {
        sellerId: sellerUser._id,
        name: 'Hand-Knitted Merino Wool Winter Scarf',
        price: 28.00,
        status: 'active',
        category: 'Wearables',
        description: 'Ultra-soft, warm merino wool scarf hand-knitted with rich cable-knit detailing. Hypoallergenic and breathable.',
        stock: 10,
        images: [
          'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600'
        ],
        viewCount: 72,
        totalSold: 9,
        warranty: 'Quality checked',
        refundDeadline: '14 days'
      },
      {
        sellerId: sellerUser._id,
        name: 'Eco-Friendly Hand-Painted Canvas Tote Bag',
        price: 19.99,
        status: 'active',
        category: 'Textiles',
        description: 'Heavyweight organic cotton tote bag featuring original botanical block-prints hand-painted by deaf artisans.',
        stock: 20,
        images: [
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600'
        ],
        viewCount: 95,
        totalSold: 14,
        warranty: 'Washable fabric warranty',
        refundDeadline: '14 days'
      },
      {
        sellerId: studentUser._id,
        name: 'Handcrafted Hardwood Chef Cutting Board',
        price: 39.99,
        status: 'active',
        category: 'Handmade Crafts',
        description: 'Reversible end-grain hardwood cutting board treated with 100% organic beeswax and mineral oil. Built to withstand daily kitchen prep.',
        stock: 7,
        images: [
          'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600',
          'https://images.unsplash.com/photo-1503602642458-232111445657?w=600',
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600'
        ],
        viewCount: 52,
        totalSold: 6,
        warranty: 'Lifetime wood craftsmanship guarantee',
        refundDeadline: '14 days'
      },
      {
        sellerId: schoolUser._id,
        name: 'Original African Sunset Oil Painting on Canvas',
        price: 129.99,
        status: 'active',
        category: 'Art',
        description: 'Original canvas oil painting capturing the golden savannah sunset over Mount Kenya, painted collectively by students of the Fine Arts club.',
        stock: 2,
        images: [
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600',
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600'
        ],
        viewCount: 140,
        totalSold: 3,
        warranty: 'Certificate of authenticity included',
        refundDeadline: '30 days'
      },
      {
        sellerId: sellerUser._id,
        name: 'Hand-Stitched Genuine Leather Bi-Fold Wallet',
        price: 49.99,
        status: 'active',
        category: 'Wearables',
        description: 'Full-grain Kenyan cowhide leather wallet hand-stitched with waxed thread. Features 6 card slots and full cash compartment.',
        stock: 9,
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600',
          'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600',
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600'
        ],
        viewCount: 63,
        totalSold: 7,
        warranty: '2-year leather guarantee',
        refundDeadline: '14 days'
      }
    ];

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Created ${insertedProducts.length} live products!`);

    // 11. Create Sample Orders for David Buyer
    console.log('Creating Orders...');
    await Order.create([
      {
        sellerId: studentUser._id,
        buyerId: davidUser._id,
        buyerName: 'David Buyer',
        buyerEmail: 'david.buyer@example.com',
        productId: insertedProducts[0]._id,
        productName: insertedProducts[0].name,
        quantity: 1,
        amount: insertedProducts[0].price,
        status: 'completed',
        shippingAddress: 'Kileleshwa Heights, Apt 4B, Nairobi, Kenya',
        trackingNumber: 'TRK-981245710',
        rating: 5,
        feedback: 'Incredible craftsmanship and wonderful cause!',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: sellerUser._id,
        buyerId: davidUser._id,
        buyerName: 'David Buyer',
        buyerEmail: 'david.buyer@example.com',
        productId: insertedProducts[3]._id,
        productName: insertedProducts[3].name,
        quantity: 2,
        amount: insertedProducts[3].price * 2,
        status: 'shipped',
        shippingAddress: 'Kileleshwa Heights, Apt 4B, Nairobi, Kenya',
        trackingNumber: 'TRK-552091483',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]);

    // 12. Create Sample Inquiries
    console.log('Creating Inquiries...');
    await Inquiry.create([
      {
        sellerId: studentUser._id,
        buyerId: davidUser._id,
        productId: insertedProducts[1]._id,
        productName: insertedProducts[1].name,
        buyerName: 'David Buyer',
        buyerEmail: 'david.buyer@example.com',
        message: 'Hello John! I love your carved giraffe sculptures. Can you customize a set of 3 in darker mahogany wood?',
        status: 'replied',
        replies: [
          {
            message: 'Hello David! Thank you so much for supporting our work. Yes, I can carve a custom set in dark mahogany within 4 days for you!',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            responder: 'seller'
          }
        ]
      },
      {
        sellerId: sellerUser._id,
        buyerId: janeUser._id,
        productId: insertedProducts[4]._id,
        productName: insertedProducts[4].name,
        buyerName: 'Jane Customer',
        buyerEmail: 'jane.buyer@example.com',
        message: 'Hi Alice, is the winter scarf available in forest green?',
        status: 'new',
        replies: []
      }
    ]);

    console.log('\n=============================================');
    console.log(' Master Database Seed Completed Successfully!');
    console.log('=============================================');
    console.log('Accounts Ready for Testing:');
    console.log(' - Super Admin:  superadmin@handsandhope.org  / Password123!');
    console.log(' - Admin:        admin@handsandhope.org       / Password123!');
    console.log(' - School:       admin@sunshine.school        / Password123!');
    console.log(' - Teacher:      john.teacher@example.com     / Password123!');
    console.log(' - Student:      john.smith@handsandhope.org  / Password123!');
    console.log(' - Seller:       alice.seller@example.com     / Password123!');
    console.log(' - Caregiver:    maria.garcia@handsandhope.org/ Password123!');
    console.log(' - Buyer 1:      david.buyer@example.com      / Password123!');
    console.log(' - Buyer 2:      jane.buyer@example.com       / Password123!');
    console.log(' - Pending:      peter.pending@example.com    / Password123!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Master seed error:', err);
    process.exit(1);
  }
};

runSeed();
