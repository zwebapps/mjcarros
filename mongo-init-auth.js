// MongoDB initialization script for Docker with proper auth
print('Starting MongoDB initialization...');

// Initialize replica set
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] });

// Switch to mjcarros database
db = db.getSiblingDB('mjcarros');

// Create application user
try {
  db.createUser({
    user: "mjcarros",
    pwd: "786Password",
    roles: [{ role: "readWrite", db: "mjcarros" }]
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
print('App User: mjcarros (mjcarros database)');
print('Collections created: users, products, categories, billboards, orders');
