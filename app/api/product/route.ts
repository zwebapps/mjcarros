import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import {
  buildUploadRelativePath,
  writeBufferToPublicUploads,
} from "@/lib/public-uploads";
import { mergeProductImageUrls } from "@/lib/product-image-urls";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId, withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.product.findMany({ orderBy: { updatedAt: "desc" } });
    const products = withMongoIds(rows).map((p: (typeof rows)[number] & { _id: string }) => ({
      ...p,
      productCode: p.productCode || `PRD-${p.id.slice(-6).toUpperCase()}`,
      sold: !!p.sold,
    }));
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let userRole = request.headers.get("x-user-role");
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get("authorization"));
      const payload = token ? verifyToken(token) : null;
      if (payload) userRole = payload.role;
    }
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let title = "";
    let description = "";
    let category = "";
    let categoryId = "";
    let price: number = 0;
    let finalPrice: number | undefined = undefined;
    let discount: number | undefined = undefined;
    let featured: boolean = false;
    let sold: boolean = false;
    let negotiable: boolean = false;
    let imageURLs: string[] = [];
    let extras: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const raw = String(formData.get("requestData") || "{}");
      const parsed = JSON.parse(raw || "{}");
      title = parsed.title;
      description = parsed.description;
      category = parsed.category;
      categoryId = parsed.categoryId;
      price = Number(parsed.price || 0);
      finalPrice = parsed.finalPrice ? Number(parsed.finalPrice) : undefined;
      discount = parsed.discount ? Number(parsed.discount) : undefined;
      featured = !!parsed.featured;
      sold = !!parsed.sold;
      negotiable = !!parsed.negotiable;
      extras = {
        modelName: parsed.modelName || "",
        year: parsed.year ? Number(parsed.year) : 0,
        stockQuantity: parsed.stockQuantity ? Number(parsed.stockQuantity) : 1,
        color: parsed.color || "",
        fuelType: parsed.fuelType || "",
        transmission: parsed.transmission || "",
        mileage: parsed.mileage ? Number(parsed.mileage) : null,
        condition: parsed.condition || "new",
      };

      const preUrls = mergeProductImageUrls(
        Array.isArray(parsed.galleryURLs) ? parsed.galleryURLs : [],
        Array.isArray(parsed.imageURLs) ? parsed.imageURLs : []
      );

      const files = formData.getAll("files") as File[];
      const uploadFailures: string[] = [];
      let uploadedUrls: string[] = [];

      if (preUrls.length === 0) {
        for (const file of files) {
          if (!file || typeof file === "string" || file.size === 0) continue;
          try {
            const bytes = Buffer.from(await file.arrayBuffer());
            const relativePath = buildUploadRelativePath("product", file.name);
            const url = await writeBufferToPublicUploads(relativePath, bytes);
            uploadedUrls.push(url);
          } catch (err) {
            uploadFailures.push(file.name || "image");
            console.warn(
              "[product/create] upload failed:",
              file.name,
              err instanceof Error ? err.message : String(err)
            );
          }
        }
      }

      imageURLs = mergeProductImageUrls(preUrls, uploadedUrls);

      if (files.length > 0 && uploadFailures.length === files.length && !preUrls.length) {
        return NextResponse.json(
          {
            error:
              "Failed to save image files. Use gallery upload or check uploads folder permissions on the server.",
          },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      ({
        title,
        description,
        imageURLs = [],
        category,
        categoryId,
        price,
        finalPrice,
        discount,
        featured,
        sold,
        negotiable,
        ...extras
      } = body);
      imageURLs = mergeProductImageUrls(imageURLs);
    }

    if (!title || !description || !category || !price) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, category, price" },
        { status: 400 }
      );
    }

    if (!imageURLs.length) {
      return NextResponse.json(
        { error: "At least one product image is required" },
        { status: 400 }
      );
    }

    const catRow = categoryId
      ? await prisma.category.findFirst({ where: legacyMongoFilter(categoryId) })
      : await prisma.category.findFirst({
          where: { category: { equals: category, mode: "insensitive" } },
        });

    const resolvedCategoryId = catRow?.id ?? categoryId;
    const resolvedCategoryName = catRow?.category ?? category;

    if (!resolvedCategoryId) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    const row = await prisma.product.create({
      data: {
        title,
        description,
        imageURLs,
        category: resolvedCategoryName,
        categoryId: resolvedCategoryId,
        price,
        finalPrice,
        discount,
        featured: featured || false,
        sold: sold || false,
        negotiable: negotiable || false,
        modelName: (extras.modelName as string) || "",
        year: (extras.year as number) || undefined,
        stockQuantity: (extras.stockQuantity as number) || 1,
        color: (extras.color as string) || "",
        fuelType: (extras.fuelType as string) || "",
        transmission: (extras.transmission as string) || "",
        mileage: extras.mileage as number | null | undefined,
        condition: (extras.condition as string) || "new",
      },
    });

    const productCode = `PRD-${row.id.slice(-6).toUpperCase()}`;
    const updated = await prisma.product.update({
      where: { id: row.id },
      data: { productCode },
    });

    return NextResponse.json(withMongoId(updated));
  } catch (error) {
    console.error("Error creating product:", error);
    const message = error instanceof Error ? error.message : "Error creating product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
