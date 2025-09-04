import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedBillboard = await prisma.billboard.update({
      where: { id: params.id },
      data: {
        billboard,
        imageURL,
      },
    });

    return NextResponse.json(updatedBillboard);
  } catch (error) {
    console.error("Error updating billboard:", error);
    return NextResponse.json(
      { error: "Error updating billboard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin (middleware sets these headers)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await prisma.billboard.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Billboard deleted successfully" });
  } catch (error) {
    console.error("Error deleting billboard:", error);
    return NextResponse.json(
      { error: "Error deleting billboard" },
      { status: 500 }
    );
  }
}
