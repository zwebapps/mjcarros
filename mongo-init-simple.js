// Simple MongoDB initialization script
print('Starting MongoDB initialization...');

// Wait for MongoDB to be ready
sleep(3000);

console.log("-------------Mongo Init Simple-------------------");
console.log(process.env);
console.log("-------------Mongo Init Simple-------------------");
// Use your new credentials
const dbName = process.env.MONGO_DATABASE;
const appUser = process.env.MONGO_APP_USER;
const appPassword = process.env.MONGO_APP_PASSWORD;
const adminEmail = process.env.MONGO_ADMIN_EMAIL;
const adminPass = process.env.MONGO_ADMIN_PASSWORD;
console.log("-------------DB Name-------------------");
console.log(dbName);
console.log("-------------DB Name-------------------");


print('✅ Environment variables loaded successfully');
print('Database: ' + dbName);
print('App User: ' + appUser);
print('App Password: ' + appPassword);
print('Admin Email: ' + adminEmail);
print('Admin Password: ' + adminPass);

// Switch to the specified database
db = db.getSiblingDB(dbName);

// Create application user
db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [
    { role: "readWrite", db: dbName }
  ]
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

// Create admin user in users collection
db.users.insertOne({
  _id: ObjectId(),
  email: adminEmail,
  name: "Administrator",
  role: "ADMIN",
  password: adminPass,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Admin user created in users collection');
print('Email: ' + adminEmail);  
print('Password: ' + adminPass);

print('🎉 MongoDB initialization completed successfully!');
print('Database: ' + dbName);
print('App User: ' + appUser + ' with readWrite permissions');
print('Admin User: ' + adminEmail);