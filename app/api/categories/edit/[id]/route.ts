import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 500 }
      );
    }
    const category = await db.category.findUnique({ where: { id: params.id } });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Error fetching category" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updatedCategory = await db.category.update({
      where: { id: params.id },
      data: {
        billboard,
        billboardId,
        category,
        categorySizes: {
          deleteMany: {},
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

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Error updating category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin guard with JWT fallback
    let userRole = request.headers.get('x-user-role');
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization') ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null as any;
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 500 }
      );
    }
    const deleted = await db.category.delete({ where: { id: params.id } });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
  }
}
