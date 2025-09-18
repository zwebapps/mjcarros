import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { comparePassword, generateToken } from '@/lib/auth';
import { getMongoDbUri } from '@/lib/mongodb-connection';

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('🔐 Signin request received');
    
    const { email, password } = await request.json();
    console.log('📧 Email:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
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
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');
    
    // Find user
    console.log('🔍 Looking for user...');
    const user = await usersCollection.findOne({ email });
    console.log('👤 User found:', !!user);

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    console.log('🔐 Verifying password...');
    const isValidPassword = await comparePassword(password, user.password);
    console.log('🔐 Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    console.log('🎫 Generating token...');
    const token = generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role
    });
    console.log('✅ Token generated');

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('✅ Signin successful');
    return NextResponse.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('❌ Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}