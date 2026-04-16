#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
fi

: "${MONGO_PASSWORD:?Error: set MONGO_PASSWORD (e.g. in .env at repo root)}"
MONGO_USERNAME="${MONGO_USERNAME:-mjcarros}"

echo "🔧 Setting up MongoDB with authentication and replica set..."

echo "⏳ Waiting for MongoDB to start..."
sleep 10

echo "🔄 Initializing replica set..."
docker exec mongodb mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' }
  ]
})
"

echo "⏳ Waiting for replica set to be ready..."
sleep 5

echo "👤 Creating application user..."
docker exec mongodb mongosh admin -u "$MONGO_USERNAME" -p "$MONGO_PASSWORD" --eval "
db = db.getSiblingDB('mjcarros');
db.createUser({
  user: '$MONGO_USERNAME',
  pwd: '$MONGO_PASSWORD',
  roles: [
    { role: 'readWrite', db: 'mjcarros' }
  ]
});
"

echo "📁 Creating collections..."
docker exec mongodb mongosh mjcarros -u "$MONGO_USERNAME" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');
"

echo "✅ MongoDB setup completed successfully!"
echo "🔗 Use DATABASE_URL or MONGO_* variables from your .env (password not printed)."
