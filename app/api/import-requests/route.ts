import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { withMongoId, withMongoIds } from "@/lib/serialize-api";

export const runtime = "nodejs";

/** Public: submit Germany → Portugal import lead */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!fullName || !phone || !email) {
      return NextResponse.json(
        { error: "Full name, phone, and email are required" },
        { status: 400 }
      );
    }

    const row = await prisma.importRequest.create({
      data: {
        fullName,
        phone,
        email,
        country: String(body.country || "Portugal"),
        preferredContact: body.preferredContact ? String(body.preferredContact) : null,
        brand: body.brand ? String(body.brand) : null,
        model: body.model ? String(body.model) : null,
        budgetRange: body.budgetRange ? String(body.budgetRange) : null,
        fuelType: body.fuelType ? String(body.fuelType) : null,
        transmission: body.transmission ? String(body.transmission) : null,
        yearMin: body.yearMin != null ? Number(body.yearMin) : null,
        yearMax: body.yearMax != null ? Number(body.yearMax) : null,
        mileageLimit: body.mileageLimit != null ? Number(body.mileageLimit) : null,
        bodyType: body.bodyType ? String(body.bodyType) : null,
        mustHaveFeatures: body.mustHaveFeatures ? String(body.mustHaveFeatures) : null,
        germanyOnly: body.germanyOnly !== false,
        maxImportTime: body.maxImportTime ? String(body.maxImportTime) : null,
        registrationAssist: !!body.registrationAssist,
        deliveryLocation: body.deliveryLocation ? String(body.deliveryLocation) : null,
        totalBudget: body.totalBudget ? String(body.totalBudget) : null,
        financingRequired: !!body.financingRequired,
        downPayment: body.downPayment ? String(body.downPayment) : null,
        reservationDeposit: body.reservationDeposit ? String(body.reservationDeposit) : null,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    await prisma.importEvent.create({
      data: { importRequestId: row.id, status: "SEARCHING", message: "Lead received" },
    });

    return NextResponse.json(withMongoId(row), { status: 201 });
  } catch (error) {
    console.error("Import request error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

/** Admin: list import pipeline */
export async function GET(request: NextRequest) {
  try {
    let role = request.headers.get("x-user-role");
    if (!role) {
      const token = extractTokenFromHeader(request.headers.get("authorization") ?? undefined);
      const payload = token ? verifyToken(token) : null;
      role = payload?.role ?? null;
    }
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const rows = await prisma.importRequest.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(withMongoIds(rows));
  } catch (error) {
    console.error("Import requests list error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
