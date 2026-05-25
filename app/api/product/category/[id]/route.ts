import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoIds } from "@/lib/serialize-api";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const category = await prisma.category.findFirst({
      where: legacyMongoFilter(id),
    });

    const products = await prisma.product.findMany({
      where: category
        ? { categoryId: category.id }
        : { category: { equals: id, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(withMongoIds(products));
  } catch (error) {
    console.error("Error getting products by category:", error);
    return NextResponse.json({ error: "Error getting product" }, { status: 500 });
  }
}
