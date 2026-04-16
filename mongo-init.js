// Legacy replica-set init — prefer mongo-init-simple.js for Docker. Secrets via environment only.
print('Starting MongoDB initialization...');

sleep(5000);

const appUser = process.env.MONGO_USERNAME;
const appPassword = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DATABASE;

if (!appPassword) {
  print('ERROR: MONGO_PASSWORD must be set.');
  quit(1);
}

rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }],
});

sleep(3000);

db = db.getSiblingDB('admin');
db.auth(appUser, appPassword);

db = db.getSiblingDB(dbName);

db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: dbName }],
});

db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');

print('MongoDB replica set initialized successfully!');
print('Replica Set: rs0');
print('Database: ' + dbName);
print('User created: ' + appUser + ' with readWrite permissions');
print('Collections created: users, products, categories, billboards, orders');
