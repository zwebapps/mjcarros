import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadVoucherToS3(order: OrderWithItems, voucherBuffer: Buffer): Promise<string | null> {
  try {
    // Check if S3 is configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_ORDERS_BUCKET) {
      console.log('⚠️  S3 not configured for voucher upload. Skipping voucher backup.');
      return null;
    }

    const bucketName = process.env.S3_ORDERS_BUCKET;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const voucherFileName = `vouchers/${order._id || order.id}/voucher-${timestamp}.pdf`;
    const voucherNumber = `VCH-${order._id || order.id}-${Date.now()}`;

    // Upload voucher PDF to S3
    const voucherCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: voucherFileName,
      Body: voucherBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        orderId: order._id || order.id,
        customerEmail: order.userEmail || '',
        voucherNumber: voucherNumber,
        orderDate: order.createdAt.toISOString(),
        documentType: 'voucher'
      }
    });

    await s3Client.send(voucherCommand);

    const voucherUrl = `https://${bucketName}.s3.${process.env.AWS_DEFAULT_REGION || 'us-east-1'}.amazonaws.com/${voucherFileName}`;

    console.log(`✅ PDF Voucher uploaded to S3: ${voucherUrl}`);
    console.log(`📄 Voucher Number: ${voucherNumber}`);
    console.log(`📦 Order ID: ${order._id || order.id}`);
    console.log(`👤 Customer: ${order.userEmail}`);

    return voucherUrl;

  } catch (error) {
    console.error('❌ Voucher upload to S3 failed:', error);
    return null;
  }
}

export async function uploadOrderVoucherToS3(order: OrderWithItems): Promise<string | null> {
  try {
    // Import PDF generator
    const { generatePDFVoucher } = await import('./pdf-voucher-generator');
    
    // Generate PDF voucher
    const pdfVoucher = await generatePDFVoucher(order);
    
    // Upload to S3
    const voucherUrl = await uploadVoucherToS3(order, pdfVoucher);
    
    return voucherUrl;
  } catch (error) {
    console.error('❌ Failed to generate and upload PDF voucher:', error);
    return null;
  }
}

// Voucher HTML generator (copied from voucher-generator.ts for S3 upload)
function generateVoucherHTML(order: OrderWithItems): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalAmount = order.orderItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0);
  }, 0);

  const voucherNumber = `VCH-${order._id || order.id}-${Date.now()}`;
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const itemsHtml = order.orderItems.map((item, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px;">${index + 1}</td>
      <td style="padding: 12px; color: #1f2937; font-size: 14px; font-weight: 500;">${item.productName}</td>
      <td style="padding: 12px; color: #6b7280; font-size: 14px;">${item.product?.modelName || 'N/A'}</td>
      <td style="padding: 12px; color: #6b7280; font-size: 14px;">${item.product?.year || 'N/A'}</td>
      <td style="padding: 12px; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">€${item.product?.price?.toFixed(2) || '0.00'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Voucher - MJ Carros</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #1f2937; }
        .voucher-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 2px solid #1e40af; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; text-align: center; color: white; }
        .logo { height: 50px; width: auto; filter: brightness(0) invert(1); margin-bottom: 16px; }
        .voucher-title { font-size: 24px; font-weight: 700; margin: 0; }
        .voucher-subtitle { font-size: 16px; margin: 8px 0 0 0; opacity: 0.9; }
        .content { padding: 32px; }
        .voucher-info { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 24px; background-color: #f8fafc; border-radius: 8px; }
        .info-item { display: flex; flex-direction: column; }
        .info-label { font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 16px; color: #1f2937; font-weight: 600; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
        .items-table th { background-color: #1f2937; color: #ffffff; padding: 16px 12px; text-align: left; font-size: 14px; font-weight: 600; }
        .items-table th:first-child { text-align: center; width: 60px; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .total-section { background-color: #1f2937; color: #ffffff; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px; }
        .total-label { font-size: 16px; margin-bottom: 8px; opacity: 0.9; }
        .total-amount { font-size: 28px; font-weight: 700; margin: 0; }
        .terms { background-color: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
        .terms h3 { color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; }
        .terms ul { margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6; }
        .terms li { margin-bottom: 8px; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; }
        .barcode { text-align: center; margin: 24px 0; font-family: 'Courier New', monospace; font-size: 12px; color: #6b7280; }
        @media print { .voucher-container { border: none; box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="voucher-container">
        
        <!-- Header -->
        <div class="header">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMTAwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMUU0MEFGIi8+Cjx0ZXh0IHg9IjUwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1KPC90ZXh0Pgo8dGV4dCB4PSI1MCIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhcnJvczwvdGV4dD4KPC9zdmc+" alt="MJ Carros" class="logo">
          <h1 class="voucher-title">PURCHASE VOUCHER</h1>
          <p class="voucher-subtitle">Official Receipt & Warranty Document</p>
        </div>

        <!-- Content -->
        <div class="content">
          
          <!-- Voucher Information -->
          <div class="voucher-info">
            <div class="info-item">
              <span class="info-label">Voucher Number</span>
              <span class="info-value">${voucherNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Order ID</span>
              <span class="info-value">#${order._id || order.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Purchase Date</span>
              <span class="info-value">${orderDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Valid Until</span>
              <span class="info-value">${validUntil}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Customer Email</span>
              <span class="info-value">${order.userEmail || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value" style="color: #059669;">✅ PAID</span>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Model</th>
                <th>Year</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Total -->
          <div class="total-section">
            <p class="total-label">Total Amount</p>
            <p class="total-amount">€${totalAmount.toFixed(2)}</p>
          </div>

          <!-- Barcode -->
          <div class="barcode">
            <div style="font-size: 10px; margin-bottom: 8px;">VOUCHER ID</div>
            <div style="font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 2px;">${voucherNumber}</div>
            <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">Scan for verification</div>
          </div>

          <!-- Terms and Conditions -->
          <div class="terms">
            <h3>Terms & Conditions</h3>
            <ul>
              <li>This voucher serves as proof of purchase and warranty document</li>
              <li>Valid for 30 days from the purchase date</li>
              <li>Vehicle inspection and pickup must be arranged within 7 days</li>
              <li>All vehicles come with a 6-month warranty</li>
              <li>Original documentation will be provided upon vehicle delivery</li>
              <li>For support, contact: info@mjcarros.com or +351 123 456 789</li>
            </ul>
          </div>

        </div>

        <!-- Footer -->
        <div class="footer">
          <p style="margin: 0 0 8px 0;">© 2024 MJ Carros. All rights reserved.</p>
          <p style="margin: 0;">This is an official document. Please keep it safe.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}
