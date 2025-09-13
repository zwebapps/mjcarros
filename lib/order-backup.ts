import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Order, OrderItem, User } from '@prisma/client';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface OrderWithDetails extends Order {
  orderItems: (OrderItem & {
    product: {
      id: string;
      title: string;
      price: number;
      modelName: string;
      year: number;
      color: string;
      mileage: number;
      fuelType: string;
      imageURLs: string[];
    };
  })[];
  // Computed fields
  totalPrice: number;
  userName: string;
}

// Helper function to compute total price
function computeTotalPrice(order: any): number {
  if (order.totalPrice) return order.totalPrice;
  return order.orderItems?.reduce((total: number, item: any) => {
    const price = item.product?.price || 0;
    const quantity = item.quantity || 1;
    return total + (price * quantity);
  }, 0) || 0;
}

// Helper function to get user name
function getUserName(order: any): string {
  if (order.userName) return order.userName;
  return order.userEmail || 'Unknown Customer';
}

export async function backupOrderToS3(order: any): Promise<void> {
  try {
    // Check if S3 is configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_ORDERS_BUCKET) {
      console.log('⚠️  S3 not configured for order backup. Skipping backup.');
      return;
    }

    const bucketName = process.env.S3_ORDERS_BUCKET;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `orders/${order.id}/order-${timestamp}.json`;

    // Compute missing fields
    const totalPrice = computeTotalPrice(order);
    const userName = getUserName(order);

    // Prepare order data for backup
    const orderBackup = {
      backupInfo: {
        timestamp: new Date().toISOString(),
        orderId: order.id,
        backupType: 'order_creation',
        version: '1.0'
      },
      order: {
        id: order.id,
        phone: order.phone,
        address: order.address,
        isPaid: order.isPaid,
        totalPrice: totalPrice,
        userEmail: order.userEmail,
        userName: userName,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      },
      customer: {
        email: order.userEmail,
        name: userName
      },
      items: order.orderItems.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          modelName: item.product.modelName,
          year: item.product.year,
          color: item.product.color,
          mileage: item.product.mileage,
          fuelType: item.product.fuelType,
          imageURLs: item.product.imageURLs
        }
      })),
      summary: {
        totalItems: order.orderItems.length,
        totalQuantity: order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        totalValue: totalPrice,
        customerEmail: order.userEmail,
        customerName: userName,
        orderDate: order.createdAt
      }
    };

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: JSON.stringify(orderBackup, null, 2),
      ContentType: 'application/json',
      Metadata: {
        orderId: order.id,
        customerEmail: order.userEmail,
        orderDate: order.createdAt.toISOString(),
        totalPrice: order.totalPrice.toString()
      }
    });

    await s3Client.send(command);

    console.log(`✅ Order backup successful: s3://${bucketName}/${fileName}`);
    console.log(`📦 Order ID: ${order.id}`);
    console.log(`👤 Customer: ${userName} (${order.userEmail})`);
    console.log(`💰 Total: $${totalPrice}`);
    console.log(`📋 Items: ${order.orderItems.length} products`);

  } catch (error) {
    console.error('❌ Order backup failed:', error);
    // Don't throw error - backup failure shouldn't break order creation
  }
}

export function logOrderCreation(order: any): void {
  const totalPrice = computeTotalPrice(order);
  const userName = getUserName(order);
  
  console.log('\n🎉 NEW ORDER CREATED');
  console.log('==================');
  console.log(`📦 Order ID: ${order.id}`);
  console.log(`👤 Customer: ${userName} (${order.userEmail})`);
  console.log(`📞 Phone: ${order.phone}`);
  console.log(`📍 Address: ${order.address}`);
  console.log(`💰 Total Price: $${totalPrice}`);
  console.log(`💳 Payment Status: ${order.isPaid ? 'PAID' : 'PENDING'}`);
  console.log(`📅 Order Date: ${order.createdAt.toISOString()}`);
  console.log('\n📋 Order Items:');
  
  order.orderItems.forEach((item: any, index: number) => {
    console.log(`   ${index + 1}. ${item.product.title}`);
    console.log(`      Model: ${item.product.modelName}`);
    console.log(`      Year: ${item.product.year}`);
    console.log(`      Color: ${item.product.color}`);
    console.log(`      Mileage: ${item.product.mileage?.toLocaleString() || 'N/A'} km`);
    console.log(`      Price: $${item.product.price}`);
    console.log(`      Quantity: ${item.quantity}`);
    console.log('');
  });
  
  console.log('==================\n');
}

// Utility function to restore orders from S3 (for disaster recovery)
export async function listOrderBackups(): Promise<string[]> {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_ORDERS_BUCKET) {
      throw new Error('S3 not configured');
    }

    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_ORDERS_BUCKET,
      Prefix: 'orders/'
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(obj => obj.Key || '') || [];

  } catch (error) {
    console.error('Error listing order backups:', error);
    return [];
  }
}
