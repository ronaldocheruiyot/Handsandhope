import mongoose from 'mongoose';
import User from '../models/User.js';
import Caregiver from '../models/Caregiver.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hands-and-hope';

const createAdminAccounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Admin account
    const adminEmail = 'admin@handsandhope.com';
    const adminPassword = 'Admin@2024';

    // Super Admin account
    const superAdminEmail = 'superadmin@handsandhope.com';
    const superAdminPassword = 'SuperAdmin@2024';

    // Caregiver account
    const caregiverEmail = 'caregiver@handsandhope.org';
    const caregiverPassword = 'Password123!';

    // Check if admin already exists
    let adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      console.log('⚠️  Admin account already exists. Updating password...');
      adminUser.password = adminPassword;
      await adminUser.save();
      console.log('✅ Admin account password updated');
    } else {
      adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+1234567890',
        active: true,
      });
      await adminUser.save();
      console.log('✅ Admin account created:', adminEmail);
    }

    // Check if super-admin already exists
    let superAdminUser = await User.findOne({ email: superAdminEmail });
    if (superAdminUser) {
      console.log('⚠️  Super Admin account already exists. Updating password...');
      superAdminUser.password = superAdminPassword;
      await superAdminUser.save();
      console.log('✅ Super Admin account password updated');
    } else {
      superAdminUser = new User({
        name: 'Super Admin User',
        email: superAdminEmail,
        password: superAdminPassword,
        role: 'super-admin',
        phone: '+0987654321',
        active: true,
      });
      await superAdminUser.save();
      console.log('✅ Super Admin account created:', superAdminEmail);
    }

    // Check if caregiver already exists
    let caregiverUser = await User.findOne({ email: caregiverEmail });
    const caregiverData = {
      name: 'Maria Garcia Caregiver',
      email: caregiverEmail,
      password: caregiverPassword,
      role: 'caregiver',
      phone: '+254711987654',
      address: '456 Maple Drive, Westlands, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Certified disability support specialist and dedicated caregiver. Managing artisan storefronts, order logistics, customer inquiries, and financial records for empowered artists.',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
      active: true,
    };

    if (caregiverUser) {
      console.log('⚠️  Caregiver account already exists. Updating details & password...');
      caregiverUser.name = caregiverData.name;
      caregiverUser.password = caregiverData.password;
      caregiverUser.role = 'caregiver';
      caregiverUser.phone = caregiverData.phone;
      caregiverUser.address = caregiverData.address;
      caregiverUser.location = caregiverData.location;
      caregiverUser.bio = caregiverData.bio;
      caregiverUser.profilePhoto = caregiverData.profilePhoto;
      await caregiverUser.save();
      console.log('✅ Caregiver account updated');
    } else {
      caregiverUser = new User(caregiverData);
      await caregiverUser.save();
      console.log('✅ Caregiver account created:', caregiverEmail);
    }

    // Link real sellers and students to this caregiver in Caregiver collection
    const sellerUsers = await User.find({ role: { $in: ['seller', 'student'] } }).limit(4);
    const managedAccounts = sellerUsers.map((s, index) => ({
      accountId: s._id,
      accountType: s.role === 'student' ? 'student_seller' : 'individual_seller',
      permissionLevel: index === 0 ? 'full' : index === 1 ? 'product_management' : 'view_only',
      relationshipType: index === 0 ? 'Family Caregiver' : 'Support Assistant',
      relationshipDetails: 'Assisting with product listings, order management, and customer messaging.',
      status: 'active',
      lastLogin: new Date(),
      permissions: {
        viewProfile: true,
        editProfile: index === 0,
        viewProducts: true,
        manageProducts: index <= 1,
        respondToInquiries: true,
        viewFinancials: true,
        withdrawMoney: index === 0,
        manageShipments: true,
        viewAnalytics: true,
        editBio: index === 0,
        editStoreName: false,
        canViewProducts: true,
        canEditProducts: index <= 1,
        canDeleteProducts: false,
        canViewOrders: true,
        canManageOrders: true,
        canViewInquiries: true,
        canReplyToInquiries: true,
        canWithdrawFunds: index === 0,
        canViewAnalytics: true,
        canManagePermissions: index === 0,
        canRemoveAccount: false,
      },
      addedAt: new Date(),
    }));

    let caregiverDoc = await Caregiver.findOne({ user: caregiverUser._id });
    if (caregiverDoc) {
      caregiverDoc.phone = caregiverData.phone;
      caregiverDoc.managedAccounts = managedAccounts;
      await caregiverDoc.save();
    } else {
      caregiverDoc = new Caregiver({
        user: caregiverUser._id,
        phone: caregiverData.phone,
        managedAccounts,
      });
      await caregiverDoc.save();
    }

    console.log('\n========================================');
    console.log('📋 DEMO & TEST CREDENTIALS:');
    console.log('----------------------------------------');
    console.log('Caregiver:');
    console.log(`  Email:    ${caregiverEmail}`);
    console.log(`  Password: ${caregiverPassword}`);
    console.log(`  Role:     caregiver`);
    console.log('----------------------------------------');
    console.log('Admin:');
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('----------------------------------------');
    console.log('Super Admin:');
    console.log(`  Email:    ${superAdminEmail}`);
    console.log(`  Password: ${superAdminPassword}`);
    console.log('========================================\n');

    await mongoose.connection.close();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminAccounts();
