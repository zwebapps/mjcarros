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
    const { title, description, imageURLs, category, categoryId, price, finalPrice, discount, featured, productSizes } = body;

    if (!title || !description || !imageURLs || !category || !categoryId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update product sizes first
    if (productSizes) {
      // Delete existing product sizes
      await prisma.productSize.deleteMany({
        where: { productId: params.id },
      });

      // Create new product sizes
      await prisma.productSize.createMany({
        data: productSizes.map((size: any) => ({
          productId: params.id,
          sizeId: size.sizeId,
          name: size.name,
        })),
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
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
      },
      include: {
        productSizes: {
          include: {
            size: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 }
    );
  }
}
