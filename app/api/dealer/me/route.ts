import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isDealerRole } from "@/lib/roles";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isDealerRole(auth.role)) {
    return NextResponse.json({ error: "Dealer access required" }, { status: 403 });
  }

  const dealer = await prisma.dealer.findFirst({
    where: { userId: auth.userId },
    include: {
      _count: { select: { importRequests: true, products: true } },
    },
  });

  if (!dealer) {
    return NextResponse.json({ error: "Dealer profile not linked" }, { status: 404 });
  }

  return NextResponse.json({
    ...withMongoId(dealer),
    importCount: dealer._count.importRequests,
    productCount: dealer._count.products,
  });
}
