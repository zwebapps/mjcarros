const { MongoClient } = require('mongodb');
const { getMongoDbUri } = require('./mongo-uri');

async function checkUsers() {
  let client;
  
  try {
    const MONGODB_URI = getMongoDbUri();
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));
    
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGO_DATABASE || 'mjcarros');
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}, {
      projection: { password: 0 } // Exclude password field
    }).toArray();
    
    console.log('\n👥 USERS IN DATABASE:');
    console.log('======================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 Run: npm run setup-admin to create an admin user');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
      
      const adminCount = users.filter(user => user.role === 'ADMIN').length;
      console.log(`📊 Total Users: ${users.length}`);
      console.log(`👑 Admin Users: ${adminCount}`);
      console.log(`👤 Regular Users: ${users.length - adminCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 MongoDB connection refused. Make sure MongoDB is running:');
      console.log('   docker compose -f docker-compose.prod.yml up mongodb -d');
    }
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the check
checkUsers();
