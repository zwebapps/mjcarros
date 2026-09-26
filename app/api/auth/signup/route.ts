import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth";
import { isReservedAdminEmail, SIGNUP_ROLE, toPrismaUserRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (isReservedAdminEmail(email)) {
      return NextResponse.json(
        {
          error:
            "This email is reserved for dealership administration. Sign in with your admin password or contact MJ Carros.",
        },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const row = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: toPrismaUserRole(SIGNUP_ROLE),
      },
    });

    const user = withMongoId(row);
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: SIGNUP_ROLE,
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
