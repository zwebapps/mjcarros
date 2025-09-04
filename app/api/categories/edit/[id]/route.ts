import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // const { userId } = auth(); // Removed Clerk auth

  try {
    // if (!userId) { // Removed Clerk auth
    //   return NextResponse.json({ error: "Unauthorized", status: 401 });
    // }

    const category = await prisma.category.findUnique({ // Changed db to prisma
      where: {
        id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Error getting category", status: 500 });
  }
}

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
    const { billboard, billboardId, category, categorySizes } = body;

    if (!billboard || !billboardId || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        billboard,
        billboardId,
        category,
        categorySizes: {
          deleteMany: {},
          create: categorySizes || [],
        },
      },
      include: {
        categorySizes: {
          include: {
            size: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Error updating category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // const { userId } = auth(); // Removed Clerk auth

  try {
    // if (!userId) { // Removed Clerk auth
    //   return NextResponse.json({ error: "Unauthorized", status: 401 });
    // }

    const productSizes = await prisma.categorySize.findMany({ // Changed db to prisma
      where: {
        categoryId: id,
      },
    });

    await Promise.all(
      productSizes.map(async (productSize) => {
        await prisma.categorySize.delete({ // Changed db to prisma
          where: {
            id: productSize.id,
          },
        });
      })
    );

    const task = await prisma.category.delete({ // Changed db to prisma
      where: {
        id,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Error deleting task", status: 500 });
  }
}
