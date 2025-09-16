import { NextRequest, NextResponse } from "next/server";
import { db, findOne } from "@/lib/db";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

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
    const billboard = await findOne('billboard', { id: params.id  });
    return NextResponse.json(billboard);
  } catch (error) {
    console.error("Error fetching billboard:", error);
    return NextResponse.json({ error: "Error fetching billboard" }, { status: 500 });
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
    const { billboard, imageURL } = body;

    if (!billboard || !imageURL) {
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
    const updatedBillboard = await db.billboard.update({
      where: { _id: new ObjectId(params.id ) },
      data: {
        billboard,
        imageURL,
      },
    });

    return NextResponse.json(updatedBillboard);
  } catch (error) {
    console.error("Error updating billboard:", error);
    return NextResponse.json(
      { error: "Error updating billboard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const deleted = await db.billboard.delete({ where: { _id: new ObjectId(params.id ) } });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting billboard:", error);
    return NextResponse.json({ error: "Error deleting billboard" }, { status: 500 });
  }
}
