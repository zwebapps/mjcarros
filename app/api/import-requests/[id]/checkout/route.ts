import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole } from "@/lib/roles";

export const runtime = "nodejs";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" })
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.json();
  const amount = Number(body.amount);
  if (!amount || amount < 1) {
    return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
  }

  const importRow = await prisma.importRequest.findUnique({
    where: { id: params.id },
  });
  if (!importRow) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  const origin =
    process.env.STRIPE_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: importRow.email,
    metadata: {
      type: "import_deposit",
      importRequestId: importRow.id,
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Import deposit — ${importRow.fullName}`,
            description: `${importRow.brand ?? ""} ${importRow.model ?? ""}`.trim(),
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/import/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/admin/imports`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
