import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findFirst({
      where: legacyMongoFilter(params.id),
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const serialized = withMongoId(category);
    return NextResponse.json({
      ...serialized,
      category: category.category || "",
      billboard: category.billboard || "",
      billboardId: category.billboardId || "",
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Error fetching category" }, { status: 500 });
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

    const existingCategory = await prisma.category.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let billboard = "";
    let billboardId = "";
    let category = "";
    let uploadedImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      billboard = String(form.get("billboard") || "");
      billboardId = String(form.get("billboardId") || "");
      category = String(form.get("category") || "");
      if (file) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const safeExt = (file.name.split(".").pop() || "jpg")
          .replace(/[^a-z0-9]/gi, "")
          .toLowerCase();
        const slug = slugifyCategory(category);
        const rel = `category/${slug || Date.now()}.${safeExt || "jpg"}`;
        uploadedImageUrl = await writeBufferToPublicUploads(rel, bytes);
      }
    } else {
      const body = await request.json();
      ({ billboard, billboardId, category } = body || {});
    }

    if (!billboard || !billboardId || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const billboardRow = await prisma.billboard.findFirst({
      where: legacyMongoFilter(billboardId),
    });

    if (uploadedImageUrl && billboardRow) {
      await prisma.billboard.update({
        where: { id: billboardRow.id },
        data: { imageURL: uploadedImageUrl },
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: existingCategory.id },
      data: {
        billboard,
        billboardId: billboardRow?.id ?? null,
        category,
      },
    });

    return NextResponse.json(withMongoId(updatedCategory));
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Error updating category" }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await prisma.category.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.category.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
  }
}
