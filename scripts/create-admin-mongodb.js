const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://root:rootpassword123@localhost:27017/mjcarros?authSource=admin';

async function createAdminUser() {
  let client;
  try {
    console.log('🔐 Creating admin user with MongoDB...\n');

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');

    // Check if any admin users already exist
    const existingAdmins = await usersCollection.find({ role: 'ADMIN' }).toArray();

    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin users already exist:');
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.name || admin.email} (${admin.email})`);
      });
      console.log('\n💡 If you want to create another admin, use the signup API or admin panel.\n');
      return;
    }

    // Get admin details from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mjcarros.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    // Check if user with this email already exists
    const existingUser = await usersCollection.findOne({ email: adminEmail });

    if (existingUser) {
      console.log(`⚠️  User with email ${adminEmail} already exists.`);
      console.log('💡 Upgrading to admin role...');
      
      await usersCollection.updateOne(
        { email: adminEmail },
        { $set: { role: 'ADMIN' } }
      );
      
      console.log(`✅ User ${adminEmail} has been upgraded to admin role.\n`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUserData = {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(adminUserData);
    const adminUser = { ...adminUserData, _id: result.insertedId };

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log(`🆔 ID: ${adminUser._id}`);
    console.log(`📅 Created: ${adminUser.createdAt}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🌐 Access URLs:');
    console.log(`   Admin Panel: http://localhost:3000/admin`);
    console.log(`   Sign In: http://localhost:3000/sign-in`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
createAdminUser();