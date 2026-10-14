import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import School from '../models/School.js';
import Caregiver from '../models/Caregiver.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';

dotenv.config();

async function runSetup() {
  await connectDB();
  console.log('✅ Connected to Database for Caregiver-Student setup');

  // 1. Create or Find School
  let school = await School.findOne({ name: 'Hope Academy for Special Education' });
  if (!school) {
    school = new School({
      name: 'Hope Academy for Special Education',
      registrationNumber: 'REG-9988',
      address: '123 School Lane, Nairobi',
      contactEmail: 'admin@hopeacademy.edu',
      contactPhone: '+254700000004',
      approved: true,
      totalTeachers: 5,
      totalStudents: 32,
    });
    await school.save();
    console.log('Created School: Hope Academy for Special Education');
  }

  // 1b. Create School Admin User: Principal Admin
  let adminUser = await User.findOne({ email: 'admin@sunshine.school' });
  if (!adminUser) {
    adminUser = new User({
      name: 'Principal Admin',
      email: 'admin@sunshine.school',
      password: 'AdminPass123!',
      role: 'school',
      phone: '+254700000004',
      address: '123 School Lane, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Head administrator overseeing vocational development programs and student artisan storefronts.',
      school: school._id,
      profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500',
    });
    await adminUser.save();
    console.log('Created School Admin User: Principal Admin (admin@sunshine.school)');
  }

  // 2a. Create Teacher: John Teacher
  let johnTeacherUser = await User.findOne({ email: 'john.teacher@example.com' });
  if (!johnTeacherUser) {
    johnTeacherUser = new User({
      name: 'John Teacher',
      email: 'john.teacher@example.com',
      password: 'Password123!',
      role: 'teacher',
      phone: '+254700000002',
      address: '456 Teacher Crescent, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Vocational training specialist focusing on mathematics in commerce, inventory tracking, and craftwork.',
      department: 'Vocational Training',
      school: school._id,
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    });
    await johnTeacherUser.save();
    await Teacher.create({
      user: johnTeacherUser._id,
      school: school._id,
      subject: 'Mathematics & Vocational Crafts',
      staffId: 'T-9876',
    });
    console.log('Created Teacher: John Teacher (john.teacher@example.com)');
  }

  // 2b. Create or Find Teacher: Dr. Sarah Williams
  let teacherUser = await User.findOne({ email: 'sarah.williams@school.edu' });
  if (!teacherUser) {
    teacherUser = new User({
      name: 'Dr. Sarah Williams',
      email: 'sarah.williams@school.edu',
      password: 'Password123!',
      role: 'teacher',
      phone: '+254700000003',
      address: '789 Academy Road, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Dedicated educator specializing in vocational arts therapy and craft mentorship.',
      school: school._id,
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',
    });
    await teacherUser.save();
    await Teacher.create({
      user: teacherUser._id,
      school: school._id,
      subject: 'Art & Vocational Crafts',
      staffId: 'STF-ART-01'
    });
    console.log('Created Teacher: Dr. Sarah Williams');
  }

  // 3. Create or Update Student: John Smith
  let johnUser = await User.findOne({ email: 'john.smith@handsandhope.org' });
  if (!johnUser) {
    johnUser = await User.findOne({ name: 'John Smith' });
  }

  const johnData = {
    name: 'John Smith',
    email: 'john.smith@handsandhope.org',
    password: 'Password123!',
    role: 'student',
    phone: '+254712345679',
    address: '456 Vocational Way, Nairobi',
    location: 'Nairobi, Kenya',
    disabilityId: 'DIS-2024-8832',
    disabilityType: 'Visual / Hearing Support',
    bio: 'Talented student artisan crafting handmade pottery, abstract clay sculptures, and colorful woven wall hangings.',
    skills: ['Sculpture', 'Pottery', 'Macrame', 'Crafts'],
    hobbies: ['Clay Sculpting', 'Music', 'Gardening'],
    profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500',
  };

  if (johnUser) {
    Object.assign(johnUser, johnData);
    await johnUser.save();
    console.log('Updated existing Student user: John Smith');
  } else {
    johnUser = new User(johnData);
    await johnUser.save();
    console.log('Created Student user: John Smith');
  }

  // Ensure Student document
  let johnStudentDoc = await Student.findOne({ user: johnUser._id });
  if (!johnStudentDoc) {
    johnStudentDoc = new Student({
      user: johnUser._id,
      school: school._id,
      studentId: 'STD-2024-089',
      grade: 'Vocational Year 2',
      specialNeeds: 'Visual / Hearing Support',
      guardianName: 'Maria Garcia',
      guardianPhone: '+254711987654',
      disabilityId: 'DIS-2024-8832',
    });
    await johnStudentDoc.save();
    console.log('Created Student profile doc for John Smith');
  }

  // 4. Seed Products for John Smith
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
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500'
      ],
      sellerId: johnUser._id,
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
        'https://images.unsplash.com/photo-1566206091558-7f218b696731?w=500'
      ],
      sellerId: johnUser._id,
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
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'
      ],
      sellerId: johnUser._id,
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
        'https://images.unsplash.com/photo-1611591477271-e3e8f49a21d1?w=500'
      ],
      sellerId: johnUser._id,
      viewCount: 84,
      warranty: 'Wood Polish Guarantee',
      refundDeadline: '14 Days from Delivery'
    }
  ];

  const savedProducts = [];
  for (const prod of sampleProducts) {
    let item = await Product.findOne({ name: prod.name, sellerId: johnUser._id });
    if (!item) {
      item = await Product.create(prod);
      console.log(`Created Product for John Smith: ${prod.name}`);
    } else {
      Object.assign(item, prod);
      item.isDeleted = false;
      await item.save();
    }
    savedProducts.push(item);
  }

  // Find or create test buyer
  let buyerUser = await User.findOne({ email: 'buyer.jane@example.com' });
  if (!buyerUser) {
    buyerUser = new User({
      name: 'Jane Mwangi',
      email: 'buyer.jane@example.com',
      password: 'Password123!',
      role: 'seller', // or default role
      phone: '+254700998877',
      address: '77 City Square, Nairobi',
      location: 'Nairobi, Kenya',
    });
    await buyerUser.save();
    console.log('Created Buyer user: Jane Mwangi');
  }

  // 5. Seed Inquiries for John Smith
  const sampleInquiries = [
    {
      sellerId: johnUser._id,
      buyerId: buyerUser._id,
      productId: savedProducts[0]?._id,
      productName: savedProducts[0]?.name || 'African Elephant Sculpture',
      buyerName: 'Jane Mwangi',
      buyerEmail: 'buyer.jane@example.com',
      message: 'Hello John! I love your elephant sculpture. Can you craft one in a darker terracotta glaze?',
      status: 'new',
      timestamp: new Date(Date.now() - 3600000 * 4),
    },
    {
      sellerId: johnUser._id,
      buyerId: buyerUser._id,
      productId: savedProducts[2]?._id,
      productName: savedProducts[2]?.name || 'Ceramic Tea Cup Set',
      buyerName: 'David K. Artisan Collector',
      buyerEmail: 'david.collector@example.com',
      message: 'Hi John, are these mugs suitable for hot espresso and coffee? Are they lead-free certified?',
      status: 'new',
      timestamp: new Date(Date.now() - 3600000 * 12),
    },
    {
      sellerId: johnUser._id,
      buyerId: buyerUser._id,
      productId: savedProducts[1]?._id,
      productName: savedProducts[1]?.name || 'Macrame Wall Hanging',
      buyerName: 'Amanda Craft Home',
      buyerEmail: 'amanda.crafts@example.com',
      message: 'Good day! What are the exact dimensions of the macrame wall hanging including the wooden rod?',
      status: 'new',
      timestamp: new Date(Date.now() - 3600000 * 24),
    }
  ];

  for (const inq of sampleInquiries) {
    const exists = await Inquiry.findOne({ sellerId: johnUser._id, message: inq.message });
    if (!exists) {
      await Inquiry.create(inq);
      console.log(`Created Inquiry for John Smith from: ${inq.buyerName}`);
    }
  }

  // 6. Seed Completed Orders for John Smith
  const sampleOrders = [
    {
      sellerId: johnUser._id,
      buyerId: buyerUser._id,
      productId: savedProducts[0]?._id,
      productName: savedProducts[0]?.name || 'Clay Sculpture',
      buyerName: 'Michael Ochieng',
      buyerEmail: 'michael.o@example.com',
      amount: 65.00,
      quantity: 1,
      status: 'completed',
      shippingMethod: 'self',
      trackingNumber: 'TRK-2026-8812',
      createdAt: new Date(Date.now() - 86400000 * 3)
    },
    {
      sellerId: johnUser._id,
      buyerId: buyerUser._id,
      productId: savedProducts[1]?._id,
      productName: savedProducts[1]?.name || 'Macrame Wall Hanging',
      buyerName: 'Claire Bennett',
      buyerEmail: 'claire.b@example.com',
      amount: 45.00,
      quantity: 1,
      status: 'completed',
      shippingMethod: 'platform',
      trackingNumber: 'TRK-2026-9934',
      createdAt: new Date(Date.now() - 86400000 * 6)
    },
    {
      sellerId: johnUser._id,
      buyerId: buyerUser._id,
      productId: savedProducts[3]?._id,
      productName: savedProducts[3]?.name || 'Carved Wooden Giraffe',
      buyerName: 'Robert Vance',
      buyerEmail: 'robert.v@example.com',
      amount: 28.00,
      quantity: 1,
      status: 'completed',
      shippingMethod: 'self',
      trackingNumber: 'TRK-2026-7721',
      createdAt: new Date(Date.now() - 86400000 * 10)
    }
  ];

  for (const ord of sampleOrders) {
    const exists = await Order.findOne({ sellerId: johnUser._id, trackingNumber: ord.trackingNumber });
    if (!exists) {
      await Order.create(ord);
      console.log(`Created Order for John Smith: ${ord.trackingNumber}`);
    }
  }

  // 7. Create/Update Caregiver Maria Garcia with John Smith linked
  let caregiverUser = await User.findOne({ email: 'caregiver@handsandhope.org' });
  const caregiverData = {
    name: 'Maria Garcia Caregiver',
    email: 'caregiver@handsandhope.org',
    password: 'Password123!',
    role: 'caregiver',
    phone: '+254711987654',
    address: '456 Maple Drive, Westlands, Nairobi',
    location: 'Nairobi, Kenya',
    bio: 'Certified disability support specialist and dedicated caregiver. Managing artisan storefronts, product catalogs, customer messages, and shipments for empowered creators.',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
  };

  if (!caregiverUser) {
    caregiverUser = new User(caregiverData);
    await caregiverUser.save();
    console.log('Created Caregiver user: Maria Garcia');
  } else {
    Object.assign(caregiverUser, caregiverData);
    await caregiverUser.save();
    console.log('Updated Caregiver user: Maria Garcia');
  }

  // Find other sellers/students if any to provide multiple managed accounts
  const otherUsers = await User.find({ 
    _id: { $ne: johnUser._id },
    role: { $in: ['seller', 'student'] } 
  }).limit(2);

  const managedAccounts = [
    {
      accountId: johnUser._id,
      accountType: 'student_seller',
      relationshipType: 'Guardian & Support Caregiver',
      relationshipDetails: 'Assisting student artisan John Smith with online store setup, product photography, pricing, orders, and inquiries.',
      permissionLevel: 'full',
      status: 'active',
      lastLogin: new Date(),
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
        canRemoveAccount: false,
      },
      addedAt: new Date(),
    }
  ];

  if (otherUsers.length > 0) {
    managedAccounts.push({
      accountId: otherUsers[0]._id,
      accountType: otherUsers[0].role === 'student' ? 'student_seller' : 'individual_seller',
      relationshipType: 'Care Assistant',
      relationshipDetails: 'Assisting with product uploads and catalog updates.',
      permissionLevel: 'product_management',
      status: 'active',
      lastLogin: new Date(),
      permissions: {
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
        canViewProducts: true,
        canEditProducts: true,
        canDeleteProducts: false,
        canViewOrders: true,
        canManageOrders: true,
        canViewInquiries: true,
        canReplyToInquiries: true,
        canWithdrawFunds: false,
        canViewAnalytics: true,
        canManagePermissions: false,
        canRemoveAccount: false,
      },
      addedAt: new Date(),
    });
  }

  let caregiverDoc = await Caregiver.findOne({ user: caregiverUser._id });
  if (caregiverDoc) {
    caregiverDoc.phone = caregiverData.phone;
    caregiverDoc.managedAccounts = managedAccounts;
    await caregiverDoc.save();
    console.log('Updated Caregiver document with John Smith as managed account');
  } else {
    caregiverDoc = new Caregiver({
      user: caregiverUser._id,
      phone: caregiverData.phone,
      managedAccounts,
    });
    await caregiverDoc.save();
    console.log('Created Caregiver document with John Smith as managed account');
  }

  console.log('\n======================================================');
  console.log('🎉 SETUP COMPLETED SUCCESSFULLY!');
  console.log('Caregiver Login:  caregiver@handsandhope.org / Password123!');
  console.log('Student Login:    john.smith@handsandhope.org / Password123!');
  console.log('Teacher Login:    sarah.williams@school.edu / Password123!');
  console.log(`John Smith ID:    ${johnUser._id}`);
  console.log('======================================================\n');

  process.exit(0);
}

runSetup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
