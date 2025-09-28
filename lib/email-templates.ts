import { getDisplayOrderNumber } from "./order-number-generator";

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
    product?: {
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
      imageURLs: string[];
    };
  }[];
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export function generateContactFormEmail(contactData: ContactFormData): { subject: string; html: string } {
  const submissionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = `New Contact Form Submission: ${contactData.subject || 'General Inquiry'} - MJ Carros`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission - MJ Carros</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f1f5f9; }
        .container { max-width: 1000px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; text-align: center; position: relative; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>') repeat; }
        .logo { margin-bottom: 12px; position: relative; z-index: 1; }
        .logo-emoji { font-size: 48px; margin-right: 15px; display: inline-block; vertical-align: middle; }
        .logo-text { font-size: 36px; font-weight: bold; letter-spacing: 1px; display: inline-block; vertical-align: middle; }
        .header-subtitle { font-size: 18px; opacity: 0.95; position: relative; z-index: 1; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 20px; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
        .customer-info { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; border: 1px solid #f59e0b; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2); }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 700; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { color: #1f2937; font-size: 16px; font-weight: 500; }
        .subject-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 8px; border-left: 5px solid #3b82f6; }
        .subject-text { font-size: 18px; font-weight: 600; color: #1e40af; }
        .message-container { background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .message-content { white-space: pre-wrap; line-height: 1.8; color: #374151; font-size: 15px; }
        .next-steps { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 10px; border: 1px solid #10b981; }
        .next-steps ul { margin: 0; padding-left: 20px; }
        .next-steps li { margin-bottom: 8px; color: #065f46; font-weight: 500; }
        .footer { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 30px; text-align: center; }
        .footer-text { font-size: 14px; opacity: 0.9; line-height: 1.8; }
        .priority-badge { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Professional Header -->
        <div class="header">
          <div class="logo">
            <span class="logo-emoji">🏎️</span>
            <span class="logo-text">MJ CARROS</span>
          </div>
          <div class="header-subtitle">Premium Automotive Excellence</div>
        </div>

        <!-- Main Content -->
        <div class="content">
          <!-- Alert Section -->
          <div class="section">
            <div class="section-title">
              <span>📞 Customer Inquiry</span>
              <span class="priority-badge">New Inquiry</span>
            </div>
            <p style="color: #6b7280; font-size: 16px;">You have received a new customer inquiry through your website. Please review the details below and respond promptly to maintain excellent customer service.</p>
          </div>

          <!-- Customer Information Table -->
          <div class="section">
            <div class="section-title">👤 Customer Information</div>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                  <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Field</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Information</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 15px; font-weight: 600; color: #374151; background: #f8f9fa;">Full Name</td>
                  <td style="padding: 15px; color: #1f2937; font-size: 16px;">${contactData.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 15px; font-weight: 600; color: #374151; background: #f8f9fa;">Email Address</td>
                  <td style="padding: 15px; color: #1f2937; font-size: 16px;">${contactData.email}</td>
                </tr>
                ${contactData.phone ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 15px; font-weight: 600; color: #374151; background: #f8f9fa;">Phone Number</td>
                  <td style="padding: 15px; color: #1f2937; font-size: 16px;">${contactData.phone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 15px; font-weight: 600; color: #374151; background: #f8f9fa;">Submission Date</td>
                  <td style="padding: 15px; color: #1f2937; font-size: 16px;">${submissionDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Subject Section -->
          ${contactData.subject ? `
          <div class="section">
            <div class="section-title">📋 Inquiry Subject</div>
            <div class="subject-box">
              <div class="subject-text">${contactData.subject}</div>
            </div>
          </div>
          ` : ''}

          <!-- Message Content -->
          <div class="section">
            <div class="section-title">💬 Customer Message</div>
            <div class="message-container">
              <div class="message-content">${contactData.message}</div>
            </div>
          </div>

          <!-- Action Items -->
          <div class="section">
            <div class="section-title">🎯 Recommended Actions</div>
            <div class="next-steps">
              <ul>
                <li><strong>Priority Response:</strong> Reply within 24 hours for optimal customer experience</li>
                <li><strong>Primary Contact:</strong> Respond directly to <strong>${contactData.email}</strong></li>
                ${contactData.phone ? `<li><strong>Phone Follow-up:</strong> Consider calling <strong>${contactData.phone}</strong> for immediate assistance</li>` : ''}
                <li><strong>Documentation:</strong> Log this inquiry in your CRM system for tracking</li>
                <li><strong>Follow-up:</strong> Schedule appropriate follow-up based on inquiry type</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Professional Footer -->
        <div class="footer">
          <div class="footer-text">
            <strong>MJ Carros</strong> - Premium Automotive Excellence<br>
            🌐 www.mjcarros.pt | 📧 Professional Contact Management System<br>
            This email was automatically generated from your website contact form at ${submissionDate}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function generateOrderConfirmationEmail(order: OrderWithItems, paymentMethod: 'Stripe' | 'PayPal'): { subject: string; html: string } {
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

  const subject = `Order Confirmation ${getDisplayOrderNumber(order)} - MJ Carros`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Order Confirmation ${getDisplayOrderNumber(order)} - MJ Carros</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
            font-size: 12px;
          }

          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #cccccc;
            padding: 20px;
          }

          .header {
            background-color: #f59e0b;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #d97706;
          }

          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
          }

          .company-tagline {
            font-size: 12px;
            margin: 0;
            opacity: 0.9;
          }

          .content {
            padding: 20px;
          }

          .order-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 20px 0;
            text-align: center;
            color: #000000;
            text-transform: uppercase;
          }

          .greeting {
            margin-bottom: 20px;
            font-size: 12px;
            color: #000000;
            line-height: 1.4;
          }

          .pdf-notice {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            border-radius: 8px;
          }

          .pdf-notice h4 {
            color: #d97706;
            margin: 0 0 5px 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
          }

          .pdf-notice p {
            margin: 0;
            color: #000000;
            font-size: 12px;
          }

          .order-details {
            background-color: #f9f9f9;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #dddddd;
            border-radius: 8px;
          }

          .order-details h3 {
            color: #f59e0b;
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #f59e0b;
            padding-bottom: 5px;
          }

          .info-grid {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 15px;
          }

          .info-row {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
          }

          .info-label {
            font-size: 11px;
            color: #666666;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
          }

          .info-value {
            font-size: 13px;
            color: #000000;
            font-weight: normal;
          }

          .status-paid {
            color: #006600;
            font-weight: bold;
            text-transform: uppercase;
          }

          .vehicle-summary {
            margin-bottom: 20px;
          }

          .vehicle-summary h3 {
            color: #f59e0b;
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #f59e0b;
            padding-bottom: 5px;
          }

          .vehicle-card {
            background-color: #ffffff;
            padding: 15px;
            border: 1px solid #dddddd;
            border-left: 4px solid #f59e0b;
            margin-bottom: 10px;
          }

          .vehicle-name {
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            margin: 0 0 10px 0;
            text-transform: uppercase;
          }

          .vehicle-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
            font-size: 12px;
            color: #333333;
          }

          .vehicle-details span {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px solid #eeeeee;
          }

          .vehicle-details .value {
            color: #000000;
            font-weight: bold;
          }

          .total-section {
            background-color: #ffffff;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #dddddd;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
            padding: 3px 0;
            border-bottom: 1px solid #eeeeee;
          }

          .total-label {
            color: #666666;
            font-weight: bold;
          }

          .total-value {
            color: #000000;
            font-weight: bold;
          }

          .grand-total {
            border-top: 2px solid #f59e0b;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            background-color: #f59e0b;
            color: #ffffff;
            padding: 10px;
            text-transform: uppercase;
            text-align: center;
          }

          .payment-info {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
          }

          .payment-info h3 {
            color: #f59e0b;
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #f59e0b;
            padding-bottom: 5px;
          }

          .payment-info p {
            margin: 5px 0;
            font-size: 12px;
            color: #000000;
          }

          .closing {
            margin: 20px 0;
            font-size: 12px;
            color: #000000;
            line-height: 1.4;
            background-color: #f9f9f9;
            padding: 15px;
            border: 1px solid #dddddd;
          }

          .footer {
            background-color: #f59e0b;
            color: #ffffff;
            padding: 15px 20px;
            text-align: center;
            border-top: 3px solid #d97706;
          }

          .footer p {
            margin: 2px 0;
            color: #ffffff;
            font-size: 10px;
            opacity: 0.9;
          }

          .footer .company-name {
            font-weight: bold;
            color: #ffffff;
            text-transform: uppercase;
          }

          @media (max-width: 600px) {
            .email-container {
              margin: 0;
              border: none;
              padding: 10px;
            }
            .header, .content, .footer {
              padding: 10px;
            }
            .info-grid {
              display: table;
              width: 100%;
              border-collapse: separate;
              border-spacing: 10px;
            }
            .info-row {
              display: table-cell;
              width: 50%;
              vertical-align: top;
              padding: 8px;
            }
            .vehicle-details {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          
          <!-- Header -->
          <div class="header">
            <img src="cid:mjcarros-logo" alt="MJ Carros Logo" style="height: 60px; margin-bottom: 10px;" />
            <h1 class="company-name">MJ Carros</h1>
            <p class="company-tagline">Professional Automotive Solutions</p>
          </div>

          <!-- Content -->
          <div class="content">
            <h2 class="order-title">Order Confirmation ${getDisplayOrderNumber(order)}</h2>
            
            <div class="greeting">
              <p>Dear Valued Customer,</p>
              <p>Thank you for your purchase! We're excited to confirm your order and provide you with all the details.</p>
            </div>

            <div class="pdf-notice">
              <h4>📄 PDF Voucher Attached</h4>
              <p>Your detailed purchase voucher is attached to this email for your records.</p>
            </div>

            <div class="order-details">
              <h3>Order Information</h3>
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Order Number</span>
                  <span class="info-value">${getDisplayOrderNumber(order)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Date</span>
                  <span class="info-value">${orderDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Customer Email</span>
                  <span class="info-value">${order.userEmail || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Status</span>
                  <span class="info-value status-paid">PAID</span>
                </div>
              </div>
            </div>

            <div class="vehicle-summary">
              <h3>Vehicle Details</h3>
              ${order.orderItems.map((item, index) => `
                <div class="vehicle-card">
                  <h4 class="vehicle-name">${item.productName}</h4>
                  <div class="vehicle-details">
                    <span>
                      <span>Make:</span>
                      <span class="value">${item.product?.category || 'N/A'}</span>
                    </span>
                    <span>
                      <span>Model:</span>
                      <span class="value">${item.product?.modelName || 'N/A'}</span>
                    </span>
                    <span>
                      <span>Year:</span>
                      <span class="value">${item.product?.year || 'N/A'}</span>
                    </span>
                    <span>
                      <span>Mileage:</span>
                      <span class="value">${item.product?.mileage ? item.product.mileage.toLocaleString() + ' km' : 'N/A'}</span>
                    </span>
                    <span>
                      <span>Fuel Type:</span>
                      <span class="value">${item.product?.fuelType || 'N/A'}</span>
                    </span>
                    <span>
                      <span>Color:</span>
                      <span class="value">${item.product?.color || 'N/A'}</span>
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="total-section">
              <h3>Payment Summary</h3>
              <div class="total-row">
                <span class="total-label">Vehicle Price:</span>
                <span class="total-value">€${totalAmount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Tax:</span>
                <span class="total-value">€0.00</span>
              </div>
              <div class="total-row">
                <span class="total-label">Dealer Fee:</span>
                <span class="total-value">€0.00</span>
              </div>
              <div class="grand-total">
                <span>Total Paid: €${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-info">
              <h3>Payment Information</h3>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Transaction ID:</strong> ${order.id}</p>
              <p><strong>Payment Status:</strong> <span style="color: #006600; font-weight: bold;">COMPLETED</span></p>
            </div>

            <div class="closing">
              <p><strong>Next Steps:</strong></p>
              <p>• Your order has been confirmed and payment processed successfully</p>
              <p>• Please keep this email and the attached PDF voucher for your records</p>
              <p>• Our team will contact you shortly to arrange vehicle delivery</p>
              <p>• If you have any questions, please contact us at info@mjcarros.com</p>
              <br>
              <p>Thank you for choosing MJ Carros for your automotive needs!</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><span class="company-name">MJ Carros</span> - Professional Automotive Solutions</p>
            <p>Email: info@mjcarros.com | Phone: +1 (555) 000-0000</p>
            <p>© 2024 MJ Carros. All rights reserved.</p>
          </div>

        </div>
      </body>
    </html>
  `;

  return { subject, html };
}