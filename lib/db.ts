import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Only create Prisma client if NOT building
export const db: PrismaClient | undefined =
  process.env.SKIP_DB_BUILD === "true"
    ? undefined
    : globalThis.prisma || new PrismaClient();

if (process.env.SKIP_DB_BUILD !== "true" && process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
