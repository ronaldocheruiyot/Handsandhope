import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function testLogins() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const testAccounts = [
    { email: 'admin@sunshine.school', pass: 'AdminPass123!', role: 'school' },
    { email: 'admin@hopeacademy.edu', pass: 'Password123!', role: 'school' },
    { email: 'john.teacher@example.com', pass: 'Password123!', role: 'teacher' },
    { email: 'sarah.williams@school.edu', pass: 'Password123!', role: 'teacher' },
    { email: 'john.smith@handsandhope.org', pass: 'Password123!', role: 'student' },
    { email: 'caregiver@handsandhope.org', pass: 'Password123!', role: 'caregiver' }
  ];

  for (const acc of testAccounts) {
    const user = await User.findOne({ email: acc.email });
    if (!user) {
      console.log(`❌ ${acc.email} NOT FOUND in database`);
      continue;
    }
    const match = await bcrypt.compare(acc.pass, user.password);
    console.log(`User: ${user.name.padEnd(25)} | Email: ${user.email.padEnd(30)} | Role: ${user.role.padEnd(10)} | Password OK: ${match ? '✅ YES' : '❌ NO'}`);
  }

  await mongoose.disconnect();
}

testLogins();
