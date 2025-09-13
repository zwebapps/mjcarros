import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates the next sequential order number
 * @returns Promise<number> - The next order number
 */
export async function generateOrderNumber(): Promise<number> {
  try {
    // Find the highest existing order number
    const lastOrder = await prisma.order.findFirst({
      orderBy: {
        orderNumber: 'desc'
      },
      select: {
        orderNumber: true
      }
    });

    // If no orders exist, start with 1001
    // If orders exist, increment the highest number by 1
    const nextOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;

    return nextOrderNumber;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback: generate a timestamp-based number
    return Math.floor(Date.now() / 1000);
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
