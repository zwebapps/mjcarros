import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros';

export async function GET(request: NextRequest) {
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
    
    const billboards = await billboardsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(billboards);
  } catch (error) {
    console.error("Error fetching billboards:", error);
    return NextResponse.json({ error: "Error fetching billboards" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
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

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const billboardsCollection = db.collection('billboards');
    
    const billboardData = {
      billboard,
      imageURL,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await billboardsCollection.insertOne(billboardData);
    const newBillboard = { ...billboardData, _id: result.insertedId };

    return NextResponse.json(newBillboard);
  } catch (error) {
    console.error("Error creating billboard:", error);
    return NextResponse.json(
      { error: "Error creating billboard" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
