import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from '../models/User.js';
import Caregiver from '../models/Caregiver.js';
import Product from '../models/Product.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

async function verifyDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    const john = await User.findOne({ email: 'john.smith@handsandhope.org' });
    console.log(`John Smith: ${john?._id}, name: ${john?.name}, role: ${john?.role}`);

    const maria = await User.findOne({ email: 'caregiver@handsandhope.org' });
    console.log(`Maria Garcia: ${maria?._id}, name: ${maria?.name}, role: ${maria?.role}`);

    const caregiverDoc = await Caregiver.findOne({ user: maria?._id });
    console.log(`Caregiver Doc: ${caregiverDoc?._id}`);
    console.log(`Managed accounts count: ${caregiverDoc?.managedAccounts?.length}`);
    caregiverDoc?.managedAccounts?.forEach(m => {
      console.log(` - Account ID: ${m.accountId} (matches John? ${String(m.accountId) === String(john?._id)})`);
      console.log(`   Relationship: ${m.relationshipType}`);
      console.log(`   Permissions:`, m.permissions);
    });

    // Also check if any caregivers manage John
    const caregiversManagingJohn = await Caregiver.find({
      $or: [
        { 'managedAccounts.accountId': john._id },
        { 'managedAccounts.accountId': String(john._id) }
      ]
    }).populate('user', 'name email');
    console.log(`\nCaregivers found managing John (${john._id}): ${caregiversManagingJohn.length}`);
    caregiversManagingJohn.forEach(cg => {
      console.log(` - Caregiver: ${cg.user?.name} (${cg.user?.email})`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('DB test error:', err);
  }
}

verifyDb();
