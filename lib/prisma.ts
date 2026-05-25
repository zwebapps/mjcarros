import { PrismaClient } from "@prisma/client";

if (!process.env.POSTGRES_PRISMA_URL && process.env.SKIP_DB_ENV_VALIDATION !== "1") {
  console.error(
    "[prisma] POSTGRES_PRISMA_URL is missing. Add to .env / .env.local, e.g. postgresql://postgres:postgres@127.0.0.1:5433/mjcarros?schema=public"
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
