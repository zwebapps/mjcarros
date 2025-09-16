import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";

const baseUrl = (process.env.PAYPAL_ENV || 'sandbox') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const auth = Buffer.from(`${client}:${secret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get PayPal access token');
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
      return NextResponse.json({ error: 'Missing headers or webhook id' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    });

    const verifyJson = await verifyRes.json();
    if (verifyJson.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event_type as string | undefined;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'CHECKOUT.ORDER.COMPLETED') {
      const payerEmail: string | undefined = event?.resource?.payer?.email_address || event?.resource?.payment_source?.paypal?.email_address;
      const amount = event?.resource?.amount?.value || event?.resource?.purchase_units?.[0]?.amount?.value;
      const currency = event?.resource?.amount?.currency_code || event?.resource?.purchase_units?.[0]?.amount?.currency_code;
      
      console.log(`💳 PayPal payment completed: ${eventType}`);
      console.log(`👤 Payer Email: ${payerEmail}`);
      console.log(`💰 Amount: ${amount} ${currency}`);
      
      try {
        if (payerEmail) {
          if (!db) {
            return NextResponse.json({ error: 'Database not found' }, { status: 500 });
          }
          const order = await db.order.findFirst({ 
            where: { userEmail: payerEmail, isPaid: false  }, 
            orderBy: { createdAt: 'desc' },
            include: {
              orderItems: { 
                include: { 
                  product: {
                    select: {
                      id: true,
                      title: true,
                      price: true,
                      modelName: true,
                      year: true,
                      color: true,
                      mileage: true,
                      fuelType: true,
                      imageURLs: true
                    }
                  }
                } 
              }
            }
          });
          
          if (order) {
            const updatedOrder = await db.order.update({ 
              where: { _id: new ObjectId(order._id || order.id) }, 
              data: { isPaid: true },
              include: {
                orderItems: { 
                  include: { 
                    product: {
                      select: {
                        id: true,
                        title: true,
                        price: true,
                        modelName: true,
                        year: true,
                        color: true,
                        mileage: true,
                        fuelType: true,
                        imageURLs: true
                      }
                    }
                  } 
                }
              }
            });

            // Log payment completion
            console.log(`✅ Order ${order._id || order.id} payment confirmed via PayPal`);
            console.log(`👤 Customer: ${(updatedOrder as any).userEmail}`);
            console.log(`💰 Amount: $${amount} ${currency}`);
            console.log(`💳 Payment Method: PayPal`);

            // Backup updated order to S3
            await backupOrderToS3(updatedOrder);

            // Send payment confirmation email
            const subject = `Payment Confirmed - Order ${order._id || order.id}`;
            const html = `
              <div>
                <h2>🎉 Payment Confirmed!</h2>
                <p>Your payment has been successfully processed.</p>
                <p><strong>Order ID:</strong> ${order._id || order.id}</p>
                <p><strong>Payment Method:</strong> PayPal</p>
                <p><strong>Amount:</strong> $${amount} ${currency}</p>
                <p>We will process your order and contact you shortly.</p>
              </div>
            `;
            
            try {
              await sendMail((updatedOrder as any).userEmail, subject, html);
              console.log(`📧 Payment confirmation email sent to: ${(updatedOrder as any).userEmail}`);
            } catch (emailError) {
              console.warn('Failed to send payment confirmation email:', emailError);
            }
          } else {
            console.log(`⚠️ No unpaid order found for PayPal payer: ${payerEmail}`);
          }
        }
      } catch (e) {
        console.error("❌ PayPal webhook error:", e);
        return new NextResponse("Webhook processing failed", { status: 500 });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[PAYPAL_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
