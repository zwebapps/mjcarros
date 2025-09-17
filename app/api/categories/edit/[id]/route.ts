import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const categoriesCollection = db.collection('categories');
    
    const category = await categoriesCollection.findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    // Add id field for compatibility and map fields correctly
    const categoryWithId = {
      ...category,
      id: category._id.toString(),
      category: category.category || "",
      billboard: category.billboard || "",
      billboardId: category.billboardId || ""
    };
    
    return NextResponse.json(categoryWithId);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Error fetching category" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
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
      where: { _id: new ObjectId(params.id ) },
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
    const deleted = await db.category.delete({ where: { _id: new ObjectId(params.id ) } });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
  }
}
