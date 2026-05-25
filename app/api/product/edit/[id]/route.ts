import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import {
  buildUploadRelativePath,
  writeBufferToPublicUploads,
} from "@/lib/public-uploads";
import { mergeProductImageUrls } from "@/lib/product-image-urls";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

function sanitizeImageUrls(urls: string[]): string[] {
  return mergeProductImageUrls(urls);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findFirst({
      where: legacyMongoFilter(params.id),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ...withMongoId(product), sold: !!product.sold });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Error fetching product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const existing = await prisma.product.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const hasField = (key: string) => formData.has(key);
    const name = String(formData.get("name") || "");
    const price = Number(formData.get("price") || 0);
    const discountRaw = formData.get("discount");
    const discount =
      discountRaw !== null && String(discountRaw).length > 0 ? Number(discountRaw) : null;
    const finalPriceRaw = formData.get("finalPrice");
    const finalPrice =
      finalPriceRaw !== null && String(finalPriceRaw).length > 0
        ? Number(finalPriceRaw)
        : null;
    const description = String(formData.get("description") || "");
    const category = String(formData.get("category") || "");
    const parseBool = (v: FormDataEntryValue | null): boolean => {
      if (v == null) return false;
      const s = String(v).toLowerCase();
      return s === "true" || s === "on" || s === "1" || s === "yes" || s === "checked";
    };
    const isFeatured = parseBool(formData.get("isFeatured"));
    const isSold = parseBool(formData.get("isSold"));
    const isNegotiable = parseBool(formData.get("negotiable"));
    const modelName = String(formData.get("modelName") || "");
    const year = Number(formData.get("year") || 0);
    const stockQuantity = Number(formData.get("stockQuantity") || 1);
    const color = String(formData.get("color") || "");
    const fuelType = String(formData.get("fuelType") || "");
    const transmission = String(formData.get("transmission") || "");
    const mileageRaw = formData.get("mileage");
    const mileage =
      mileageRaw !== null && String(mileageRaw).length > 0 ? Number(mileageRaw) : null;
    const condition = String(formData.get("condition") || "");

    let categoryIdUpdate: string | undefined;
    if (hasField("category")) {
      const cat = await prisma.category.findFirst({
        where: { category: { equals: category, mode: "insensitive" } },
      });
      if (cat) categoryIdUpdate = cat.id;
    }

    const newFiles = formData.getAll("image") as File[];
    const existingImagesRaw = formData.get("existingImageURLs");
    const existingImages: string[] | null = existingImagesRaw
      ? JSON.parse(String(existingImagesRaw))
      : null;
    const newUrls: string[] = [];

    const uploadFailures: string[] = [];
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        if (!file || typeof file === "string" || file.size === 0) continue;
        try {
          const bytes = Buffer.from(await file.arrayBuffer());
          const relativePath = buildUploadRelativePath("product", file.name);
          const url = await writeBufferToPublicUploads(relativePath, bytes);
          newUrls.push(url);
        } catch (localError) {
          const fileName = file.name || "image";
          uploadFailures.push(fileName);
          console.warn(
            "Upload failed:",
            fileName,
            localError instanceof Error ? localError.message : String(localError)
          );
        }
      }
    }

    if (uploadFailures.length > 0 && newUrls.length === 0) {
      return NextResponse.json(
        {
          error: `Failed to save image file(s): ${uploadFailures.join(", ")}. Check server uploads folder permissions.`,
        },
        { status: 400 }
      );
    }

    let combinedUrls: string[] | undefined;
    if (existingImages !== null) {
      combinedUrls = mergeProductImageUrls(existingImages, newUrls);
    } else if (newUrls.length && existing) {
      combinedUrls = mergeProductImageUrls(existing.imageURLs || [], newUrls);
    } else if (newUrls.length) {
      combinedUrls = mergeProductImageUrls(newUrls);
    }

    const setData: Record<string, unknown> = {
      featured: isFeatured,
      sold: isSold,
      negotiable: isNegotiable,
    };

    if (hasField("name")) setData.title = name;
    if (hasField("price")) setData.price = price;
    if (hasField("discount")) {
      if (discountRaw !== null && String(discountRaw).length > 0) setData.discount = discount;
      else setData.discount = null;
    }
    if (hasField("finalPrice")) {
      if (finalPriceRaw !== null && String(finalPriceRaw).length > 0)
        setData.finalPrice = finalPrice;
      else setData.finalPrice = null;
    }
    if (hasField("description")) setData.description = description;
    if (hasField("category")) setData.category = category;
    if (hasField("category") && categoryIdUpdate) setData.categoryId = categoryIdUpdate;
    if (hasField("modelName")) setData.modelName = modelName;
    if (hasField("year")) setData.year = year;
    if (hasField("stockQuantity")) setData.stockQuantity = stockQuantity > 0 ? stockQuantity : 1;
    if (hasField("color")) setData.color = color;
    if (hasField("fuelType")) setData.fuelType = fuelType;
    if (hasField("transmission")) setData.transmission = transmission;
    if (hasField("mileage")) {
      if (mileageRaw !== null && String(mileageRaw).length > 0) setData.mileage = mileage;
      else setData.mileage = null;
    }
    if (hasField("condition")) setData.condition = condition || "new";
    if (combinedUrls !== undefined) {
      const unique = sanitizeImageUrls(combinedUrls);

      if (unique.length > 0) {
        setData.imageURLs = unique;
      } else if (newFiles.length > 0) {
        return NextResponse.json(
          { error: "No valid image URLs to save. Upload images again from admin." },
          { status: 400 }
        );
      } else if ((existing?.imageURLs?.length ?? 0) > 0) {
        console.warn(
          `[product/edit] Preserving ${existing!.imageURLs!.length} existing image(s); client sent empty existingImageURLs`
        );
      } else {
        setData.imageURLs = [];
      }
    }

    if (!existing.productCode) {
      setData.productCode = `PRD-${existing.id.slice(-6).toUpperCase()}`;
    }

    const refreshed = await prisma.product.update({
      where: { id: existing.id },
      data: setData,
    });

    return NextResponse.json(withMongoId(refreshed));
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
