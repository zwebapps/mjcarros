import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        productSizes: {
          include: {
            size: true,
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching products" },
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
    const { title, description, imageURLs, category, categoryId, price, finalPrice, discount, featured, productSizes } = body;

    if (!title || !description || !imageURLs || !category || !categoryId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        imageURLs,
        category,
        categoryId,
        price,
        finalPrice,
        discount,
        featured: featured || false,
        productSizes: {
          create: productSizes || [],
        },
      },
      include: {
        productSizes: {
          include: {
            size: true,
          },
        },
      },
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}
