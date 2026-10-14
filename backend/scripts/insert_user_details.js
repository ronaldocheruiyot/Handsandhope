import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import School from '../models/School.js';

dotenv.config();

const usersToSeed = [
  {
    name: "Alice Seller",
    email: "alice.seller@example.com",
    phone: "+254700000001",
    password: "Password123!",
    role: "seller",
    disabilityId: "D-12345",
    documents: [
      {
        url: "/uploads/1700000000-123456789-my-certificate.pdf",
        filename: "my-certificate.pdf",
        storedName: "1700000000-123456789-my-certificate.pdf",
        mimeType: "application/pdf",
        size: 23456,
        uploadedAt: new Date("2025-11-30T12:00:00.000Z")
      }
    ]
  },
  {
    name: "Mary Student",
    email: "mary.student@example.com",
    phone: "+254700000003",
    password: "Password123!",
    role: "student",
    studentId: "S-1122",
    disabilityId: "DIS-4433",
    schoolName: "Bright Futures School",
    documents: [
      {
        url: "/uploads/1700000000-333333333-student-id.png",
        filename: "student-id.png",
        storedName: "1700000000-333333333-student-id.png",
        mimeType: "image/png",
        size: 54321,
        uploadedAt: new Date("2025-11-30T12:10:00.000Z")
      }
    ]
  },
  {
    name: "John Teacher",
    email: "john.teacher@example.com",
    phone: "+254700000002",
    password: "Password123!",
    role: "teacher",
    subject: "Mathematics",
    staffId: "T-9876",
    schoolName: "Hope Academy for Special Education",
    documents: [
      {
        url: "/uploads/1700000000-222222222-teacher-id.jpg",
        filename: "teacher-id.jpg",
        storedName: "1700000000-222222222-teacher-id.jpg",
        mimeType: "image/jpeg",
        size: 12345,
        uploadedAt: new Date("2025-11-30T12:05:00.000Z")
      }
    ]
  },
  {
    name: "Principal Admin",
    email: "admin@sunshine.school",
    phone: "+254700000004",
    password: "AdminPass123!",
    role: "school",
    schoolName: "Sunshine Learning Center",
    registrationNumber: "REG-9988",
    schoolAddress: "123 School Lane, Nairobi",
    schoolDocuments: [
      {
        url: "/uploads/1700000000-444444444-license.pdf",
        filename: "license.pdf",
        storedName: "1700000000-444444444-license.pdf",
        mimeType: "application/pdf",
        size: 99999,
        uploadedAt: new Date("2025-11-30T12:15:00.000Z")
      }
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB database...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${conn.connection.name} @ ${conn.connection.host}`);

    // Helper: Find or create a school
    async function ensureSchool(name, extra = {}) {
      let school = await School.findOne({ name });
      if (!school) {
        school = new School({
          name,
          registrationNumber: extra.registrationNumber || `REG-${Math.floor(1000 + Math.random() * 9000)}`,
          address: extra.address || 'Nairobi, Kenya',
          contactEmail: extra.contactEmail || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
          contactPhone: extra.contactPhone || '+254700000000',
          approved: true,
          documents: extra.documents || []
        });
        await school.save();
        console.log(`🏫 Created School: ${school.name} (ID: ${school._id})`);
      } else if (extra.documents || extra.registrationNumber || extra.address) {
        if (extra.registrationNumber) school.registrationNumber = extra.registrationNumber;
        if (extra.address) school.address = extra.address;
        if (extra.contactEmail) school.contactEmail = extra.contactEmail;
        if (extra.contactPhone) school.contactPhone = extra.contactPhone;
        if (extra.documents) school.documents = extra.documents;
        await school.save();
        console.log(`🏫 Updated School: ${school.name} (ID: ${school._id})`);
      }
      return school;
    }

    // Process each item
    for (const item of usersToSeed) {
      console.log(`\n-----------------------------------------`);
      console.log(`👤 Processing ${item.role.toUpperCase()}: ${item.name} (${item.email})...`);

      // Check if user already exists
      let user = await User.findOne({ email: item.email });

      let schoolRef = null;
      if (item.schoolName) {
        const schoolDoc = await ensureSchool(item.schoolName, {
          registrationNumber: item.registrationNumber,
          address: item.schoolAddress,
          contactEmail: item.email,
          contactPhone: item.phone,
          documents: item.schoolDocuments || item.documents
        });
        schoolRef = schoolDoc._id;
      }

      if (user) {
        console.log(`ℹ️ User ${item.email} already exists. Updating details...`);
        user.name = item.name;
        user.phone = item.phone;
        user.password = item.password; // Mongoose pre-save will hash this
        user.role = item.role;
        user.disabilityId = item.disabilityId || user.disabilityId;
        user.documents = item.documents || [];
        if (schoolRef) user.school = schoolRef;
        await user.save();
        console.log(`✅ Updated User record: ${user._id}`);
      } else {
        user = new User({
          name: item.name,
          email: item.email,
          password: item.password, // Mongoose pre-save will hash this
          phone: item.phone,
          role: item.role,
          disabilityId: item.disabilityId,
          school: schoolRef,
          documents: item.documents || []
        });
        await user.save();
        console.log(`✅ Created new User record: ${user._id}`);
      }

      // Role-specific records
      if (item.role === 'seller') {
        let seller = await Seller.findOne({ user: user._id });
        if (!seller) {
          seller = new Seller({
            user: user._id,
            businessName: item.businessName || item.name,
            phone: item.phone,
            disabilityId: item.disabilityId,
            documents: item.documents
          });
          await seller.save();
          console.log(`✅ Created Seller record: ${seller._id}`);
        } else {
          seller.phone = item.phone;
          seller.disabilityId = item.disabilityId;
          seller.documents = item.documents;
          await seller.save();
          console.log(`✅ Updated Seller record: ${seller._id}`);
        }
      } else if (item.role === 'student') {
        let student = await Student.findOne({ user: user._id });
        if (!student) {
          student = new Student({
            user: user._id,
            school: schoolRef,
            studentId: item.studentId,
            disabilityId: item.disabilityId,
            documents: item.documents
          });
          await student.save();
          console.log(`✅ Created Student record: ${student._id}`);
        } else {
          student.school = schoolRef;
          student.studentId = item.studentId;
          student.disabilityId = item.disabilityId;
          student.documents = item.documents;
          await student.save();
          console.log(`✅ Updated Student record: ${student._id}`);
        }
      } else if (item.role === 'teacher') {
        let teacher = await Teacher.findOne({ user: user._id });
        if (!teacher) {
          teacher = new Teacher({
            user: user._id,
            school: schoolRef,
            subject: item.subject,
            staffId: item.staffId,
            documents: item.documents
          });
          await teacher.save();
          console.log(`✅ Created Teacher record: ${teacher._id}`);
        } else {
          teacher.school = schoolRef;
          teacher.subject = item.subject;
          teacher.staffId = item.staffId;
          teacher.documents = item.documents;
          await teacher.save();
          console.log(`✅ Updated Teacher record: ${teacher._id}`);
        }
      } else if (item.role === 'school') {
        let school = await School.findOne({ name: item.schoolName });
        if (!school) {
          school = new School({
            name: item.schoolName,
            registrationNumber: item.registrationNumber,
            address: item.schoolAddress,
            contactEmail: item.email,
            contactPhone: item.phone,
            approved: true,
            documents: item.schoolDocuments
          });
          await school.save();
          console.log(`✅ Created School record: ${school._id}`);
        } else {
          school.registrationNumber = item.registrationNumber;
          school.address = item.schoolAddress;
          school.contactEmail = item.email;
          school.contactPhone = item.phone;
          school.documents = item.schoolDocuments;
          await school.save();
          console.log(`✅ Updated School record: ${school._id}`);
        }
        user.school = school._id;
        await user.save();
      }
    }

    console.log(`\n=========================================`);
    console.log(`🎉 All user details have been successfully added/updated in the database!`);
    console.log(`=========================================`);

    // Verify all 4 users in MongoDB
    console.log(`\n🔍 Verifying stored users in MongoDB:`);
    const allUsers = await User.find({ email: { $in: usersToSeed.map(u => u.email) } });
    for (const u of allUsers) {
      console.log(`- ${u.name} | Email: ${u.email} | Role: ${u.role} | Docs: ${u.documents.length} | ID: ${u._id}`);
      if (u.role === 'seller') {
        const s = await Seller.findOne({ user: u._id });
        console.log(`   └─ Seller record: ${s ? s._id : 'Not Found'} (DisabilityID: ${s?.disabilityId})`);
      } else if (u.role === 'student') {
        const s = await Student.findOne({ user: u._id }).populate('school');
        console.log(`   └─ Student record: ${s ? s._id : 'Not Found'} (School: ${s?.school?.name}, StudentID: ${s?.studentId}, DisabilityID: ${s?.disabilityId})`);
      } else if (u.role === 'teacher') {
        const t = await Teacher.findOne({ user: u._id }).populate('school');
        console.log(`   └─ Teacher record: ${t ? t._id : 'Not Found'} (School: ${t?.school?.name}, Subject: ${t?.subject}, StaffID: ${t?.staffId})`);
      } else if (u.role === 'school') {
        const sc = await School.findById(u.school);
        console.log(`   └─ School record: ${sc ? sc._id : 'Not Found'} (Name: ${sc?.name}, Reg: ${sc?.registrationNumber})`);
      }
    }

    await mongoose.disconnect();
    console.log('\n👋 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
