import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros';

export async function GET(request: NextRequest) {
  let client;
  
  try {
    console.log('🔍 Testing simple MongoDB connection...');
    
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');
    
    const userCount = await usersCollection.countDocuments();
    const users = await usersCollection.find({}).toArray();
    
    return NextResponse.json({
      success: true,
      userCount,
      users: users.map(u => ({ email: u.email, role: u.role })),
      message: 'Simple connection working'
    });

  } catch (error) {
    console.error('❌ Simple connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Simple connection failed'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
