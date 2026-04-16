// Simple MongoDB initialization script — secrets must come from the container environment only.
print('Starting MongoDB initialization...');

sleep(3000);

const dbName = process.env.MONGO_DATABASE;
const appUser = process.env.MONGO_USERNAME;
const appPassword = process.env.MONGO_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASSWORD;

if (!appPassword || !adminPass) {
  print('ERROR: MONGO_PASSWORD and ADMIN_PASSWORD must be set in the environment.');
  quit(1);
}

print('✅ Required secrets present (values not logged)');
print('Database: ' + dbName);
print('App User: ' + appUser);
print('Admin Email: ' + adminEmail);

// Switch to the specified database
db = db.getSiblingDB(dbName);

// Create application user
db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: dbName }],
});

print('✅ Application user created successfully');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('billboards');
db.createCollection('orders');
db.createCollection('sizes');

print('✅ Collections created successfully');

// Create admin user in users collection (plain password; setup-admin hashes on first run if needed)
db.users.insertOne({
  _id: ObjectId(),
  email: adminEmail,
  name: 'Administrator',
  role: 'ADMIN',
  password: adminPass,
  createdAt: new Date(),
  updatedAt: new Date(),
});

print('✅ Admin user created in users collection');
print('Admin Email: ' + adminEmail);

print('🎉 MongoDB initialization completed successfully!');
print('Database: ' + dbName);
print('App User: ' + appUser + ' with readWrite permissions');
print('Admin User: ' + adminEmail);
