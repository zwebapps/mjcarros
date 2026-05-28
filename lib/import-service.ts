import { ImportStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyDealerUser } from "@/lib/platform-notify";

const VALID_STATUSES = new Set<string>(Object.values(ImportStatus));

export async function updateImportStatus(
  importRequestId: string,
  status: ImportStatus,
  message?: string
) {
  const row = await prisma.importRequest.update({
    where: { id: importRequestId },
    data: { status },
    include: { dealer: true },
  });

  await prisma.importEvent.create({
    data: {
      importRequestId,
      status,
      message: message ?? `Status → ${status}`,
    },
  });

  await notifyAdmins(
    `Import ${row.fullName}: ${status}`,
    "import"
  );

  if (row.assignedDealerId) {
    await notifyDealerUser(
      row.assignedDealerId,
      `Lead ${row.fullName} is now ${status}`,
      "import"
    );
  }

  return row;
}

export async function assignDealerToImport(
  importRequestId: string,
  dealerId: string | null
) {
  const row = await prisma.importRequest.update({
    where: { id: importRequestId },
    data: { assignedDealerId: dealerId },
    include: { dealer: true },
  });

  if (dealerId) {
    await prisma.importEvent.create({
      data: {
        importRequestId,
        status: row.status,
        message: `Dealer assigned: ${row.dealer?.companyName ?? dealerId}`,
      },
    });
    await notifyDealerUser(
      dealerId,
      `New import lead assigned: ${row.fullName}`,
      "dealer"
    );
    await notifyAdmins(
      `Dealer assigned to ${row.fullName}`,
      "dealer"
    );
  }

  return row;
}

export function parseImportStatus(value: unknown): ImportStatus | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase() as ImportStatus;
  return VALID_STATUSES.has(upper) ? upper : null;
}

export const importInclude = {
  dealer: true,
  events: { orderBy: { createdAt: "desc" as const }, take: 20 },
  escrow: true,
  user: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.ImportRequestInclude;
