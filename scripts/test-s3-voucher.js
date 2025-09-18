// Test script for S3 voucher upload
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnvFile();

// Mock order data for testing
const mockOrder = {
  id: 'TEST-ORDER-S3-123',
  createdAt: new Date(),
  userEmail: 'test@mjcarros.com',
  phone: '+351 123 456 789',
  address: '123 Test Street, Lisbon, Portugal',
  orderItems: [
    {
      productName: 'BMW X5 2023',
      product: {
        modelName: 'X5',
        year: '2023',
        color: 'Black',
        mileage: '15000',
        fuelType: 'Petrol',
        price: 45000,
        imageURLs: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400']
      }
    },
    {
      productName: 'Mercedes C-Class 2022',
      product: {
        modelName: 'C-Class',
        year: '2022',
        color: 'White',
        mileage: '25000',
        fuelType: 'Diesel',
        price: 38000,
        imageURLs: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400']
      }
    }
  ]
};

// Voucher HTML generator
function generateVoucherHTML(order) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalAmount = order.orderItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0);
  }, 0);

  const voucherNumber = `VCH-${order.id}-${Date.now()}`;
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
        <div class="header">
          <div style="height: 50px; width: 100px; background-color: white; border-radius: 8px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: #1e40af; font-size: 18px; font-weight: bold;">MJ CARROS</span>
          </div>
          <h1 class="voucher-title">PURCHASE VOUCHER</h1>
          <p class="voucher-subtitle">Official Receipt & Warranty Document</p>
        </div>
        <div class="content">
          <div class="voucher-info">
            <div class="info-item"><span class="info-label">Voucher Number</span><span class="info-value">${voucherNumber}</span></div>
            <div class="info-item"><span class="info-label">Order ID</span><span class="info-value">#${order.id}</span></div>
            <div class="info-item"><span class="info-label">Purchase Date</span><span class="info-value">${orderDate}</span></div>
            <div class="info-item"><span class="info-label">Valid Until</span><span class="info-value">${validUntil}</span></div>
            <div class="info-item"><span class="info-label">Customer Email</span><span class="info-value">${order.userEmail || 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Status</span><span class="info-value" style="color: #059669;">✅ PAID</span></div>
          </div>
          <table class="items-table">
            <thead>
              <tr><th>#</th><th>Vehicle</th><th>Model</th><th>Year</th><th>Price</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total-section">
            <p class="total-label">Total Amount</p>
            <p class="total-amount">€${totalAmount.toFixed(2)}</p>
          </div>
          <div class="barcode">
            <div style="font-size: 10px; margin-bottom: 8px;">VOUCHER ID</div>
            <div style="font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 2px;">${voucherNumber}</div>
            <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">Scan for verification</div>
          </div>
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
        <div class="footer">
          <p style="margin: 0 0 8px 0;">© 2024 MJ Carros. All rights reserved.</p>
          <p style="margin: 0;">This is an official document. Please keep it safe.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function testS3VoucherUpload() {
  console.log('☁️ Testing S3 voucher upload...');
  
  // Check S3 configuration
  const hasS3Config = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_ORDERS_BUCKET);
  console.log('S3 config available:', hasS3Config);
  
  if (!hasS3Config) {
    console.error('❌ S3 configuration is missing. Please set:');
    console.log('   AWS_ACCESS_KEY_ID=your-access-key');
    console.log('   AWS_SECRET_ACCESS_KEY=your-secret-key');
    console.log('   S3_ORDERS_BUCKET=your-bucket-name');
    console.log('   AWS_DEFAULT_REGION=your-region');
    return;
  }

  console.log('📦 Bucket:', process.env.S3_ORDERS_BUCKET);
  console.log('🌍 Region:', process.env.AWS_DEFAULT_REGION);

  try {
    // Import AWS SDK
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Generate voucher HTML
    const voucherHTML = generateVoucherHTML(mockOrder);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const voucherFileName = `vouchers/${mockOrder.id}/voucher-${timestamp}.html`;
    const voucherNumber = `VCH-${mockOrder.id}-${Date.now()}`;

    // Upload voucher to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_ORDERS_BUCKET,
      Key: voucherFileName,
      Body: voucherHTML,
      ContentType: 'text/html',
      Metadata: {
        orderId: mockOrder.id,
        customerEmail: mockOrder.userEmail || '',
        voucherNumber: voucherNumber,
        orderDate: mockOrder.createdAt.toISOString(),
        documentType: 'voucher'
      }
    });

    console.log('📤 Uploading voucher to S3...');
    await s3Client.send(command);

    const voucherUrl = `https://${process.env.S3_ORDERS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION || 'us-east-1'}.amazonaws.com/${voucherFileName}`;

    console.log('✅ Voucher uploaded to S3 successfully!');
    console.log(`📄 Voucher Number: ${voucherNumber}`);
    console.log(`📦 Order ID: ${mockOrder.id}`);
    console.log(`👤 Customer: ${mockOrder.userEmail}`);
    console.log(`🔗 Voucher URL: ${voucherUrl}`);

  } catch (error) {
    console.error('❌ S3 voucher upload failed:', error.message);
    if (error.name === 'NoSuchBucket') {
      console.error('💡 The S3 bucket does not exist. Please create it first.');
    } else if (error.name === 'AccessDenied') {
      console.error('💡 Access denied. Please check your AWS credentials and bucket permissions.');
    }
  }
}

testS3VoucherUpload();
