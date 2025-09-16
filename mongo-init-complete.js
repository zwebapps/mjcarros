// Complete MongoDB initialization script
print('Starting MongoDB initialization...');

// Wait for MongoDB to be ready
sleep(5000);

// Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" }
  ]
});

// Wait for replica set to be ready
sleep(3000);

// Switch to admin database
db = db.getSiblingDB('admin');

// Create root user
db.createUser({
  user: "root",
  pwd: "rootpassword123",
  roles: [
    { role: "root", db: "admin" }
  ]
});

print('✅ Root user created successfully');

// Switch to mjcarros database
db = db.getSiblingDB('mjcarros');

// Create application user
db.createUser({
  user: "mjcarros",
  pwd: "786Password",
  roles: [
    { role: "readWrite", db: "mjcarros" }
  ]
});

print('✅ Application user created successfully');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');

print('✅ Collections created successfully');

// Create admin user in users collection
const bcrypt = require('bcryptjs');
const adminPassword = bcrypt.hashSync('Admin123!', 10);

db.users.insertOne({
  _id: ObjectId(),
  email: "admin@mjcarros.com",
  name: "Administrator",
  role: "ADMIN",
  password: adminPassword,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Admin user created in users collection');
print('Email: admin@mjcarros.com');
print('Password: Admin123!');

print('🎉 MongoDB initialization completed successfully!');
print('Replica Set: rs0');
print('Root User: root (admin database)');
print('App User: mjcarros (mjcarros database)');
print('Admin User: admin@mjcarros.com (mjcarros database)');
