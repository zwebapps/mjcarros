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
            <img src="https://mjcarros.com/logo.png" alt="MJ Carros Logo" style="height: 60px; margin-bottom: 10px;" />
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