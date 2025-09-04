import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const billboards = await prisma.billboard.findMany();
    return NextResponse.json(billboards);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching billboards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (middleware sets these headers)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { billboard, imageURL } = body;

    if (!billboard || !imageURL) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newBillboard = await prisma.billboard.create({
      data: {
        billboard,
        imageURL,
      },
    });

    return NextResponse.json(newBillboard);
  } catch (error) {
    console.error("Error creating billboard:", error);
    return NextResponse.json(
      { error: "Error creating billboard" },
      { status: 500 }
    );
  }
}
