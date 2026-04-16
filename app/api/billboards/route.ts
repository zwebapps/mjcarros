import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
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

    const contentType = request.headers.get("content-type") || "";
    let billboard = "";
    let imageURL = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      const rawBillboard = form.get("billboard");
      billboard = typeof rawBillboard === "string" ? rawBillboard : String(rawBillboard || "");
      // existing UI sends JSON.stringify(value)
      try {
        billboard = JSON.parse(billboard);
      } catch {
        /* ignore */
      }
      if (!file || !billboard) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-");
      imageURL = await writeBufferToPublicUploads(`category/${Date.now()}-${safeName}`, bytes);
    } else {
      const body = await request.json();
      ({ billboard, imageURL } = body || {});
      if (!billboard || !imageURL) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    }

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
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
