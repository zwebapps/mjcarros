const { PrismaClient } = require('@prisma/client');
const { backupOrderToS3, logOrderCreation, listOrderBackups } = require('../lib/order-backup');

const prisma = new PrismaClient();

async function testOrderBackup() {
  try {
    console.log('🧪 Testing Order Backup to S3...\n');

    // Check environment variables
    const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_ORDERS_BUCKET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('\n💡 Add these to your .env file:');
      console.log('AWS_ACCESS_KEY_ID=your_access_key');
      console.log('AWS_SECRET_ACCESS_KEY=your_secret_key');
      console.log('S3_ORDERS_BUCKET=your-bucket-name/orders');
      console.log('AWS_DEFAULT_REGION=your_region');
      return;
    }

    console.log('✅ Environment variables found:');
    console.log(`   Bucket: ${process.env.S3_ORDERS_BUCKET}`);
    console.log(`   Region: ${process.env.AWS_DEFAULT_REGION || 'us-east-1'}`);
    console.log('');

    // Get the most recent order for testing
    const recentOrder = await prisma.order.findFirst({
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                make: true,
                model: true,
                year: true,
                colour: true,
                mileage: true,
                fuelType: true,
                vin: true,
                deliveryDate: true,
                images: true
              }
            }
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!recentOrder) {
      console.log('⚠️  No orders found in database. Create an order first to test backup.');
      return;
    }

    console.log(`📦 Testing with order: ${recentOrder.id}`);
    console.log(`👤 Customer: ${recentOrder.userName} (${recentOrder.userEmail})`);
    console.log(`💰 Total: $${recentOrder.totalPrice}`);
    console.log('');

    // Test console logging
    console.log('1️⃣ Testing console logging...');
    logOrderCreation(recentOrder);

    // Test S3 backup
    console.log('2️⃣ Testing S3 backup...');
    await backupOrderToS3(recentOrder);

    // List existing backups
    console.log('\n3️⃣ Listing existing order backups...');
    const backups = await listOrderBackups();
    console.log(`📁 Found ${backups.length} backup files:`);
    backups.slice(0, 5).forEach(backup => {
      console.log(`   - ${backup}`);
    });
    if (backups.length > 5) {
      console.log(`   ... and ${backups.length - 5} more`);
    }

    console.log('\n🎉 Order backup test completed successfully!');
    console.log('\n📋 What happens when orders are created:');
    console.log('   ✅ Detailed console logging with order details');
    console.log('   ✅ Automatic backup to S3 as JSON files');
    console.log('   ✅ Backup includes complete order, customer, and product data');
    console.log('   ✅ Backup files organized by order ID and timestamp');
    console.log('   ✅ Disaster recovery capability even if database is lost');

  } catch (error) {
    console.error('❌ Order backup test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check AWS credentials are correct');
    console.log('   2. Verify S3 bucket exists and is accessible');
    console.log('   3. Ensure bucket has proper permissions');
    console.log('   4. Check AWS region is correct');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOrderBackup();
