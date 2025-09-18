import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri } from "@/lib/mongodb-connection";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const billboardsCollection = db.collection('billboards');
    
    const billboard = await billboardsCollection.findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!billboard) {
      return NextResponse.json({ error: "Billboard not found" }, { status: 404 });
    }
    
    // Add id field for compatibility
    const billboardWithId = {
      ...billboard,
      id: billboard._id.toString()
    };
    
    return NextResponse.json(billboardWithId);
  } catch (error) {
    console.error("Error fetching billboard:", error);
    return NextResponse.json({ error: "Error fetching billboard" }, { status: 500 });
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
    // Admin guard with JWT
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      console.log('❌ No token provided for billboard edit');
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid token for billboard edit');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      console.log('❌ User is not admin for billboard edit:', decoded.role);
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    console.log('✅ Admin authorization verified for billboard edit');

    const body = await request.json();
    const { billboard, imageURL } = body;

    if (!billboard || !imageURL) {
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
    const db = client.db('mjcarros');
    const billboardsCollection = db.collection('billboards');

    const result = await billboardsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          billboard,
          imageURL,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Billboard not found" }, { status: 404 });
    }

    // Get the updated billboard
    const updatedBillboard = await billboardsCollection.findOne({ _id: new ObjectId(params.id) });
    
    if (!updatedBillboard) {
      return NextResponse.json({ error: "Billboard not found after update" }, { status: 404 });
    }

    // Add id field for compatibility
    const billboardWithId = {
      ...updatedBillboard,
      id: updatedBillboard._id.toString()
    };

    return NextResponse.json(billboardWithId);
  } catch (error) {
    console.error("Error updating billboard:", error);
    return NextResponse.json(
      { error: "Error updating billboard" },
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
    // Admin guard with JWT
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

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const billboardsCollection = db.collection('billboards');
    
    const result = await billboardsCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Billboard not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Billboard deleted successfully" });
  } catch (error) {
    console.error("Error deleting billboard:", error);
    return NextResponse.json({ error: "Error deleting billboard" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
