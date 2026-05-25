import { prisma } from "@/lib/prisma";

/**
 * Generates the next sequential order number
 * @returns Promise<number> - The next order number
 */
export async function generateOrderNumber(): Promise<number> {
  try {
    const result = await prisma.order.aggregate({
      _max: { orderNumber: true },
    });
    const max = result._max.orderNumber;
    return max != null ? max + 1 : 1001;
  } catch (error) {
    console.error("Error generating order number:", error);
    return Math.floor(Date.now() / 1000);
  }
}

/**
 * Formats an order number for display
 * @param orderNumber - The order number to format
 * @returns string - Formatted order number (e.g., "ORD-1001")
 */
export function formatOrderNumber(orderNumber: number): string {
  return `ORD-${orderNumber.toString().padStart(4, "0")}`;
}

/**
 * Gets the display order number for an order
 * @param order - Order object with orderNumber field
 * @returns string - Formatted order number for display
 */
export function getDisplayOrderNumber(order: { orderNumber: number }): string {
  return formatOrderNumber(order.orderNumber);
}
