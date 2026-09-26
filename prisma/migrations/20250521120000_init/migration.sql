-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'CUSTOMER', 'DEALER');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SEARCHING', 'INSPECTION', 'NEGOTIATION', 'PURCHASE', 'EXPORT', 'TRANSPORT', 'REGISTRATION', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Billboard" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "billboard" TEXT NOT NULL,
    "imageURL" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Billboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "category" TEXT NOT NULL,
    "billboard" TEXT NOT NULL,
    "billboardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "userId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Germany',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "seedKey" TEXT,
    "productCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageURLs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sold" BOOLEAN NOT NULL DEFAULT false,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "modelName" TEXT,
    "year" INTEGER,
    "stockQuantity" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "mileage" INTEGER,
    "condition" TEXT DEFAULT 'used',
    "vin" TEXT,
    "dealerId" TEXT,
    "availability" TEXT DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "orderNumber" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "userEmail" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "paymentMethod" TEXT,
    "paymentIntentId" TEXT,
    "transactionId" TEXT,
    "checkoutSessionId" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPage" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "cityLine" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "web" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Size" (
    "id" TEXT NOT NULL,
    "legacyMongoId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySize" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,

    CONSTRAINT "CategorySize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRequest" (
    "id" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'SEARCHING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Portugal',
    "preferredContact" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "budgetRange" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "yearMin" INTEGER,
    "yearMax" INTEGER,
    "mileageLimit" INTEGER,
    "bodyType" TEXT,
    "mustHaveFeatures" TEXT,
    "germanyOnly" BOOLEAN NOT NULL DEFAULT true,
    "maxImportTime" TEXT,
    "registrationAssist" BOOLEAN NOT NULL DEFAULT false,
    "deliveryLocation" TEXT,
    "totalBudget" TEXT,
    "financingRequired" BOOLEAN NOT NULL DEFAULT false,
    "downPayment" TEXT,
    "reservationDeposit" TEXT,
    "assignedDealerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportEvent" (
    "id" TEXT NOT NULL,
    "importRequestId" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyMongoId_key" ON "User"("legacyMongoId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Billboard_legacyMongoId_key" ON "Billboard"("legacyMongoId");
CREATE UNIQUE INDEX "Category_legacyMongoId_key" ON "Category"("legacyMongoId");
CREATE UNIQUE INDEX "Category_category_key" ON "Category"("category");
CREATE UNIQUE INDEX "Dealer_legacyMongoId_key" ON "Dealer"("legacyMongoId");
CREATE UNIQUE INDEX "Dealer_userId_key" ON "Dealer"("userId");
CREATE UNIQUE INDEX "Dealer_email_key" ON "Dealer"("email");
CREATE UNIQUE INDEX "Product_legacyMongoId_key" ON "Product"("legacyMongoId");
CREATE UNIQUE INDEX "Product_seedKey_key" ON "Product"("seedKey");
CREATE UNIQUE INDEX "Order_legacyMongoId_key" ON "Order"("legacyMongoId");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "OrderItem_legacyMongoId_key" ON "OrderItem"("legacyMongoId");
CREATE UNIQUE INDEX "ContactPage_legacyMongoId_key" ON "ContactPage"("legacyMongoId");
CREATE UNIQUE INDEX "Size_legacyMongoId_key" ON "Size"("legacyMongoId");
CREATE UNIQUE INDEX "Size_name_key" ON "Size"("name");
CREATE UNIQUE INDEX "CategorySize_categoryId_sizeId_key" ON "CategorySize"("categoryId", "sizeId");
CREATE UNIQUE INDEX "ProductSize_productId_sizeId_key" ON "ProductSize"("productId", "sizeId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_billboardId_fkey" FOREIGN KEY ("billboardId") REFERENCES "Billboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CategorySize" ADD CONSTRAINT "CategorySize_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategorySize" ADD CONSTRAINT "CategorySize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportRequest" ADD CONSTRAINT "ImportRequest_assignedDealerId_fkey" FOREIGN KEY ("assignedDealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportEvent" ADD CONSTRAINT "ImportEvent_importRequestId_fkey" FOREIGN KEY ("importRequestId") REFERENCES "ImportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
