import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isDealerRole } from "@/lib/roles";
import { withMongoIds } from "@/lib/serialize-api";
import { importInclude } from "@/lib/import-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isDealerRole(auth.role)) {
    return NextResponse.json({ error: "Dealer access required" }, { status: 403 });
  }

  const dealer = await prisma.dealer.findFirst({ where: { userId: auth.userId } });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const rows = await prisma.importRequest.findMany({
    where: { assignedDealerId: dealer.id },
    orderBy: { updatedAt: "desc" },
    include: importInclude,
  });

  return NextResponse.json(withMongoIds(rows));
}
