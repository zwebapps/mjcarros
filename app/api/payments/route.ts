import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole } from "@/lib/roles";
import { withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // If Prisma Client wasn't regenerated after schema changes,
  // these delegates won't exist and Next dev looks like it's "warming up".
  const clientAny = prisma as unknown as Record<string, unknown>;
  if (!clientAny.paymentRecord || !clientAny.escrow) {
    return NextResponse.json(
      {
        error:
          "Prisma Client is out of date. Run `npm run db:deploy` then `npx prisma generate`, and restart `npm run dev`.",
      },
      { status: 500 }
    );
  }

  const rows = await prisma.paymentRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const escrows = await prisma.escrow.findMany({
    orderBy: { updatedAt: "desc" },
    include: { importRequest: { select: { fullName: true, email: true } } },
  });

  return NextResponse.json({
    payments: withMongoIds(rows),
    escrows,
  });
}
