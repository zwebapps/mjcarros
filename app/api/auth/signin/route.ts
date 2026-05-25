import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/auth";
import { normalizeRole, prismaRoleToAppRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const emailRaw = typeof email === "string" ? email.trim() : "";
    const passwordRaw = typeof password === "string" ? password : "";

    if (!emailRaw || !passwordRaw) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: emailRaw, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValidPassword = await comparePassword(passwordRaw, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const role = normalizeRole(prismaRoleToAppRole(user.role));
    const serialized = withMongoId(user);
    const token = generateToken({
      userId: serialized._id,
      email: user.email,
      role,
    });

    const { password: _, ...userWithoutPassword } = serialized;

    return NextResponse.json({
      user: { ...userWithoutPassword, role },
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
