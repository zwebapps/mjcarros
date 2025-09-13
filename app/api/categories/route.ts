import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 500 }
      );
    }
    const categories = await db.category.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Error fetching categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (middleware sets headers); fallback to verifying JWT
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
    const { billboard, billboardId, category, categorySizes } = body;

    if (!billboard || !billboardId || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 500 }
      );
    }
    const newCategory = await db.category.create({
      data: {
        billboard,
        billboardId,
        category,
        categorySizes: {
          create: categorySizes || [],
        },
      },
      include: {
        categorySizes: {
          include: {
            size: true,
          },
        },
      },
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error creating category" },
      { status: 500 }
    );
  }
}
