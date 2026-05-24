import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { comparePassword, generateToken } from '@/lib/auth';
import { getMongoDbUri, getMongoDbName } from '@/lib/mongodb-connection';
import { normalizeRole } from '@/lib/roles';

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('🔐 Signin request received');
    
    const { email, password } = await request.json();
    const emailRaw = typeof email === "string" ? email.trim() : "";
    const passwordRaw = typeof password === "string" ? password : "";

    if (!emailRaw || !passwordRaw) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${emailRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(passwordRaw, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const role = normalizeRole(user.role);
    const token = generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role,
    });

    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: { ...userWithoutPassword, role },
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