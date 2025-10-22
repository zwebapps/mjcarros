import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

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
    const db = client.db(getMongoDbName());
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
  let client;
  
  try {
    // Admin authentication required
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { billboard, billboardId, category } = body;

    if (!billboard || !billboardId || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const categoriesCollection = db.collection('categories');

    // Check if category exists
    const existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(params.id) });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updateData = {
      billboard,
      billboardId,
      category,
      updatedAt: new Date()
    };

    const result = await categoriesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get updated category
    const updatedCategory = await categoriesCollection.findOne({ _id: new ObjectId(params.id) });
    
    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found after update' }, { status: 404 });
    }

    // Add id field for compatibility
    const categoryWithId = {
      ...updatedCategory,
      id: updatedCategory._id.toString()
    };

    return NextResponse.json(categoryWithId);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Error updating category" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    // Admin authentication required
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

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
    const db = client.db(getMongoDbName());
    const categoriesCollection = db.collection('categories');
    
    const result = await categoriesCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
