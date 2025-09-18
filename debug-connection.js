const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://root:rootpassword123@localhost:27017/mjcarros?authSource=admin';

async function debugConnection() {
  console.log('🔍 Debugging MongoDB connection...');
  console.log('URI:', MONGODB_URI);
  
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('📡 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db('mjcarros');
    console.log('📊 Database:', db.databaseName);
    
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👥 User count:', userCount);
    
    const users = await usersCollection.find({}).toArray();
    console.log('👥 Users:', users.map(u => ({ email: u.email, role: u.role })));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

debugConnection();
