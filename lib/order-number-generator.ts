import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros';

/**
 * Generates the next sequential order number
 * @returns Promise<number> - The next order number
 */
export async function generateOrderNumber(): Promise<number> {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const dbName = process.env.MONGO_DATABASE;
    console.log("-------------DB Name-------------------");
    console.log(dbName);
    console.log("-------------DB Name-------------------");
    
    await client.connect();
    const db = client.db(dbName);
    const ordersCollection = db.collection('orders');
    
    // Find the highest existing order number
    const orders = await ordersCollection.find({}).sort({ orderNumber: -1 }).limit(1).toArray();

    // If no orders exist, start with 1001
    // If orders exist, increment the highest number by 1
    const nextOrderNumber = orders.length > 0 ? orders[0].orderNumber + 1 : 1001;

    return nextOrderNumber;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback: generate a timestamp-based number
    return Math.floor(Date.now() / 1000);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Formats an order number for display
 * @param orderNumber - The order number to format
 * @returns string - Formatted order number (e.g., "ORD-1001")
 */
export function formatOrderNumber(orderNumber: number): string {
  return `ORD-${orderNumber.toString().padStart(4, '0')}`;
}

/**
 * Gets the display order number for an order
 * @param order - Order object with orderNumber field
 * @returns string - Formatted order number for display
 */
export function getDisplayOrderNumber(order: { orderNumber: number }): string {
  return formatOrderNumber(order.orderNumber);
}