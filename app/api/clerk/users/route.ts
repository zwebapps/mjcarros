import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPrismaUserRole } from "@/lib/roles";
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
    role: user.role,
    unsafeMetadata: { isAdmin: user.role === "ADMIN", role: user.role },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET(request: NextRequest) {
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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(users.map(formatClerkUser));
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { email, userName, password, isAdmin } = await request.json();

    if (!email || !userName || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    const roleMap: Record<string, string> = {
      Admin: "ADMIN",
      Dealer: "DEALER",
      Customer: "CUSTOMER",
      User: "USER",
    };
    const role = roleMap[String(isAdmin)] || "USER";

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const row = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: userName,
        role: toPrismaUserRole(role),
      },
    });

    return NextResponse.json({ user: formatClerkUser(row) });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
