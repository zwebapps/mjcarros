import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId, withMongoIds } from "@/lib/serialize-api";
import { isProductHidden, CLIENT_VISIBLE_PRODUCT_FILTER } from "@/lib/product-visibility";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findFirst({
      where: legacyMongoFilter(params.id),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let userRole = request.headers.get("x-user-role");
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get("authorization") ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null;
    }
    const isAdmin = userRole === "ADMIN";

    if (!isAdmin && isProductHidden(product)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        NOT: { id: product.id },
        ...CLIENT_VISIBLE_PRODUCT_FILTER,
      },
      take: 4,
    });

    const transformedProduct = {
      ...withMongoId(product),
      productCode:
        product.productCode || `PRD-${product.id.slice(-6).toUpperCase()}`,
      sold: !!product.sold,
    };

    const transformedRelatedProducts = withMongoIds(relatedProducts);

    return NextResponse.json({
      product: transformedProduct,
      relatedProducts: transformedRelatedProducts,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userRole = request.headers.get("x-user-role");
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get("authorization") ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null;
    }
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const existing = await prisma.product.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  }
}
