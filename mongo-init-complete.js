// Complete MongoDB init (legacy / non-Docker-official flows). Prefer mongo-init-simple.js with Compose.
// Requires secrets in environment — no hardcoded passwords.
print('Starting MongoDB initialization...');

sleep(5000);

const rootUser = process.env.MONGO_INITDB_ROOT_USERNAME || process.env.MONGO_ROOT_USERNAME || 'root';
const rootPwd = process.env.MONGO_INITDB_ROOT_PASSWORD || process.env.MONGO_ROOT_PASSWORD;
const appUser = process.env.MONGO_USERNAME;
const appPassword = process.env.MONGO_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPlain = process.env.ADMIN_PASSWORD;
const dbName = process.env.MONGO_DATABASE;

if (!rootPwd || !appPassword || !adminPlain) {
  print('ERROR: Set MONGO_INITDB_ROOT_PASSWORD (or MONGO_ROOT_PASSWORD), MONGO_PASSWORD, and ADMIN_PASSWORD.');
  quit(1);
}

rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }],
});

sleep(3000);

db = db.getSiblingDB('admin');

db.createUser({
  user: rootUser,
  pwd: rootPwd,
  roles: [{ role: 'root', db: 'admin' }],
});

print('✅ Root user created successfully');

db = db.getSiblingDB(dbName);

db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: dbName }],
});

print('✅ Application user created successfully');

db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');

print('✅ Collections created successfully');

const bcrypt = require('bcryptjs');
const adminPassword = bcrypt.hashSync(adminPlain, 10);

db.users.insertOne({
  _id: ObjectId(),
  email: adminEmail,
  name: 'Administrator',
  role: 'ADMIN',
  password: adminPassword,
  createdAt: new Date(),
  updatedAt: new Date(),
});

print('✅ Admin user created in users collection');
print('Email: ' + adminEmail);

print('🎉 MongoDB initialization completed successfully!');
print('Replica Set: rs0');
print('Root User: ' + rootUser + ' (admin database)');
print('App User: ' + appUser + ' (' + dbName + ' database)');
print('Admin User: ' + adminEmail + ' (' + dbName + ' database)');
