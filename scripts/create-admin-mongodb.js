const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getMongoDbUri } = require('./mongo-uri');

async function createAdminUser() {
  let client;
  try {
    console.log('🔐 Creating admin user with MongoDB...\n');

    const MONGODB_URI = getMongoDbUri();
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    if (!adminEmail || !adminPassword) {
      console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.');
      process.exit(1);
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const dbName = process.env.MONGO_DATABASE;
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const existingAdmins = await usersCollection.find({ role: 'ADMIN' }).toArray();

    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin users already exist:');
      existingAdmins.forEach((admin) => {
        console.log(`   - ${admin.name || admin.email} (${admin.email})`);
      });
      console.log('\n💡 If you want to create another admin, use the signup API or admin panel.\n');
      return;
    }

    const existingUser = await usersCollection.findOne({ email: adminEmail });

    if (existingUser) {
      console.log(`⚠️  User with email ${adminEmail} already exists.`);
      console.log('💡 Upgrading to admin role...');

      await usersCollection.updateOne({ email: adminEmail }, { $set: { role: 'ADMIN' } });

      console.log(`✅ User ${adminEmail} has been upgraded to admin role.\n`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUserData = {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(adminUserData);
    const adminUser = { ...adminUserData, _id: result.insertedId };

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log(`🆔 ID: ${adminUser._id}`);
    console.log(`📅 Created: ${adminUser.createdAt}`);
    console.log('\n🌐 Access URLs:');
    console.log('   Admin Panel: http://localhost:3000/admin');
    console.log('   Sign In: http://localhost:3000/sign-in');
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

createAdminUser();
