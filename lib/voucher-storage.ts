import { writeBufferToPublicUploads } from '@/lib/public-uploads';

export interface OrderWithItems {
  _id: string;
  id: string;
  orderNumber: number;
  isPaid: boolean;
  userEmail: string;
  phone: string;
  address: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    product: {
      _id: string;
      title: string;
      description: string;
      price: number;
      category: string;
      modelName: string;
      year: number;
      mileage: number;
      fuelType: string;
      color: string;
      condition: string;
      imageURLs: string[];
    };
  }[];
}

export async function uploadVoucherToPublic(
  order: OrderWithItems,
  voucherBuffer: Buffer
): Promise<string | null> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const orderKey = String(order._id || order.id).replace(/[^a-zA-Z0-9_-]/g, '');
    const relativePath = `vouchers/${orderKey}/voucher-${timestamp}.pdf`;
    const url = await writeBufferToPublicUploads(relativePath, voucherBuffer);
    const voucherNumber = `VCH-${order._id || order.id}-${Date.now()}`;
    console.log(`✅ PDF voucher saved: ${url}`);
    console.log(`📄 Voucher Number: ${voucherNumber}`);
    console.log(`📦 Order ID: ${order._id || order.id}`);
    return url;
  } catch (error) {
    console.error('❌ Voucher save failed:', error);
    return null;
  }
}

/** @deprecated Use uploadVoucherToPublic — name kept for existing imports */
export const uploadVoucherToS3 = uploadVoucherToPublic;

export async function uploadOrderVoucherToS3(order: OrderWithItems): Promise<string | null> {
  try {
    const { generatePDFVoucher } = await import('./pdf-voucher-generator');
    const pdfVoucher = await generatePDFVoucher(order);
    return uploadVoucherToPublic(order, pdfVoucher);
  } catch (error) {
    console.error('❌ Failed to generate and save PDF voucher:', error);
    return null;
  }
}
