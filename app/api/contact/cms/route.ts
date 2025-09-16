import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET() {
  // Return single ContactPage (create default if missing)
  if (!db) {
    return NextResponse.json({ error: 'Database not found' }, { status: 500 });
  }
  const existing = await db.contactPage.findFirst({});
  if (!existing) {
    const created = await db.contactPage.create({ data: {} });
    return NextResponse.json(created);
  }
  return NextResponse.json(existing);
}

export async function PUT(request: NextRequest) {
  // Admin guard
  let role = request.headers.get('x-user-role');
  if (!role) {
    const token = extractTokenFromHeader(request.headers.get('authorization') ?? undefined);
    const payload = token ? verifyToken(token) : null;
    role = payload?.role || null as any;
  }
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  if (!db) {
    return NextResponse.json({ error: 'Database not found' }, { status: 500 });
  }
  
  const existing = await db.contactPage.findFirst({});
  let updated;
  if (existing) {
    updated = await db.contactPage.update({
      where: { _id: existing._id },
      data: body,
    });
  } else {
    updated = await db.contactPage.create({
      data: body,
    });
  }
  return NextResponse.json(updated);
}


