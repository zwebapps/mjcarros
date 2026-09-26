import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole } from "@/lib/roles";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const dealer = await prisma.dealer.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      importRequests: { take: 20, orderBy: { createdAt: "desc" } },
      products: { take: 20, orderBy: { updatedAt: "desc" } },
    },
  });

  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  return NextResponse.json(withMongoId(dealer));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const dealer = await prisma.dealer.update({
    where: { id: params.id },
    data: {
      companyName: body.companyName ? String(body.companyName) : undefined,
      contactName: body.contactName ? String(body.contactName) : undefined,
      phone: body.phone !== undefined ? String(body.phone) : undefined,
      country: body.country ? String(body.country) : undefined,
      verified: body.verified !== undefined ? !!body.verified : undefined,
    },
  });

  return NextResponse.json(withMongoId(dealer));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await prisma.dealer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
