const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🚀 Setting up MJ Carros Admin System...\n');

    // 1. Create Admin User
    console.log('1️⃣ Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mjcarros.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    let adminUser;
    if (existingAdmin) {
      if (existingAdmin.role !== 'ADMIN') {
        adminUser = await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        });
        console.log(`✅ User ${adminEmail} upgraded to admin role`);
      } else {
        adminUser = existingAdmin;
        console.log(`✅ Admin user ${adminEmail} already exists`);
      }
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: 'ADMIN'
        }
      });
      console.log(`✅ Admin user created: ${adminEmail}`);
    }

    // 2. Create Default Categories
    console.log('\n2️⃣ Creating default categories...');
    const defaultCategories = [
      { name: 'SUV', description: 'Sports Utility Vehicles' },
      { name: 'Sedan', description: 'Four-door passenger cars' },
      { name: 'Sports', description: 'High-performance sports cars' },
      { name: 'Electric', description: 'Electric vehicles' },
      { name: 'Luxury', description: 'Luxury vehicles' }
    ];

    for (const categoryData of defaultCategories) {
      const existingCategory = await prisma.category.findFirst({
        where: { category: categoryData.name }
      });

      if (!existingCategory) {
        // Create a default billboard for the category
        const billboard = await prisma.billboard.create({
          data: {
            billboard: `${categoryData.name} Category`,
            imageURL: `https://via.placeholder.com/800x400/1f2937/ffffff?text=${categoryData.name}`
          }
        });

        await prisma.category.create({
          data: {
            category: categoryData.name,
            billboard: `${categoryData.name} Category`,
            billboardId: billboard.id
          }
        });
        console.log(`✅ Category created: ${categoryData.name}`);
      } else {
        console.log(`✅ Category already exists: ${categoryData.name}`);
      }
    }

    // 3. Create Sample Billboards
    console.log('\n3️⃣ Creating sample billboards...');
    const sampleBillboards = [
      {
        billboard: 'Premium Collection',
        imageURL: 'https://via.placeholder.com/1200x600/1f2937/ffffff?text=Premium+Collection'
      },
      {
        billboard: 'New Arrivals',
        imageURL: 'https://via.placeholder.com/1200x600/059669/ffffff?text=New+Arrivals'
      },
      {
        billboard: 'Luxury Vehicles',
        imageURL: 'https://via.placeholder.com/1200x600/7c3aed/ffffff?text=Luxury+Vehicles'
      }
    ];

    for (const billboardData of sampleBillboards) {
      const existingBillboard = await prisma.billboard.findFirst({
        where: { billboard: billboardData.billboard }
      });

      if (!existingBillboard) {
        await prisma.billboard.create({
          data: billboardData
        });
        console.log(`✅ Billboard created: ${billboardData.billboard}`);
      } else {
        console.log(`✅ Billboard already exists: ${billboardData.billboard}`);
      }
    }

    // 4. Create Contact Page Content
    console.log('\n4️⃣ Setting up contact page...');
    const existingContactPage = await prisma.contactPage.findFirst();

    if (!existingContactPage) {
      await prisma.contactPage.create({
        data: {
          heroTitle: 'Contact MJ Carros',
          heroSubtitle: 'Get in touch with our premium automotive experts',
          address: '178 Expensive Avenue, Philadelphia, PA 20100',
          phone: '+1 (555) 000-0000',
          email: 'info@mjcarros.com',
          web: 'www.mjcarros.com',
          hours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed'
        }
      });
      console.log('✅ Contact page content created');
    } else {
      console.log('✅ Contact page content already exists');
    }

    // 5. Summary
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👤 Admin User: ${adminUser.email}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   📧 Name: ${adminUser.name}`);
    console.log(`   🏷️  Categories: ${defaultCategories.length} created`);
    console.log(`   🖼️  Billboards: ${sampleBillboards.length} created`);
    console.log(`   📞 Contact Page: Configured`);
    
    console.log('\n🌐 Access URLs:');
    console.log(`   Admin Panel: http://localhost:3000/admin`);
    console.log(`   Sign In: http://localhost:3000/sign-in`);
    console.log(`   Public Site: http://localhost:3000`);
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('   • Change the default admin password after first login');
    console.log('   • Update contact page information in admin settings');
    console.log('   • Replace placeholder billboard images with real ones');
    console.log('   • Add your first products using the bulk upload feature');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupAdmin();
