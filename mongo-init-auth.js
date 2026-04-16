// MongoDB initialization script for Docker with proper auth — set passwords via environment only.
print('Starting MongoDB initialization...');

const appUser = process.env.MONGO_USERNAME;
const appPassword = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DATABASE;
if (!appPassword) {
  print('ERROR: MONGO_PASSWORD must be set.');
  quit(1);
}

// Initialize replica set
rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] });

// Switch to mjcarros database
db = db.getSiblingDB(dbName);

// Create application user
try {
  db.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: dbName }],
  });
  print('✅ Application user created successfully');
} catch (error) {
  if (error.code === 51003) {
    print('ℹ️ Application user already exists');
  } else {
    print('❌ Error creating application user:', error.message);
  }
}

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');

print('🎉 MongoDB initialization completed successfully!');
print('Replica Set: rs0');
print('App User: ' + appUser + ' (' + dbName + ' database)');
print('Collections created: users, products, categories, billboards, orders');
