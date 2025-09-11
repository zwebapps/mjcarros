import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const billboards = await db.billboard.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(billboards);
  } catch (error) {
    console.error("Error fetching billboards:", error);
    return NextResponse.json({ error: "Error fetching billboards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (middleware headers) or verify JWT directly
    let userRole = request.headers.get('x-user-role');
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization') ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null as any;
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { billboard, imageURL } = body;

    if (!billboard || !imageURL) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newBillboard = await db.billboard.create({
      data: {
        billboard,
        imageURL,
      },
    });

    return NextResponse.json(newBillboard);
  } catch (error) {
    console.error("Error creating billboard:", error);
    return NextResponse.json(
      { error: "Error creating billboard" },
      { status: 500 }
    );
  }
}
