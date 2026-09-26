import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole } from "@/lib/roles";
import { withMongoId, withMongoIds } from "@/lib/serialize-api";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const rows = await prisma.dealer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { importRequests: true, products: true } },
    },
  });

  return NextResponse.json(
    rows.map((d) => ({
      ...withMongoId(d),
      importCount: d._count.importRequests,
      productCount: d._count.products,
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const companyName = String(body.companyName || "").trim();
  const contactName = String(body.contactName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = body.phone ? String(body.phone) : null;
  const country = String(body.country || "Germany");
  const password = body.password ? String(body.password) : null;
  const verified = !!body.verified;

  if (!companyName || !contactName || !email) {
    return NextResponse.json(
      { error: "companyName, contactName, and email are required" },
      { status: 400 }
    );
  }

  let userId: string | undefined;
  if (password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      userId = existing.id;
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.DEALER, name: contactName },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          email,
          name: contactName,
          password: await hashPassword(password),
          role: UserRole.DEALER,
        },
      });
      userId = user.id;
    }
  }

  const dealer = await prisma.dealer.create({
    data: {
      companyName,
      contactName,
      email,
      phone,
      country,
      verified,
      userId,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json(withMongoId(dealer), { status: 201 });
}
