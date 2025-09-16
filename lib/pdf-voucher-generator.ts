import puppeteer from 'puppeteer';
import { generateVoucherHTML } from './voucher-generator';

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

export async function generatePDFVoucher(order: OrderWithItems): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
  });

  try {
    const page = await browser.newPage();
    
    // Allow car images but block other images to avoid caching issues
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'image') {
        // Allow car images from the product imageURLs
        const url = req.url();
        const isCarImage = order.orderItems.some(item => 
          item.product?.imageURLs?.some(imgUrl => url.includes(imgUrl.split('/').pop() || ''))
        );
        
        if (isCarImage) {
          req.continue();
        } else {
          req.abort();
        }
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

