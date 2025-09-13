import { Order, OrderItem, Product } from "@prisma/client";
import { getDisplayOrderNumber } from "./order-number-generator";

export interface OrderWithItems extends Order {
  orderItems: (OrderItem & {
    product: Product;
  })[];
}

export function generateVoucherHTML(order: OrderWithItems): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalAmount = order.orderItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  const voucherNumber = `VCH-${order.id}-${Date.now()}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Vehicle Purchase Order — ${order.id}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
            font-size: 12px;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #cccccc;
            padding: 20px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f59e0b;
          }

          .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #f59e0b;
            margin: 0;
            text-transform: uppercase;
          }

          .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #333333;
          }

          .company-address {
            text-align: right;
            font-size: 12px;
            color: #000000;
          }

          .company-address .company-name {
            font-weight: bold;
            font-size: 16px;
            color: #f59e0b;
            margin-bottom: 5px;
            text-transform: uppercase;
          }

          .company-address .address {
            color: #333333;
            margin: 2px 0;
            line-height: 1.3;
          }

          .sections {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 20px;
            margin-bottom: 30px;
          }

          .section {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #dddddd;
            border-radius: 8px;
          }

          .section h2 {
            font-size: 14px;
            font-weight: bold;
            color: #f59e0b;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            border-bottom: 1px solid #f59e0b;
            padding-bottom: 5px;
            letter-spacing: 0.5px;
          }

          .section p {
            margin: 8px 0;
            font-size: 13px;
            color: #000000;
            font-weight: normal;
          }

          .section .text-sm {
            font-size: 10px;
            color: #666666;
          }

          .vehicle-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 30px;
          }

          .vehicle-detail {
            background-color: #ffffff;
            padding: 10px;
            border: 1px solid #dddddd;
            text-align: center;
          }

          .vehicle-detail h3 {
            font-size: 10px;
            color: #666666;
            text-transform: uppercase;
            margin: 0 0 5px 0;
            font-weight: bold;
          }

          .vehicle-detail p {
            font-weight: bold;
            color: #000000;
            margin: 0;
            font-size: 12px;
          }

          .pricing-section {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dddddd;
            margin-bottom: 20px;
            border-radius: 8px;
          }

          .pricing-section h2 {
            font-size: 16px;
            font-weight: bold;
            color: #f59e0b;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            border-bottom: 2px solid #f59e0b;
            padding-bottom: 5px;
          }

          .pricing-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 10px;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
          }

          .pricing-table thead {
            background-color: #f59e0b;
            color: #ffffff;
          }

          .pricing-table th {
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }

          .pricing-table th:last-child {
            text-align: right;
          }

          .pricing-table td {
            padding: 8px;
            border-bottom: 1px solid #dddddd;
            color: #000000;
          }

          .pricing-table td:last-child {
            text-align: right;
            font-weight: bold;
            color: #000000;
          }

          .pricing-table tfoot tr:last-child {
            border-top: 2px solid #f59e0b;
            font-weight: bold;
            color: #000000;
            background-color: #f59e0b;
            color: #ffffff;
          }

          .pricing-table tfoot tr:last-child td {
            border-bottom: none;
            padding: 10px 8px;
            font-size: 14px;
          }

          .signatures {
            display: flex;
            gap: 30px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dddddd;
          }

          .signature {
            flex: 1;
            background-color: #f9f9f9;
            padding: 15px;
            border: 1px solid #dddddd;
          }

          .signature h3 {
            font-size: 12px;
            font-weight: bold;
            color: #f59e0b;
            margin: 0 0 10px 0;
            text-transform: uppercase;
          }

          .signature-box {
            min-height: 50px;
            border-bottom: 2px solid #f59e0b;
            margin-bottom: 10px;
            background-color: #ffffff;
          }

          .signature p {
            font-size: 10px;
            color: #666666;
            margin: 5px 0 0 0;
          }

          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #dddddd;
            font-size: 10px;
            color: #666666;
            text-align: center;
            background-color: #f9f9f9;
            padding: 10px;
          }

          @media print {
            .container {
              border: none;
              padding: 10px;
            }
            body {
              background-color: white;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <div>
              <img src="https://mjcarros.com/logo.png" alt="MJ Carros Logo" style="height: 50px; margin-bottom: 10px;" />
          <h1>VEHICLE PURCHASE ORDER</h1>
          <p>Order # <span style="font-weight: bold;">${getDisplayOrderNumber(order)}</span></p>
            </div>
            <address class="company-address">
              <div class="company-name">MJ CARROS</div>
              <div class="address">178 Expensive Avenue<br>Philadelphia, 20100 PH</div>
              <div style="margin-top: 5px;">+1 (555) 000-0000 • info@mjcarros.com</div>
              <div style="margin-top: 5px;">www.mjcarros.com</div>
            </address>
          </header>

          <section class="sections">
            <div class="section">
              <h2>Purchaser</h2>
              <p>${order.userEmail || 'Customer'}</p>
              <p class="text-sm">Phone: ${order.phone || 'N/A'}</p>
              <p class="text-sm">Address: ${order.address || 'N/A'}</p>
            </div>
            <div class="section">
              <h2>Vehicle & Delivery</h2>
              <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span class="text-sm">Order Number</span>
                  <span style="font-weight: bold;">${getDisplayOrderNumber(order)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span class="text-sm">Delivery Date</span>
                  <span style="font-weight: bold;">${orderDate}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="vehicle-details">
            ${order.orderItems.map((item, index) => `
              <div class="vehicle-detail">
                <h3>Make</h3>
                <p>${item.product?.category || 'N/A'}</p>
              </div>
              <div class="vehicle-detail">
                <h3>Model</h3>
                <p>${item.product?.modelName || item.productName || 'N/A'}</p>
              </div>
              <div class="vehicle-detail">
                <h3>Type / Year</h3>
                <p>${item.product?.condition || 'Used'} / ${item.product?.year || 'N/A'}</p>
              </div>
              <div class="vehicle-detail">
                <h3>Mileage</h3>
                <p>${item.product?.mileage ? item.product.mileage.toLocaleString() : 'N/A'}</p>
              </div>
              <div class="vehicle-detail">
                <h3>Fuel</h3>
                <p>${item.product?.fuelType || 'N/A'}</p>
              </div>
              <div class="vehicle-detail">
                <h3>Colour</h3>
                <p>${item.product?.color || 'N/A'}</p>
              </div>
            `).join('')}
          </section>

          <section class="pricing-section">
            <h2>Vehicle Price</h2>
            <table class="pricing-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.orderItems.map((item, index) => `
                  <tr>
                    <td>Vehicle and accessories — ${item.productName}</td>
                    <td>€${item.product?.price?.toFixed(2) || '0.00'}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td style="text-align: right; color: #666666;">Tax:</td>
                  <td>€0.00</td>
                </tr>
                <tr>
                  <td style="text-align: right; color: #666666;">Dealer Fee:</td>
                  <td>€0.00</td>
                </tr>
                <tr>
                  <td style="text-align: right;">Total Sale Price:</td>
                  <td>€${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="text-align: right; color: #666666;">Total Down Payment:</td>
                  <td>€0.00</td>
                </tr>
                <tr>
                  <td style="text-align: right;">Balance Due:</td>
                  <td>€${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section class="signatures">
            <div class="signature">
              <h3>Purchaser Signature</h3>
              <div class="signature-box"></div>
              <p>Name: ${order.userEmail || 'Customer'}</p>
            </div>
            <div class="signature">
              <h3>Authorized Person Signature</h3>
              <div class="signature-box"></div>
              <p>Date</p>
            </div>
          </section>

          <footer class="footer">
            <p>This invoice serves as proof of purchase and warranty document. © 2024 MJ Carros. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  `;
}