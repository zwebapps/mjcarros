import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPrismaUserRole } from "@/lib/roles";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

function formatClerkUser(user: {
  id: string;
  legacyMongoId: string | null;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const serialized = withMongoId(user);
  return {
    id: serialized._id,
    _id: serialized._id,
    firstName: user.name,
    username: user.name,
    emailAddresses: [{ emailAddress: user.email }],
    unsafeMetadata: { isAdmin: user.role === "ADMIN" },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: legacyMongoFilter(params.id),
      select: {
        id: true,
        legacyMongoId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: formatClerkUser(user) });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { email, userName, isAdmin, password } = await request.json();

    if (!email || !userName) {
      return NextResponse.json({ error: "Email and username are required" }, { status: 400 });
    }

    const role = isAdmin === "Admin" ? "ADMIN" : "USER";

    const existingUser = await prisma.user.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: existingUser.id } },
    });
    if (emailTaken) {
      return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 });
    }

    const updateData: { email: string; name: string; role: ReturnType<typeof toPrismaUserRole>; password?: string } = {
      email,
      name: userName,
      role: toPrismaUserRole(role),
    };

    if (password?.trim()) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
      select: {
        id: true,
        legacyMongoId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: formatClerkUser(updatedUser) });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const existing = await prisma.user.findFirst({ where: legacyMongoFilter(params.id) });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
