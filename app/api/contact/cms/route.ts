import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withMongoId } from "@/lib/serialize-api";

export const runtime = "nodejs";

const defaultContact = {
  heroTitle: "Contact Us",
  heroSubtitle: "Get in touch with our premium automotive team",
  address1: "Majestic Journey Unipessoal LDA",
  cityLine: "Verdelhas - Vale Mourelos Espaco no. 1, 2815-729 Pontevedra, Portugal",
  phone: "+351 927508220",
  email: "majesticjourneypt@gmail.com",
  web: "www.majesticjourney.pt",
  hours: "24/7 Customer Support",
};

export async function GET() {
  try {
    const existing = await prisma.contactPage.findFirst();
    if (!existing) {
      const created = await prisma.contactPage.create({ data: defaultContact });
      return NextResponse.json(withMongoId(created));
    }

    return NextResponse.json(withMongoId(existing));
  } catch (error) {
    console.error("Error fetching contact page:", error);
    return NextResponse.json({ error: "Error fetching contact page" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { _id, id, ...updateData } = body;

    const existing = await prisma.contactPage.findFirst();
    let updated;

    if (existing) {
      updated = await prisma.contactPage.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      updated = await prisma.contactPage.create({
        data: { ...defaultContact, ...updateData },
      });
    }

    return NextResponse.json(withMongoId(updated));
  } catch (error) {
    console.error("Error updating contact page:", error);
    return NextResponse.json({ error: "Error updating contact page" }, { status: 500 });
  }
}
