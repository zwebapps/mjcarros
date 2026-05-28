import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.notification.findMany({
    where: { OR: [{ userId: auth.userId }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(withMongoIds(rows));
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId: auth.userId },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
