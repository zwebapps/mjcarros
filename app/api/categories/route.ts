import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId, withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(withMongoIds(categories));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Error fetching categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      const rawSizes = form.get("categorySizes");
      if (rawSizes) {
        try {
          JSON.parse(String(rawSizes));
        } catch {
          /* ignore */
        }
      }
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

    const row = await prisma.category.create({
      data: {
        billboard,
        billboardId: billboardRow?.id ?? null,
        category,
      },
    });

    return NextResponse.json(withMongoId(row));
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Error creating category" }, { status: 500 });
  }
}
