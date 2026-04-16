import fs from 'fs/promises';
import path from 'path';

const backupRoot = () => path.join(process.cwd(), 'data', 'order-backups');

function computeTotalPrice(order: any): number {
  if (order.totalPrice) return order.totalPrice;
  return (
    order.orderItems?.reduce((total: number, item: any) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0) || 0
  );
}

function getUserName(order: any): string {
  if (order.userName) return order.userName;
  return order.userEmail || 'Unknown Customer';
}

/** Persist order JSON under `data/order-backups/` (not web-exposed). */
export async function backupOrderToS3(order: any): Promise<void> {
  try {
    const root = backupRoot();
    const orderId = String(order._id || order.id).replace(/[^a-zA-Z0-9_-]/g, '');
    const dir = path.join(root, 'orders', orderId);
    await fs.mkdir(dir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dir, `order-${timestamp}.json`);

    const totalPrice = computeTotalPrice(order);
    const userName = getUserName(order);

    const orderBackup = {
      backupInfo: {
        timestamp: new Date().toISOString(),
        orderId: order._id || order.id,
        backupType: 'order_creation',
        version: '1.0',
      },
      order: {
        id: order._id || order.id,
        phone: order.phone,
        address: order.address,
        isPaid: order.isPaid,
        totalPrice,
        userEmail: order.userEmail,
        userName,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      customer: {
        email: order.userEmail,
        name: userName,
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
          imageURLs: item.product.imageURLs,
        },
      })),
      summary: {
        totalItems: order.orderItems.length,
        totalQuantity: order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        totalValue: totalPrice,
        customerEmail: order.userEmail,
        customerName: userName,
        orderDate: order.createdAt,
      },
    };

    await fs.writeFile(filePath, JSON.stringify(orderBackup, null, 2), 'utf8');

    console.log(`✅ Order backup saved: ${filePath}`);
    console.log(`📦 Order ID: ${order._id || order.id}`);
    console.log(`👤 Customer: ${userName} (${order.userEmail})`);
  } catch (error) {
    console.error('❌ Order backup failed:', error);
  }
}

export function logOrderCreation(order: any): void {
  const totalPrice = computeTotalPrice(order);
  const userName = getUserName(order);

  console.log('\n🎉 NEW ORDER CREATED');
  console.log('==================');
  console.log(`📦 Order ID: ${order._id || order.id}`);
  console.log(`👤 Customer: ${userName} (${order.userEmail})`);
  console.log(`📞 Phone: ${order.phone}`);
  console.log(`📍 Address: ${order.address}`);
  console.log(`💰 Total Price: $${totalPrice}`);
  console.log(`💳 Payment Status: ${order.isPaid ? 'PAID' : 'PENDING'}`);
  console.log(`📅 Order Date: ${order.createdAt.toISOString()}`);
  console.log('\n📋 Order Items:');

  order.orderItems.forEach((item: any, index: number) => {
    console.log(`   ${index + 1}. ${item.productName || 'Unknown Product'}`);
    console.log(`      Product ID: ${item.productId}`);
    console.log(`      Price: $${item.price || 0}`);
    console.log(`      Quantity: ${item.quantity || 1}`);
    console.log('');
  });

  console.log('==================\n');
}

export async function listOrderBackups(): Promise<string[]> {
  try {
    const ordersDir = path.join(backupRoot(), 'orders');
    const ids = await fs.readdir(ordersDir, { withFileTypes: true });
    const keys: string[] = [];
    for (const d of ids) {
      if (!d.isDirectory()) continue;
      const sub = path.join(ordersDir, d.name);
      const files = await fs.readdir(sub);
      for (const f of files) {
        if (f.endsWith('.json')) keys.push(`orders/${d.name}/${f}`);
      }
    }
    return keys;
  } catch {
    return [];
  }
}
