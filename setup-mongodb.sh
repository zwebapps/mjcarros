#!/bin/bash

echo "🔧 Setting up MongoDB with authentication and replica set..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to start..."
sleep 10

# Initialize replica set
echo "🔄 Initializing replica set..."
docker exec mongodb mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' }
  ]
})
"

# Wait for replica set to be ready
echo "⏳ Waiting for replica set to be ready..."
sleep 5

# Create application user
echo "👤 Creating application user..."
docker exec mongodb mongosh admin -u mjcarros -p 786Password --eval "
db = db.getSiblingDB('mjcarros');
db.createUser({
  user: 'mjcarros',
  pwd: '786Password',
  roles: [
    { role: 'readWrite', db: 'mjcarros' }
  ]
});
"

# Create collections
echo "📁 Creating collections..."
docker exec mongodb mongosh mjcarros -u mjcarros -p 786Password --authenticationDatabase admin --eval "
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');
"

echo "✅ MongoDB setup completed successfully!"
echo "🔗 Connection string: mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=admin"
