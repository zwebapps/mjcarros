import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId?: string | null;
  message: string;
  type?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId ?? null,
      message: params.message,
      type: params.type ?? "info",
    },
  });
}

export async function notifyAdmins(message: string, type = "info") {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      createNotification({ userId: a.id, message, type })
    )
  );
}

export async function notifyDealerUser(
  dealerId: string,
  message: string,
  type = "info"
) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: { userId: true },
  });
  if (dealer?.userId) {
    await createNotification({ userId: dealer.userId, message, type });
  }
}
