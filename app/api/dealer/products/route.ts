import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isDealerRole } from "@/lib/roles";
import { withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isDealerRole(auth.role)) {
    return NextResponse.json({ error: "Dealer access required" }, { status: 403 });
  }

  const dealer = await prisma.dealer.findFirst({ where: { userId: auth.userId } });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { dealerId: dealer.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(withMongoIds(products));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isDealerRole(auth.role)) {
    return NextResponse.json({ error: "Dealer access required" }, { status: 403 });
  }

  const dealer = await prisma.dealer.findFirst({ where: { userId: auth.userId } });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const categoryId = String(body.categoryId || "").trim();
  const price = Number(body.price);

  if (!title || !categoryId || !Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "title, categoryId, and valid price are required" },
      { status: 400 }
    );
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const row = await prisma.product.create({
    data: {
      title,
      description: body.description ? String(body.description) : "",
      price,
      finalPrice: body.finalPrice != null ? Number(body.finalPrice) : null,
      discount: body.discount != null ? Number(body.discount) : null,
      featured: !!body.featured,
      sold: false,
      negotiable: !!body.negotiable,
      imageURLs: Array.isArray(body.imageURLs) ? body.imageURLs.map(String) : [],
      category: category.category,
      categoryId: category.id,
      modelName: body.modelName ? String(body.modelName) : null,
      year: body.year != null ? Number(body.year) : null,
      stockQuantity: body.stockQuantity != null ? Number(body.stockQuantity) : 1,
      color: body.color ? String(body.color) : null,
      fuelType: body.fuelType ? String(body.fuelType) : null,
      transmission: body.transmission ? String(body.transmission) : null,
      mileage: body.mileage != null ? Number(body.mileage) : null,
      condition: body.condition ? String(body.condition) : null,
      vin: body.vin ? String(body.vin) : null,
      dealerId: dealer.id,
      availability: body.availability ? String(body.availability) : "available",
    },
  });

  return NextResponse.json(row, { status: 201 });
}
