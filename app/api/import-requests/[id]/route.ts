import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole, isDealerRole } from "@/lib/roles";
import { withMongoId } from "@/lib/serialize-api";
import {
  assignDealerToImport,
  importInclude,
  parseImportStatus,
  updateImportStatus,
} from "@/lib/import-service";

export const runtime = "nodejs";

async function getDealerIdForUser(userId: string) {
  const dealer = await prisma.dealer.findFirst({ where: { userId } });
  return dealer?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.importRequest.findUnique({
    where: { id: params.id },
    include: importInclude,
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isDealerRole(auth.role)) {
    const dealerId = await getDealerIdForUser(auth.userId);
    if (row.assignedDealerId !== dealerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(withMongoId(row));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const existing = await prisma.importRequest.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isDealerRole(auth.role)) {
    const dealerId = await getDealerIdForUser(auth.userId);
    if (existing.assignedDealerId !== dealerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status = parseImportStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const row = await updateImportStatus(params.id, status, body.message);
    if (Array.isArray(body.inspectionImageURLs)) {
      await prisma.importRequest.update({
        where: { id: params.id },
        data: { inspectionImageURLs: body.inspectionImageURLs.map(String) },
      });
    }
    return NextResponse.json(withMongoId(row));
  }

  if (!isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (body.assignedDealerId !== undefined) {
    await assignDealerToImport(
      params.id,
      body.assignedDealerId ? String(body.assignedDealerId) : null
    );
  }

  const status = parseImportStatus(body.status);
  if (status) {
    await updateImportStatus(params.id, status, body.message);
  }

  const updated = await prisma.importRequest.update({
    where: { id: params.id },
    data: {
      notes: body.notes !== undefined ? String(body.notes) : undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      inspectionImageURLs: Array.isArray(body.inspectionImageURLs)
        ? body.inspectionImageURLs.map(String)
        : undefined,
    },
    include: importInclude,
  });

  return NextResponse.json(withMongoId(updated));
}
