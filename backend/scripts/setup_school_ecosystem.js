import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import School from '../models/School.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Caregiver from '../models/Caregiver.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import AssistanceRequest from '../models/AssistanceRequest.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

async function setupEcosystem() {
  await connectDB();
  console.log('✅ Connected to MongoDB for School-Teacher-Student Ecosystem Setup');

  // 1. Create / Update Unified School
  console.log('\n🏫 1. Setting up School...');
  let school = await School.findOne({
    $or: [
      { name: 'Hope Academy for Special Education' },
      { name: 'Sunshine Learning Center' },
      { registrationNumber: 'REG-9988' }
    ]
  });

  const schoolData = {
    name: 'Hope Academy for Special Education',
    registrationNumber: 'REG-9988',
    address: '123 School Lane, Nairobi',
    contactEmail: 'admin@hopeacademy.edu',
    contactPhone: '+254700000004',
    approved: true,
  };

  if (!school) {
    school = new School(schoolData);
    await school.save();
    console.log(`Created School: ${school.name} (ID: ${school._id})`);
  } else {
    Object.assign(school, schoolData);
    await school.save();
    console.log(`Updated School: ${school.name} (ID: ${school._id})`);
  }

  // 2. Setting up School Admin Users
  console.log('\n👑 2. Setting up School Admin Accounts...');
  const schoolAdmins = [
    {
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
    },
    {
      name: 'Principal Michael',
      email: 'admin@hopeacademy.edu',
      password: 'Password123!',
      role: 'school',
      phone: '+254700112233',
      address: '123 School Lane, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Executive Director for Hope Academy special education and talent incubation.',
      school: school._id,
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500',
    }
  ];

  for (const adminData of schoolAdmins) {
    let user = await User.findOne({ email: adminData.email });
    if (!user) {
      user = new User(adminData);
      await user.save();
      console.log(`Created School Admin User: ${adminData.name} (${adminData.email})`);
    } else {
      user.name = adminData.name;
      user.password = adminData.password;
      user.role = 'school';
      user.phone = adminData.phone;
      user.address = adminData.address;
      user.bio = adminData.bio;
      user.school = school._id;
      user.profilePhoto = adminData.profilePhoto;
      await user.save();
      console.log(`Updated School Admin User: ${adminData.name} (${adminData.email})`);
    }
  }

  // 3. Setting up Teacher Accounts
  console.log('\n👨‍🏫 3. Setting up Teacher Accounts...');
  const teachers = [
    {
      name: 'John Teacher',
      email: 'john.teacher@example.com',
      password: 'Password123!',
      role: 'teacher',
      phone: '+254700000002',
      address: '456 Teacher Crescent, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Vocational training specialist focusing on mathematics in commerce, inventory tracking, and craftwork.',
      subject: 'Mathematics & Vocational Crafts',
      staffId: 'T-9876',
      department: 'Vocational Training',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      active: true,
    },
    {
      name: 'Dr. Sarah Williams',
      email: 'sarah.williams@school.edu',
      password: 'Password123!',
      role: 'teacher',
      phone: '+254700000003',
      address: '789 Academy Road, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Dedicated educator specializing in ceramics, textile arts therapy, and student artisan incubation.',
      subject: 'Art, Pottery & Crafts',
      staffId: 'STF-ART-01',
      department: 'Fine Arts & Ceramics',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',
      active: true,
    },
    {
      name: 'Dr. Robert Chen',
      email: 'robert.chen@school.com',
      password: 'Password123!',
      role: 'teacher',
      phone: '+254700000005',
      address: '101 Campus Way, Nairobi',
      location: 'Nairobi, Kenya',
      bio: 'Instructor in woodworking and stone carving for special education artisans.',
      subject: 'Woodwork & Sculpture',
      staffId: 'STF-WOOD-02',
      department: 'Sculpture & Woodwork',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      active: false, // Pending approval
    }
  ];

  const teacherDocs = [];
  for (const t of teachers) {
    let user = await User.findOne({ email: t.email });
    if (!user) {
      user = new User({
        name: t.name,
        email: t.email,
        password: t.password,
        role: 'teacher',
        phone: t.phone,
        address: t.address,
        location: t.location,
        bio: t.bio,
        department: t.department,
        school: school._id,
        profilePhoto: t.profilePhoto,
        active: t.active,
      });
      await user.save();
      console.log(`Created Teacher User: ${t.name} (${t.email})`);
    } else {
      user.name = t.name;
      user.password = t.password;
      user.role = 'teacher';
      user.phone = t.phone;
      user.address = t.address;
      user.bio = t.bio;
      user.department = t.department;
      user.school = school._id;
      user.profilePhoto = t.profilePhoto;
      user.active = t.active;
      await user.save();
      console.log(`Updated Teacher User: ${t.name} (${t.email})`);
    }

    let teacherDoc = await Teacher.findOne({ user: user._id });
    if (!teacherDoc) {
      teacherDoc = new Teacher({
        user: user._id,
        school: school._id,
        subject: t.subject,
        staffId: t.staffId,
      });
      await teacherDoc.save();
      console.log(`Created Teacher profile doc for ${t.name}`);
    } else {
      teacherDoc.school = school._id;
      teacherDoc.subject = t.subject;
      teacherDoc.staffId = t.staffId;
      await teacherDoc.save();
    }
    teacherDocs.push({ user, teacherDoc, teacherData: t });
  }

  // 4. Setting up Student Accounts
  console.log('\n🎓 4. Setting up Student Accounts...');
  const students = [
    {
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
      studentId: 'STD-2024-089',
      profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500',
      assignedTeacherName: 'Dr. Sarah Williams',
      active: true,
    },
    {
      name: 'Emma Johnson',
      email: 'emma.student@handsandhope.org',
      password: 'Password123!',
      role: 'student',
      phone: '+254712345680',
      address: '789 Craft Street, Nairobi',
      location: 'Nairobi, Kenya',
      disabilityId: 'DIS-2024-101',
      disabilityType: 'Mobility Support',
      bio: 'Passionate student artisan designing hand-painted ceramic dinnerware, glazed cups, and beaded jewelry.',
      skills: ['Ceramics', 'Beadwork', 'Painting'],
      hobbies: ['Painting', 'Reading'],
      studentId: 'STD-2024-101',
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      assignedTeacherName: 'Dr. Sarah Williams',
      active: true,
    },
    {
      name: 'David Kip',
      email: 'david.student@handsandhope.org',
      password: 'Password123!',
      role: 'student',
      phone: '+254712345681',
      address: '321 Artisan Lane, Nairobi',
      location: 'Nairobi, Kenya',
      disabilityId: 'DIS-2024-102',
      disabilityType: 'Cognitive Support',
      bio: 'Talented wood carver creating polished wooden spoons, safari animal carvings, and decorative bowls.',
      skills: ['Wood Carving', 'Polishing', 'Joinery'],
      hobbies: ['Carving', 'Football'],
      studentId: 'STD-2024-102',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
      assignedTeacherName: 'John Teacher',
      active: true,
    },
    {
      name: 'Lucas Martinez',
      email: 'lucas.student@school.com',
      password: 'Password123!',
      role: 'student',
      phone: '+254712345682',
      address: '654 Hope Alley, Nairobi',
      location: 'Nairobi, Kenya',
      disabilityId: 'DIS-2024-103',
      disabilityType: 'Speech & Hearing Support',
      bio: 'Aspiring artisan learning macrame and fabric weaving.',
      skills: ['Weaving', 'Macrame'],
      studentId: 'STD-2024-103',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
      assignedTeacherName: 'John Teacher',
      active: false, // Pending approval
    }
  ];

  const studentDocs = [];
  for (const s of students) {
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = new User({
        name: s.name,
        email: s.email,
        password: s.password,
        role: 'student',
        phone: s.phone,
        address: s.address,
        location: s.location,
        disabilityId: s.disabilityId,
        disabilityType: s.disabilityType,
        bio: s.bio,
        skills: s.skills || [],
        hobbies: s.hobbies || [],
        school: school._id,
        profilePhoto: s.profilePhoto,
        active: s.active,
      });
      await user.save();
      console.log(`Created Student User: ${s.name} (${s.email})`);
    } else {
      user.name = s.name;
      user.password = s.password;
      user.role = 'student';
      user.phone = s.phone;
      user.address = s.address;
      user.disabilityId = s.disabilityId;
      user.disabilityType = s.disabilityType;
      user.bio = s.bio;
      user.skills = s.skills || [];
      user.hobbies = s.hobbies || [];
      user.school = school._id;
      user.profilePhoto = s.profilePhoto;
      user.active = s.active;
      await user.save();
      console.log(`Updated Student User: ${s.name} (${s.email})`);
    }

    let studentDoc = await Student.findOne({ user: user._id });
    if (!studentDoc) {
      studentDoc = new Student({
        user: user._id,
        school: school._id,
        studentId: s.studentId,
        disabilityId: s.disabilityId,
      });
      await studentDoc.save();
      console.log(`Created Student profile doc for ${s.name}`);
    } else {
      studentDoc.school = school._id;
      studentDoc.studentId = s.studentId;
      studentDoc.disabilityId = s.disabilityId;
      await studentDoc.save();
    }
    studentDocs.push({ user, studentDoc, studentData: s });
  }

  // 5. Setup Caregiver Maria Garcia linked to John Smith & Emma Johnson
  console.log('\n🤝 5. Linking Caregiver Maria Garcia to Students...');
  let caregiverUser = await User.findOne({ email: 'caregiver@handsandhope.org' });
  if (!caregiverUser) {
    caregiverUser = new User({
      name: 'Maria Garcia Caregiver',
      email: 'caregiver@handsandhope.org',
      password: 'Password123!',
      role: 'caregiver',
      phone: '+254711987654',
      bio: 'Certified disability support specialist and dedicated caregiver managing student storefronts.',
    });
    await caregiverUser.save();
  }

  const johnUser = studentDocs.find(s => s.user.email === 'john.smith@handsandhope.org')?.user;
  const emmaUser = studentDocs.find(s => s.user.email === 'emma.student@handsandhope.org')?.user;

  let caregiverDoc = await Caregiver.findOne({ user: caregiverUser._id });
  const managedAccounts = [];
  if (johnUser) {
    managedAccounts.push({
      accountId: johnUser._id,
      accountType: 'student_seller',
      relationshipType: 'Guardian & Support Caregiver',
      relationshipDetails: 'Assisting with product uploads, order dispatch, and customer communications.',
      permissionLevel: 'full',
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
        canRemoveAccount: false,
      },
      addedAt: new Date(),
    });
  }

  if (caregiverDoc) {
    caregiverDoc.managedAccounts = managedAccounts;
    await caregiverDoc.save();
    console.log('Updated Caregiver managed accounts');
  } else {
    caregiverDoc = new Caregiver({
      user: caregiverUser._id,
      phone: caregiverUser.phone,
      managedAccounts,
    });
    await caregiverDoc.save();
    console.log('Created Caregiver document with managed accounts');
  }

  // 6. Seed Student Products (both Active and Pending for Teacher Approval)
  console.log('\n🎨 6. Seeding Student Products (Active and Pending Approval)...');
  const productsToSeed = [
    // John Smith Products
    {
      sellerId: johnUser._id,
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
      viewCount: 142,
    },
    {
      sellerId: johnUser._id,
      name: 'Boho Handwoven Macrame Wall Hanging',
      price: 45.00,
      description: 'Artisanal macrame wall tapestry hand-woven from natural unbleached cotton cord on driftwood branch.',
      category: 'Textiles',
      stock: 6,
      status: 'active',
      images: [
        'https://images.unsplash.com/photo-1566206091558-7f218b696731?w=500'
      ],
      viewCount: 98,
    },
    {
      sellerId: johnUser._id,
      name: 'Carved Wooden Wildlife Keyholder',
      price: 22.00,
      description: 'Hand-carved mahogany keyholder with brass hooks, crafted in vocational wood workshop.',
      category: 'Woodwork',
      stock: 10,
      status: 'pending', // Pending Teacher Approval!
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'
      ],
      viewCount: 12,
    },
    // Emma Johnson Products
    {
      sellerId: emmaUser._id,
      name: 'Artisan Glazed Ceramic Tea Cup Set (4 pcs)',
      price: 38.00,
      description: 'Set of 4 hand-thrown ceramic mugs with oceanic gradient blue-green glaze. Food and dishwasher safe.',
      category: 'Pottery',
      stock: 8,
      status: 'active',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'
      ],
      viewCount: 115,
    },
    {
      sellerId: emmaUser._id,
      name: 'Hand-painted Floral Ceramic Plate Set',
      price: 52.00,
      description: 'Decorative ceramic plate set with vibrant floral patterns hand-painted with lead-free glaze.',
      category: 'Pottery',
      stock: 5,
      status: 'pending', // Pending Teacher Approval!
      images: [
        'https://images.unsplash.com/photo-1610701596295-4dc5d6289214?w=500'
      ],
      viewCount: 5,
    },
  ];

  for (const prod of productsToSeed) {
    let existing = await Product.findOne({ name: prod.name, sellerId: prod.sellerId });
    if (!existing) {
      await Product.create(prod);
      console.log(`Created product: "${prod.name}" (Status: ${prod.status})`);
    } else {
      existing.status = prod.status;
      existing.price = prod.price;
      existing.isDeleted = false;
      await existing.save();
      console.log(`Updated product: "${prod.name}" (Status: ${prod.status})`);
    }
  }

  // 7. Seed Assistance Request from Student to Teacher
  console.log('\n📩 7. Seeding Student-to-Teacher Assistance Request...');
  const sarahUser = teacherDocs.find(t => t.user.email === 'sarah.williams@school.edu')?.user;
  if (johnUser && sarahUser) {
    const existingReq = await AssistanceRequest.findOne({ studentId: johnUser._id });
    if (!existingReq) {
      await AssistanceRequest.create({
        studentId: johnUser._id,
        teacherId: sarahUser._id,
        schoolId: school._id,
        subject: 'Varnish coating technique for pottery',
        message: 'Hello Dr. Sarah, I have finished sculpting the ceramic elephants. Could you guide me on the oven firing temperature and best glaze coating?',
        status: 'pending',
      });
      console.log('Created Assistance Request from John Smith to Dr. Sarah Williams');
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 SCHOOL & TEACHER & STUDENT ECOSYSTEM READY FOR TESTING!');
  console.log('===============================================================');
  console.log('🏫 School Login 1:   admin@sunshine.school    / AdminPass123! (or Password123!)');
  console.log('🏫 School Login 2:   admin@hopeacademy.edu    / Password123!');
  console.log('👨‍🏫 Teacher Login 1:  john.teacher@example.com / Password123!');
  console.log('👨‍🏫 Teacher Login 2:  sarah.williams@school.edu/ Password123!');
  console.log('🎓 Student Login 1:  john.smith@handsandhope.org / Password123!');
  console.log('🎓 Student Login 2:  emma.student@handsandhope.org/ Password123!');
  console.log('🎓 Student Login 3:  david.student@handsandhope.org/ Password123!');
  console.log('🤝 Caregiver Login:  caregiver@handsandhope.org/ Password123!');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

setupEcosystem().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
