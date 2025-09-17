import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function GET() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const contactPagesCollection = db.collection('contactPages');
    
    // Return single ContactPage (create default if missing)
    const existing = await contactPagesCollection.findOne({});
    if (!existing) {
      const defaultData = {
        heroTitle: "Contact Us",
        heroSubtitle: "Get in touch with our premium automotive team",
        address1: "Danneckerstrasse 7",
        cityLine: "Müllheim Kehrlich",
        phone: "01787125217",
        email: "waseembt10029@hotmail.com",
        web: "www.mjcarros.pt",
        hours: "24/7 Customer Support",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await contactPagesCollection.insertOne(defaultData);
      const created = { ...defaultData, _id: result.insertedId, id: result.insertedId.toString() };
      return NextResponse.json(created);
    }
    
    // Add id field for compatibility
    const contactWithId = {
      ...existing,
      id: existing._id.toString()
    };
    
    return NextResponse.json(contactWithId);
  } catch (error) {
    console.error("Error fetching contact page:", error);
    return NextResponse.json({ error: "Error fetching contact page" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function PUT(request: NextRequest) {
  let client;
  
  try {
    // Admin guard
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

    const body = await request.json();
    
    // Remove _id and id from the update data to prevent immutable field error
    const { _id, id, ...updateData } = body;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const contactPagesCollection = db.collection('contactPages');
    
    const existing = await contactPagesCollection.findOne({});
    let updated;
    
    if (existing) {
      // Update existing contact page
      await contactPagesCollection.updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
      updated = await contactPagesCollection.findOne({ _id: existing._id });
    } else {
      // Create new contact page
      updateData.createdAt = new Date();
      const result = await contactPagesCollection.insertOne(updateData);
      updated = await contactPagesCollection.findOne({ _id: result.insertedId });
    }
    
    // Add id field for compatibility
    const contactWithId = {
      ...updated,
      id: updated._id.toString()
    };
    
    return NextResponse.json(contactWithId);
  } catch (error) {
    console.error("Error updating contact page:", error);
    return NextResponse.json({ error: "Error updating contact page" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}


