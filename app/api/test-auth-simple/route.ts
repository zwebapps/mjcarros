import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  // During build time, return mock response
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_AVAILABLE) {
    return NextResponse.json({
      success: false,
      error: 'Database unavailable during build',
      message: 'Build-time mock response'
    }, { status: 200 });
  }

  let client;
  
  try {
    console.log('🔐 Testing simple auth...');
    
    const { email, password } = await request.json();
    console.log('📧 Email:', email);
    
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ email });
    console.log('👤 User found:', !!user);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Generate simple token
    const token = 'test-token-' + Date.now();
    
    return NextResponse.json({
      success: true,
      user: { email: user.email, role: user.role },
      token,
      message: 'Simple auth successful'
    });

  } catch (error) {
    console.error('❌ Simple auth error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Simple auth failed'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
