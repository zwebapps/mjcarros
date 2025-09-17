import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { extractTokenFromHeader, verifyToken, hashPassword } from '@/lib/auth';
import { getMongoDbUri } from '@/lib/mongodb-connection';

const MONGODB_URI = getMongoDbUri();

export async function GET(request: NextRequest) {
  let client;
  
  try {
    console.log('🔍 GET /api/clerk/users - Fetching users list');
    
    // Admin authentication required
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid token');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('✅ Token decoded, user role:', decoded.role);

    if (decoded.role !== 'ADMIN') {
      console.log('❌ User is not admin, role:', decoded.role);
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    console.log('✅ Admin access verified, connecting to database...');

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');
    
    // Get all users (excluding passwords)
    const users = await usersCollection.find({}, {
      projection: { password: 0 } // Exclude password field
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Found ${users.length} users in database`);
    
    // Format users to match Clerk API format
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      _id: user._id,
      firstName: user.name,
      username: user.name,
      emailAddresses: [{ emailAddress: user.email }],
      unsafeMetadata: { isAdmin: user.role === 'ADMIN' },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    console.log('✅ Returning formatted users:', formattedUsers.map(u => ({ id: u.id, email: u.emailAddresses[0].emailAddress, role: u.unsafeMetadata.isAdmin ? 'ADMIN' : 'USER' })));
    
    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    // Admin authentication required
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

    const { email, userName, password, isAdmin } = await request.json();

    if (!email || !userName || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    const role = isAdmin === 'Admin' ? 'ADMIN' : 'USER';

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const usersCollection = db.collection('users');
    
    // Check if user already exists
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
      name: userName, 
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(userData);
    
    // Format response to match Clerk API
    const newUser = {
      id: result.insertedId.toString(),
      _id: result.insertedId,
      firstName: userName,
      username: userName,
      emailAddresses: [{ emailAddress: email }],
      unsafeMetadata: { isAdmin: role === 'ADMIN' },
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
