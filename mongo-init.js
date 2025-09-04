// MongoDB initialization script for replica set
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

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');

print('MongoDB replica set initialized successfully!');
print('Replica Set: rs0');
print('Database: mjcarros');
print('Collections created: users, products, categories, billboards, orders');
print('Note: Running without authentication for now');
