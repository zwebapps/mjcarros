import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const billboard = await prisma.billboard.findFirst({
      where: legacyMongoFilter(params.id),
    });

    if (!billboard) {
      return NextResponse.json({ error: "Billboard not found" }, { status: 404 });
    }

    return NextResponse.json(withMongoId(billboard));
  } catch (error) {
    console.error("Error fetching billboard:", error);
    return NextResponse.json({ error: "Error fetching billboard" }, { status: 500 });
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

    const existingBillboard = await prisma.billboard.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existingBillboard) {
      return NextResponse.json({ error: "Billboard not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let billboard = "";
    let imageURL = existingBillboard.imageURL;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      const rawBillboard = form.get("billboard");
      billboard = typeof rawBillboard === "string" ? rawBillboard : String(rawBillboard || "");
      try {
        billboard = JSON.parse(billboard);
      } catch {
        /* ignore */
      }
      if (!billboard) {
        return NextResponse.json({ error: "Missing billboard" }, { status: 400 });
      }

      if (file) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-");
        imageURL = await writeBufferToPublicUploads(`category/${Date.now()}-${safeName}`, bytes);
      }
    } else {
      const body = await request.json();
      ({ billboard, imageURL } = body || {});
      if (!billboard || !imageURL) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    }

    const updatedBillboard = await prisma.billboard.update({
      where: { id: existingBillboard.id },
      data: { billboard, imageURL },
    });

    return NextResponse.json(withMongoId(updatedBillboard));
  } catch (error) {
    console.error("Error updating billboard:", error);
    return NextResponse.json({ error: "Error updating billboard" }, { status: 500 });
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

    const existing = await prisma.billboard.findFirst({
      where: legacyMongoFilter(params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Billboard not found" }, { status: 404 });
    }

    await prisma.billboard.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Billboard deleted successfully" });
  } catch (error) {
    console.error("Error deleting billboard:", error);
    return NextResponse.json({ error: "Error deleting billboard" }, { status: 500 });
  }
}
