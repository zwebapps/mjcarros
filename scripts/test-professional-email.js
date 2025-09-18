// Test script for professional email with voucher
const nodemailer = require('nodemailer');
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

const host = process.env.EMAIL_HOST || '';
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';
const fromAddress = process.env.EMAIL_FROM || 'MJ Carros <no-reply@mjcarros.com>';

const hasEmailConfig = !!(host && user && pass);

const transporter = hasEmailConfig
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

// Mock order data for testing
const mockOrder = {
  id: 'TEST-ORDER-123',
  createdAt: new Date(),
  userEmail: user, // Send to yourself for testing
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

// Professional email template
function generateTestEmail(order, paymentMethod) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalAmount = order.orderItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0);
  }, 0);

  const itemsHtml = order.orderItems.map((item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px; text-align: left;">
        <div style="display: flex; align-items: center;">
          ${item.product?.imageURLs?.[0] ? `
            <img src="${item.product.imageURLs[0]}" alt="${item.productName}" 
                 style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">
          ` : ''}
          <div>
            <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${item.productName}</h4>
            ${item.product?.modelName ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Model: ${item.product.modelName}</p>` : ''}
            ${item.product?.year ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Year: ${item.product.year}</p>` : ''}
            ${item.product?.color ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Color: ${item.product.color}</p>` : ''}
            ${item.product?.mileage ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Mileage: ${item.product.mileage} km</p>` : ''}
            ${item.product?.fuelType ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Fuel: ${item.product.fuelType}</p>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 16px; text-align: right; color: #1f2937; font-weight: 600; font-size: 16px;">
        €${item.product?.price?.toFixed(2) || '0.00'}
      </td>
    </tr>
  `).join('');

  const subject = `🎉 Order Confirmed - ${order.id} | MJ Carros`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - MJ Carros</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
          <div style="height: 60px; width: 120px; background-color: white; border-radius: 8px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: #1e40af; font-size: 24px; font-weight: bold;">MJ CARROS</span>
          </div>
          <h1 style="color: #ffffff; margin: 16px 0 0 0; font-size: 28px; font-weight: 700;">
            Order Confirmed! 🎉
          </h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">
          
          <!-- Order Summary -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              Order Summary
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Order ID</p>
                <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">#${order.id}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Order Date</p>
                <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">${orderDate}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Payment Method</p>
                <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">${paymentMethod}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Status</p>
                <p style="margin: 4px 0 0 0; color: #059669; font-size: 16px; font-weight: 600;">✅ Paid</p>
              </div>
            </div>
          </div>

          <!-- Customer Information -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Customer Information
            </h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Email: <span style="color: #1f2937; font-weight: 500;">${order.userEmail}</span></p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Phone: <span style="color: #1f2937; font-weight: 500;">${order.phone}</span></p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Address: <span style="color: #1f2937; font-weight: 500;">${order.address}</span></p>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 24px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Your Vehicles
            </h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 16px; text-align: left; color: #374151; font-size: 14px; font-weight: 600;">Vehicle Details</th>
                  <th style="padding: 16px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div style="background-color: #1f2937; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
              Total Amount: €${totalAmount.toFixed(2)}
            </p>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #0c4a6e; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
              What's Next?
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
              <li style="margin-bottom: 8px;">Our team will review your order within 24 hours</li>
              <li style="margin-bottom: 8px;">We'll contact you to arrange vehicle inspection and pickup</li>
              <li style="margin-bottom: 8px;">All necessary documentation will be prepared</li>
              <li>You'll receive updates via email throughout the process</li>
            </ul>
          </div>

          <!-- Contact Information -->
          <div style="text-align: center; padding: 24px; background-color: #f8fafc; border-radius: 12px;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Need Help?
            </h3>
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Our customer service team is here to assist you with any questions.
            </p>
            <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;">
              <a href="mailto:info@mjcarros.com" 
                 style="color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 14px;">
                📧 info@mjcarros.com
              </a>
              <a href="tel:+351123456789" 
                 style="color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 14px;">
                📞 +351 123 456 789
              </a>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 24px; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © 2024 MJ Carros. All rights reserved.
          </p>
          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
            Thank you for choosing MJ Carros for your automotive needs!
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// Generate voucher HTML
function generateTestVoucher(order) {
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

async function testProfessionalEmail() {
  console.log('📧 Testing professional email with voucher...');
  console.log('Email config available:', hasEmailConfig);
  
  if (!hasEmailConfig) {
    console.error('❌ Email configuration is missing. Please set:');
    console.log('   EMAIL_HOST=smtp.gmail.com');
    console.log('   EMAIL_PORT=587');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-app-password');
    console.log('   EMAIL_FROM=MJ Carros <no-reply@mjcarros.com>');
    return;
  }

  const testTo = user;
  const { subject, html } = generateTestEmail(mockOrder, 'Stripe');
  const voucherHTML = generateTestVoucher(mockOrder);
  
  // Create voucher attachment
  const attachments = [
    {
      filename: `voucher-${mockOrder.id}.html`,
      content: voucherHTML,
      contentType: 'text/html'
    }
  ];

  try {
    console.log(`📤 Sending professional email with voucher to ${testTo}...`);
    await transporter.sendMail({ 
      from: fromAddress, 
      to: testTo, 
      subject, 
      html,
      attachments
    });
    console.log('✅ Professional email with voucher sent successfully!');
    console.log('📎 Voucher attached as HTML file');
  } catch (error) {
    console.error('❌ Failed to send professional email:', error.message);
    console.error('Please check your email configuration.');
  }
}

testProfessionalEmail();
