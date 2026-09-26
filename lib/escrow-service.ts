import { EscrowStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateImportStatus } from "@/lib/import-service";
import { notifyAdmins, createNotification } from "@/lib/platform-notify";

export async function createEscrowForImport(params: {
  importRequestId: string;
  amount: number;
  currency?: string;
  stripeSessionId?: string;
  stripePaymentId?: string;
}) {
  const escrow = await prisma.escrow.upsert({
    where: { importRequestId: params.importRequestId },
    create: {
      importRequestId: params.importRequestId,
      amount: params.amount,
      currency: params.currency ?? "eur",
      status: EscrowStatus.HELD,
      stripeSessionId: params.stripeSessionId,
      stripePaymentId: params.stripePaymentId,
    },
    update: {
      amount: params.amount,
      stripeSessionId: params.stripeSessionId,
      stripePaymentId: params.stripePaymentId,
      status: EscrowStatus.HELD,
    },
  });

  await prisma.paymentRecord.create({
    data: {
      stripeId: params.stripePaymentId ?? params.stripeSessionId,
      amount: params.amount,
      currency: params.currency ?? "eur",
      status: "held",
      type: "import_deposit",
      importRequestId: params.importRequestId,
    },
  });

  await updateImportStatus(params.importRequestId, "PURCHASE", "Deposit held in escrow");
  await notifyAdmins(
    `Escrow held €${params.amount} for import ${params.importRequestId}`,
    "payment"
  );

  return escrow;
}

export async function releaseEscrow(importRequestId: string) {
  const escrow = await prisma.escrow.update({
    where: { importRequestId },
    data: { status: EscrowStatus.RELEASED },
  });

  await prisma.paymentRecord.create({
    data: {
      amount: escrow.amount,
      currency: escrow.currency,
      status: "released",
      type: "import_deposit",
      importRequestId,
      stripeId: escrow.stripePaymentId,
    },
  });

  await updateImportStatus(importRequestId, "DELIVERED", "Escrow released to dealer");
  return escrow;
}

export async function refundEscrow(importRequestId: string) {
  const escrow = await prisma.escrow.update({
    where: { importRequestId },
    data: { status: EscrowStatus.REFUNDED },
  });

  await prisma.paymentRecord.create({
    data: {
      amount: escrow.amount,
      currency: escrow.currency,
      status: "refunded",
      type: "import_deposit",
      importRequestId,
      stripeId: escrow.stripePaymentId,
    },
  });

  await updateImportStatus(importRequestId, "CANCELLED", "Escrow refunded");
  return escrow;
}
