import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if any admin users exist (for first admin creation)
    const existingAdmins = await db.user.findMany({
      where: { role: 'ADMIN' }
    });

    // If no admins exist, allow creation without additional verification
    // If admins exist, require admin role verification
    if (existingAdmins.length > 0) {
      // Check if the request is from an existing admin
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json(
          { error: 'Admin token required to create additional admin users' },
          { status: 401 }
        );
      }

      // Verify the token and check if user is admin
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        const adminUser = await db.user.findUnique({
          where: { id: payload.userId }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Only existing admins can create new admin users' },
            { status: 403 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid admin token' },
          { status: 401 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      }
    });

    // Generate token for immediate login
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: userWithoutPassword,
      token,
      isFirstAdmin: existingAdmins.length === 0
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get admin setup status
export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: { role: 'ADMIN' }
    });

    const categoryCount = await db.category.count();
    const billboardCount = await db.billboard.count();

    return NextResponse.json({
      hasAdmins: adminCount > 0,
      adminCount,
      categoryCount,
      billboardCount,
      isSetupComplete: adminCount > 0 && categoryCount > 0 && billboardCount > 0
    });

  } catch (error) {
    console.error('Get setup status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
