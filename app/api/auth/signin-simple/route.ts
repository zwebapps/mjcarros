import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function POST(request: NextRequest) {
  let client;
  
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
    
    const db = client.db('mjcarros');
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

    // Generate token
    const token = jwt.sign({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role
    }, JWT_SECRET, { expiresIn: '7d' });

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
