import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole } from "@/lib/roles";
import { releaseEscrow, refundEscrow } from "@/lib/escrow-service";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { importId: string } }
) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action === "refund" ? "refund" : "release";

  try {
    const escrow =
      action === "refund"
        ? await refundEscrow(params.importId)
        : await releaseEscrow(params.importId);
    return NextResponse.json({ escrow });
  } catch (e) {
    console.error("Escrow action error:", e);
    return NextResponse.json({ error: "Escrow not found or invalid state" }, { status: 400 });
  }
}
