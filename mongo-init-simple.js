// Simple MongoDB initialization script
print('Starting MongoDB initialization...');

// Wait for MongoDB to be ready
sleep(3000);

const dbName       = "mjcarros";
const appUser      = "mjcarros";
const appPassword  = "786Password";
const adminEmail   = "admin@mjcarros.com";
const adminPass    = "Admin123!"; 

print('✅ Environment variables loaded successfully');
print('Database: ' + dbName);
print('App User: ' + appUser);
print('App Password: ' + appPassword);
print('Admin Email: ' + adminEmail);
print('Admin Password: ' + adminPass);

// Switch to mjcarros database
db = db.getSiblingDB(dbName);

// Create application user (same as root user in this case)
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

// Create admin user in users collection (without bcrypt for now)
db.users.insertOne({
  _id: ObjectId(),
  email: adminEmail,
  name: "Administrator",
  role: "ADMIN",
  password: adminPass, // We'll hash this later
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