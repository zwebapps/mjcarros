import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { hashPassword, generateToken } from '@/lib/auth';
import { getMongoDbUri } from '@/lib/mongodb-connection';

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const { email, password, name, role = 'USER' } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const allowedRoles = ['USER', 'ADMIN', 'CUSTOMER'];
    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be USER, CUSTOMER or ADMIN' },
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
    const usersCollection = db.collection('users');
    
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const userData = { 
      email, 
      password: hashedPassword, 
      name, 
      role: role as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(userData);
    const user = { ...userData, _id: result.insertedId };

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
