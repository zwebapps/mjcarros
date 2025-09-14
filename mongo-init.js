// MongoDB initialization script for replica set with authentication
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

// Switch to mjcarros database
db = db.getSiblingDB('mjcarros');

// Create a user for the mjcarros database
db.createUser({
  user: "mjcarros",
  pwd: "786Password",
  roles: [
    { role: "readWrite", db: "mjcarros" }
  ]
});

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');

print('MongoDB replica set initialized successfully!');
print('Replica Set: rs0');
print('Database: mjcarros');
print('User created: mjcarros with readWrite permissions');
print('Collections created: users, products, categories, billboards, orders');
