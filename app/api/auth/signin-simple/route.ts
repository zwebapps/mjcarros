import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getMongoDbUri, getMongoDbName } from '@/lib/mongodb-connection';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let client;
  let MONGODB_URI: string;
  try {
    MONGODB_URI = getMongoDbUri();
  } catch (e) {
    console.error('MongoDB configuration error:', e);
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    console.log('🔐 Simple signin request received');
    
    const { email, password } = await request.json();
    console.log('📧 Email:', email);

    // Validate input
    if (!email || !password) {
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
    
    const db = client.db(getMongoDbName());
    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ email });
    console.log('👤 User found:', !!user);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role,
    });

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
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
