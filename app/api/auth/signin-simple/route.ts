import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import { prismaRoleToAppRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { withMongoId } from "@/lib/serialize-api";
import { setAuthCookie } from "@/lib/auth-cookie";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const serialized = withMongoId(user);
    const role = prismaRoleToAppRole(user.role);
    const token = generateToken({
      userId: serialized._id,
      email: user.email,
      role,
    });

    const { password: _, ...userWithoutPassword } = serialized;

    const response = NextResponse.json({
      user: { ...userWithoutPassword, role },
      token,
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
