const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Use different connection strings for Docker vs local development
const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
console.log("--------------------------------");
console.log(isDocker, process.env);
console.log("--------------------------------");
// Fix malformed DATABASE_URL that might have duplicate key names
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
  databaseUrl = databaseUrl.replace('DATABASE_URL=', '');
}

const MONGODB_URI = databaseUrl || 
  (isDocker 
    ? 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros'
    : 'mongodb://mjcarros:786Password@localhost:27017/mjcarros?authSource=mjcarros'
  );

console.log(MONGODB_URI);
async function setupAdmin() {
  let client;
  
  try {
    console.log('🚀 Setting up MJ Carros Admin System...\n');

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');
    const categoriesCollection = db.collection('categories');
    const billboardsCollection = db.collection('billboards');
    const contactPageCollection = db.collection('contactPage');

    // 1. Create Admin User
    console.log('1️⃣ Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mjcarros.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    const existingAdmin = await usersCollection.findOne({
      email: adminEmail
    });

    let adminUser;
    if (existingAdmin) {
      // Check if password needs to be updated (if it's plain text)
      const needsPasswordUpdate = !existingAdmin.password || !existingAdmin.password.startsWith('$2');
      
      if (existingAdmin.role !== 'ADMIN' || needsPasswordUpdate) {
        const updateData = { updatedAt: new Date() };
        
        if (existingAdmin.role !== 'ADMIN') {
          updateData.role = 'ADMIN';
          console.log(`🔄 Upgrading user ${adminEmail} to admin role`);
        }
        
        if (needsPasswordUpdate) {
          const hashedPassword = await bcrypt.hash(adminPassword, 12);
          updateData.password = hashedPassword;
          console.log(`🔐 Updating password for ${adminEmail} with bcrypt hash`);
        }
        
        await usersCollection.updateOne(
          { email: adminEmail },
          { $set: updateData }
        );
        adminUser = await usersCollection.findOne({ email: adminEmail });
        console.log(`✅ Admin user ${adminEmail} updated successfully`);
      } else {
        adminUser = existingAdmin;
        console.log(`✅ Admin user ${adminEmail} already exists with correct settings`);
      }
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const newUser = {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await usersCollection.insertOne(newUser);
      adminUser = { ...newUser, _id: result.insertedId };
      console.log(`✅ Admin user created: ${adminEmail}`);
    }

    // 1.5. Create Test User (optional)
    console.log('\n1️⃣.5️⃣ Creating test user...');
    const testEmail = 'test@mjcarros.com';
    const testPassword = 'Test123!';
    const testName = 'Test User';
    
    const existingTestUser = await usersCollection.findOne({ email: testEmail });
    
    if (!existingTestUser) {
      const hashedTestPassword = await bcrypt.hash(testPassword, 12);
      const testUser = {
        email: testEmail,
        password: hashedTestPassword,
        name: testName,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await usersCollection.insertOne(testUser);
      console.log(`✅ Test user created: ${testEmail}`);
    } else {
      console.log(`✅ Test user already exists: ${testEmail}`);
    }

    // 2. Create Default Categories
    console.log('\n2️⃣ Creating default categories...');
    const defaultCategories = [
      { name: 'SUV', description: 'Sports Utility Vehicles' },
      { name: 'Sedan', description: 'Four-door passenger cars' },
      { name: 'Sports', description: 'High-performance sports cars' },
      { name: 'Electric', description: 'Electric vehicles' },
      { name: 'Luxury', description: 'Luxury vehicles' }
    ];

    for (const categoryData of defaultCategories) {
      const existingCategory = await categoriesCollection.findOne({
        category: categoryData.name
      });

      if (!existingCategory) {
        // Create a default billboard for the category
        const billboardData = {
          billboard: `${categoryData.name} Category`,
          imageURL: '/placeholder-image.jpg', // Use local placeholder instead of external service
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const billboardResult = await billboardsCollection.insertOne(billboardData);

        const categoryDoc = {
          category: categoryData.name,
          billboard: `${categoryData.name} Category`,
          billboardId: billboardResult.insertedId.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await categoriesCollection.insertOne(categoryDoc);
        console.log(`✅ Category created: ${categoryData.name}`);
      } else {
        console.log(`✅ Category already exists: ${categoryData.name}`);
      }
    }

    // 3. Create Sample Billboards
    console.log('\n3️⃣ Creating sample billboards...');
    const sampleBillboards = [
      {
        billboard: 'Premium Collection',
        imageURL: '/placeholder-image.jpg' // Use local placeholder instead of external service
      },
      {
        billboard: 'New Arrivals',
        imageURL: '/placeholder-image.jpg' // Use local placeholder instead of external service
      },
      {
        billboard: 'Luxury Vehicles',
        imageURL: '/placeholder-image.jpg' // Use local placeholder instead of external service
      }
    ];

    for (const billboardData of sampleBillboards) {
      const existingBillboard = await billboardsCollection.findOne({
        billboard: billboardData.billboard
      });

      if (!existingBillboard) {
        const billboardDoc = {
          ...billboardData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await billboardsCollection.insertOne(billboardDoc);
        console.log(`✅ Billboard created: ${billboardData.billboard}`);
      } else {
        console.log(`✅ Billboard already exists: ${billboardData.billboard}`);
      }
    }

    // 4. Create Contact Page Content
    console.log('\n4️⃣ Setting up contact page...');
    const existingContactPage = await contactPageCollection.findOne({});

    if (!existingContactPage) {
      const contactPageData = {
        heroTitle: 'Contact MJ Carros',
        heroSubtitle: 'Get in touch with our premium automotive experts',
        address: '178 Expensive Avenue, Philadelphia, PA 20100',
        phone: '+1 (555) 000-0000',
        email: 'info@mjcarros.com',
        web: 'www.mjcarros.com',
        hours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await contactPageCollection.insertOne(contactPageData);
      console.log('✅ Contact page content created');
    } else {
      console.log('✅ Contact page content already exists');
    }

    // 5. Summary
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👤 Admin User: ${adminUser.email}`);
    console.log(`   🔑 Admin Password: ${adminPassword}`);
    console.log(`   📧 Admin Name: ${adminUser.name}`);
    console.log(`   👤 Test User: ${testEmail}`);
    console.log(`   🔑 Test Password: ${testPassword}`);
    console.log(`   🏷️  Categories: ${defaultCategories.length} created`);
    console.log(`   🖼️  Billboards: ${sampleBillboards.length} created`);
    console.log(`   📞 Contact Page: Configured`);
    
    console.log('\n🌐 Access URLs:');
    console.log(`   Admin Panel: http://localhost:3000/admin`);
    console.log(`   Sign In: http://localhost:3000/sign-in`);
    console.log(`   Public Site: http://localhost:3000`);
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('   • Change the default admin password after first login');
    console.log('   • Update contact page information in admin settings');
    console.log('   • Replace placeholder billboard images with real ones');
    console.log('   • Add your first products using the bulk upload feature');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
setupAdmin();
