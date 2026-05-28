-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED');

-- AlterTable
ALTER TABLE "ImportRequest" ADD COLUMN "userId" TEXT;
ALTER TABLE "ImportRequest" ADD COLUMN "inspectionImageURLs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "importRequestId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "stripeId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "orderId" TEXT,
    "importRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_importRequestId_key" ON "Escrow"("importRequestId");

-- AddForeignKey
ALTER TABLE "ImportRequest" ADD CONSTRAINT "ImportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_importRequestId_fkey" FOREIGN KEY ("importRequestId") REFERENCES "ImportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_importRequestId_fkey" FOREIGN KEY ("importRequestId") REFERENCES "ImportRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
