import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";
import { prisma } from "@/lib/prisma";
import { withMongoId, withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const billboards = await prisma.billboard.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(withMongoIds(billboards));
  } catch (error) {
    console.error("Error fetching billboards:", error);
    return NextResponse.json({ error: "Error fetching billboards" }, { status: 500 });
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
    let imageURL = "";

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
      if (!file || !billboard) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-");
      imageURL = await writeBufferToPublicUploads(`category/${Date.now()}-${safeName}`, bytes);
    } else {
      const body = await request.json();
      ({ billboard, imageURL } = body || {});
      if (!billboard || !imageURL) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    }

    const row = await prisma.billboard.create({
      data: { billboard, imageURL },
    });

    return NextResponse.json(withMongoId(row));
  } catch (error) {
    console.error("Error creating billboard:", error);
    return NextResponse.json({ error: "Error creating billboard" }, { status: 500 });
  }
}
