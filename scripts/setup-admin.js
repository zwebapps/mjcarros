const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const DEFAULT_CATEGORIES_FALLBACK = [
  { name: 'Luxury', description: 'Luxury vehicles' },
  { name: 'Sports', description: 'High-performance sports cars' },
  { name: 'SUV', description: 'Sports Utility Vehicles' },
  { name: 'Electric', description: 'Electric vehicles' },
  { name: 'Sedan', description: 'Four-door passenger cars' },
];

const defaultCategoriesPath = path.join(__dirname, '..', 'data', 'default-categories.json');
let defaultCategoriesSeed;
try {
  defaultCategoriesSeed = JSON.parse(fs.readFileSync(defaultCategoriesPath, 'utf8'));
} catch (e) {
  console.warn('⚠️ Using inline default categories (could not read data/default-categories.json):', e.message);
  defaultCategoriesSeed = DEFAULT_CATEGORIES_FALLBACK;
}

const defaultProductsPath = path.join(__dirname, '..', 'data', 'default-products.json');
let defaultProductsSeed;
try {
  defaultProductsSeed = JSON.parse(fs.readFileSync(defaultProductsPath, 'utf8'));
} catch (e) {
  console.warn('⚠️ Using empty default products list (could not read data/default-products.json):', e.message);
  defaultProductsSeed = [];
}

const dbName = process.env.MONGO_DATABASE;

const mongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

/** Mongo may not accept connections for several seconds after the container starts. */
async function connectWithRetry(uri, attempts = 15, delayMs = 3000) {
  let lastErr;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const c = new MongoClient(uri, mongoClientOptions);
      await c.connect();
      return c;
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ Mongo connect attempt ${i}/${attempts} failed: ${e.message}`);
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
const { getMongoDbUri } = require('./mongo-uri');

/** Hide credentials in URIs for logs (never print raw passwords). */
function redactMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return String(uri);
  try {
    const u = new URL(uri);
    if (u.username) u.username = '(user)';
    if (u.password) u.password = '(redacted)';
    return u.toString();
  } catch {
    return uri.replace(/\/\/(?:[^@/]*@)/, '//(user):(redacted)@');
  }
}

function maskSecret(v) {
  if (v == null || v === '') return '[empty]';
  const s = String(v);
  return `[set, length=${s.length}]`;
}

/** Log env used for Mongo so auth failures can be diagnosed without exposing secrets. */
function logMongoConnectionDebug(resolvedUri) {
  console.log('--- Mongo connection debug (passwords not shown) ---');s
  console.log('MONGODB_URI:', process.env);
  console.log('----------------------------------------------------\n');
  console.log('NODE_ENV:', process.env.NODE_ENV ?? '[unset]');
  console.log('DOCKER:', process.env.DOCKER ?? '[unset]');
  console.log('MONGO_HOST:', process.env.MONGO_HOST ?? '[unset]');
  console.log('MONGO_PORT:', process.env.MONGO_PORT ?? '[unset]');
  console.log('MONGO_DATABASE:', process.env.MONGO_DATABASE ?? '[unset]');
  console.log('MONGO_AUTH_SOURCE:', process.env.MONGO_AUTH_SOURCE ?? '[unset]');
  console.log('MONGO_USERNAME:', process.env.MONGO_USERNAME ?? '[unset]');
  console.log('MONGO_PASSWORD:', maskSecret(process.env.MONGO_PASSWORD));
  console.log('DATABASE_URL (raw env, redacted):', process.env.DATABASE_URL ? redactMongoUri(process.env.DATABASE_URL) : '[unset]');
  console.log('MONGO_ROOT_USERNAME:', process.env.MONGO_ROOT_USERNAME ?? '[unset]');
  console.log('MONGO_ROOT_PASSWORD:', maskSecret(process.env.MONGO_ROOT_PASSWORD));
  console.log('Resolved URI (redacted):', redactMongoUri(resolvedUri));
  console.log('DB name used (MONGO_DATABASE):', dbName);
  console.log('----------------------------------------------------\n');
}

/** Prefer mongo-uri.js (URL-encoded passwords). Root user authenticates against `admin`, not app DB. */
function resolveMongoUri() {
  try {
    return getMongoDbUri();
  } catch {
    const ru = process.env.MONGO_ROOT_USERNAME;
    const rp = process.env.MONGO_ROOT_PASSWORD;
    if (!ru || !rp) return null;
    const host = isDocker ? 'mongodb' : '127.0.0.1';
    const u = encodeURIComponent(ru);
    const p = encodeURIComponent(rp);
    return `mongodb://${u}:${p}@${host}:27017/admin?authSource=admin`;
  }
}

const MONGODB_URI = resolveMongoUri();

async function setupAdmin() {
  let client;
  
  try {
    console.log('🚀 Setting up MJ Carros Admin System...\n');

    if (!dbName || !String(dbName).trim()) {
      console.error('❌ Set MONGO_DATABASE in the environment (same DB name as in DATABASE_URL / mongo-init).');
      process.exit(1);
    }

    if (!MONGODB_URI) {
      console.error(
        '❌ Set DATABASE_URL or both MONGO_ROOT_USERNAME and MONGO_ROOT_PASSWORD in the environment.'
      );
      process.exit(1);
    }

    logMongoConnectionDebug(MONGODB_URI);

    // Connect to MongoDB (retry while mongod finishes startup)
    client = await connectWithRetry(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const categoriesCollection = db.collection('categories');
    const billboardsCollection = db.collection('billboards');
    const contactPageCollection = db.collection('contactPage');

    // 1. Create Admin User
    console.log('1️⃣ Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    if (!adminEmail || !adminPassword || !adminName) {
      console.error('❌ Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in the environment.');
      process.exit(1);
    }

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

    // 1.5. Create Test User (optional — only if TEST_USER_PASSWORD is set, dev/staging)
    const testPassword = process.env.TEST_USER_PASSWORD;
    const testEmail = process.env.TEST_USER_EMAIL || 'test@mjcarros.com';
    const testName = process.env.TEST_USER_NAME || 'Test User';

    if (testPassword) {
      console.log('\n1️⃣.5️⃣ Creating test user (TEST_USER_PASSWORD is set)...');
      const existingTestUser = await usersCollection.findOne({ email: testEmail });

      if (!existingTestUser) {
        const hashedTestPassword = await bcrypt.hash(testPassword, 12);
        const testUser = {
          email: testEmail,
          password: hashedTestPassword,
          name: testName,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await usersCollection.insertOne(testUser);
        console.log(`✅ Test user created: ${testEmail}`);
      } else {
        console.log(`✅ Test user already exists: ${testEmail}`);
      }
    } else {
      console.log('\n1️⃣.5️⃣ Skipping test user (set TEST_USER_PASSWORD to create one).');
    }

    // 2. Create Default Categories (shared list: data/default-categories.json)
    console.log('\n2️⃣ Creating default categories...');
    for (const categoryData of defaultCategoriesSeed) {
      const existingCategory = await categoriesCollection.findOne({
        category: categoryData.name
      });

      if (!existingCategory) {
        // Create a default billboard for the category
        const billboardData = {
          billboard: `${categoryData.name} Category`,
          imageURL: '/placeholder-image.svg', // Use local placeholder instead of external service
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

    // 2.5 Default showroom vehicles (idempotent via seedKey; users can add more in admin)
    console.log('\n2️⃣.5️⃣ Seeding default products...');
    const productsCollection = db.collection('products');
    for (const p of defaultProductsSeed) {
      if (!p.seedKey || !p.category || !p.title) {
        console.warn('⚠️ Skipping invalid default product entry (missing seedKey, category, or title)');
        continue;
      }
      const already = await productsCollection.findOne({ seedKey: p.seedKey });
      if (already) {
        console.log(`✅ Default product already exists: ${p.title}`);
        continue;
      }
      const catDoc = await categoriesCollection.findOne({ category: p.category });
      if (!catDoc) {
        console.warn(`⚠️ Skip "${p.title}": category "${p.category}" not found`);
        continue;
      }
      const categoryId = catDoc._id.toString();
      const newId = new ObjectId();
      const productCode = `PRD-${newId.toHexString().slice(-6).toUpperCase()}`;
      const now = new Date();
      const productDoc = {
        _id: newId,
        seedKey: p.seedKey,
        productCode,
        title: p.title,
        description: p.description || '',
        imageURLs: Array.isArray(p.imageURLs) && p.imageURLs.length ? p.imageURLs : ['/placeholder-image.svg'],
        category: p.category,
        categoryId,
        price: Number(p.price) || 0,
        finalPrice: p.finalPrice !== undefined ? Number(p.finalPrice) : Number(p.price) || 0,
        discount: p.discount !== undefined ? Number(p.discount) : 0,
        featured: !!p.featured,
        sold: !!p.sold,
        negotiable: !!p.negotiable,
        modelName: p.modelName || '',
        year: p.year ? Number(p.year) : 0,
        stockQuantity: p.stockQuantity !== undefined ? Number(p.stockQuantity) : 1,
        color: p.color || '',
        fuelType: p.fuelType || '',
        transmission: p.transmission || '',
        mileage: p.mileage !== undefined && p.mileage !== null ? Number(p.mileage) : null,
        condition: p.condition || 'used',
        createdAt: now,
        updatedAt: now,
      };
      await productsCollection.insertOne(productDoc);
      console.log(`✅ Seeded default product: ${p.title}`);
    }

    // 3. Create Sample Billboards
    console.log('\n3️⃣ Creating sample billboards...');
    const sampleBillboards = [
      {
        billboard: 'Premium Collection',
        imageURL: '/placeholder-image.svg' // Use local placeholder instead of external service
      },
      {
        billboard: 'New Arrivals',
        imageURL: '/placeholder-image.svg' // Use local placeholder instead of external service
      },
      {
        billboard: 'Luxury Vehicles',
        imageURL: '/placeholder-image.svg' // Use local placeholder instead of external service
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
    console.log(`   📧 Admin Name: ${adminUser.name}`);
    if (testPassword) {
      console.log(`   👤 Test User: ${testEmail} (password set via TEST_USER_PASSWORD — not logged)`);
    }
    console.log(`   🏷️  Categories: ${defaultCategoriesSeed.length} in seed list`);
    console.log(`   🚗 Default showroom cars: ${defaultProductsSeed.length} in seed list (skipped if already present)`);
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
    console.log('   • Add more vehicles in admin or bulk upload; defaults use seedKey and will not duplicate');

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
