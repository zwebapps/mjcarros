import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { hashPassword, generateToken } from "@/lib/auth";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";
import { isReservedAdminEmail, SIGNUP_ROLE } from "@/lib/roles";

export const runtime = "nodejs";

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  let client;

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

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db(getMongoDbName());
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: SIGNUP_ROLE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(userData);
    const user = { ...userData, _id: result.insertedId };

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: SIGNUP_ROLE,
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
