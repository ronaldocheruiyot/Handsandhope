import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    console.log('📍 Connection URI:', process.env.MONGO_URI?.replace(/:[^@]+@/, ':****@'));

    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', connection.connection.name);
    console.log('🔗 Host:', connection.connection.host);
    
    // Test write operation
    const testDoc = { message: 'Connection test', timestamp: new Date() };
    
    // Get connection and create a test collection
    const db = mongoose.connection.db;
    const result = await db.collection('connection_test').insertOne(testDoc);
    console.log('✅ Write test successful - Document ID:', result.insertedId);
    
    // Clean up test document
    await db.collection('connection_test').deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful');
    
    await mongoose.disconnect();
    console.log('✅ Connection closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  }
};

testConnection();
