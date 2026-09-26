import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;

  try {
    const sizes = await prisma.productSize.findMany({
      where: { productId },
      include: {
        size: true,
      },
    });

    const sizeData = sizes.map((productSize) => ({
      id: productSize.sizeId,
      name: productSize.size.name,
    }));

    return NextResponse.json(sizeData);
  } catch (error) {
    console.error("Error fetching sizes for category:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}
