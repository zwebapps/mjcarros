const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Check if any admin users already exist
    const existingAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin users already exist:');
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
      });
      console.log('\n💡 If you want to create another admin, use the signup API or admin panel.\n');
      return;
    }

    // Get admin details from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mjcarros.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${adminEmail} already exists.`);
      console.log('💡 Upgrading to admin role...');
      
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' }
      });
      
      console.log(`✅ User ${adminEmail} has been upgraded to admin role.\n`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log(`🆔 ID: ${adminUser.id}`);
    console.log(`📅 Created: ${adminUser.createdAt}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🌐 Access URLs:');
    console.log(`   Admin Panel: http://localhost:3000/admin`);
    console.log(`   Sign In: http://localhost:3000/sign-in`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
