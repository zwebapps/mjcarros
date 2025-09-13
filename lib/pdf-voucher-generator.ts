import puppeteer from 'puppeteer';
import { Order, OrderItem, Product } from "@prisma/client";
import { generateVoucherHTML } from './voucher-generator';

export interface OrderWithItems extends Order {
  orderItems: (OrderItem & {
    product: Product;
  })[];
}

export async function generatePDFVoucher(order: OrderWithItems): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
  });

  try {
    const page = await browser.newPage();
    
    // Disable image loading to avoid large image caching issues
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Generate HTML content for the voucher using the new invoice template
    const htmlContent = generateVoucherHTML(order);
    
    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

