-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATOR', 'INVENTORY_OPERATOR', 'PRINTING_OPERATOR');

-- CreateEnum
CREATE TYPE "InventoryItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'FINISHED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('PURCHASE', 'PRINTING_USAGE', 'MANUAL_ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGED', 'STOCK_FINISHED');

-- CreateEnum
CREATE TYPE "LecturerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ColourMode" AS ENUM ('BW', 'COLOUR');

-- CreateEnum
CREATE TYPE "PrintSides" AS ENUM ('SINGLE', 'DOUBLE');

-- CreateEnum
CREATE TYPE "PrintLayout" AS ENUM ('NORMAL', 'BOOKLET');

-- CreateEnum
CREATE TYPE "PriceRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'GENERATED', 'ISSUED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "canManagePricing" BOOLEAN NOT NULL DEFAULT false,
    "canManageSettings" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GsmType" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GsmType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "unit" TEXT NOT NULL,
    "currentQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paperSizeId" TEXT,
    "gsmId" TEXT,
    "paperTypeId" TEXT,
    "defaultPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "location" TEXT,
    "status" "InventoryItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "expiryDate" TIMESTAMP(3),
    "warrantyExpiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityPurchased" DOUBLE PRECISION NOT NULL,
    "currentQuantity" DOUBLE PRECISION NOT NULL,
    "costPerSheet" DECIMAL(65,30) NOT NULL,
    "supplierId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActiveStock" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "lotId" TEXT,
    "quantityChange" DOUBLE PRECISION NOT NULL,
    "previousQuantity" DOUBLE PRECISION NOT NULL,
    "newQuantity" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "printingRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecturer" (
    "id" TEXT NOT NULL,
    "lecturerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "LecturerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingPriceRule" (
    "id" TEXT NOT NULL,
    "paperSizeId" TEXT NOT NULL,
    "gsmId" TEXT NOT NULL,
    "paperTypeId" TEXT NOT NULL,
    "colourMode" "ColourMode" NOT NULL,
    "sides" "PrintSides" NOT NULL,
    "chargePerSheet" DECIMAL(65,30) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "status" "PriceRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintingPriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingRecord" (
    "id" TEXT NOT NULL,
    "printingCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lecturerId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "subject" TEXT,
    "course" TEXT,
    "batchClass" TEXT,
    "paperSizeId" TEXT NOT NULL,
    "gsmId" TEXT NOT NULL,
    "paperTypeId" TEXT NOT NULL,
    "colourMode" "ColourMode" NOT NULL,
    "sides" "PrintSides" NOT NULL,
    "layout" "PrintLayout" NOT NULL DEFAULT 'NORMAL',
    "pages" INTEGER NOT NULL,
    "copies" INTEGER NOT NULL,
    "physicalSheets" INTEGER NOT NULL,
    "wastedSheets" INTEGER NOT NULL DEFAULT 0,
    "lotId" TEXT NOT NULL,
    "paperCostPerSheet" DECIMAL(65,30) NOT NULL,
    "totalPaperCost" DECIMAL(65,30) NOT NULL,
    "priceRuleId" TEXT,
    "printingChargePerSheet" DECIMAL(65,30) NOT NULL,
    "totalPrintingCharge" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "printingMachine" TEXT,
    "operatorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "billingMonth" INTEGER NOT NULL,
    "billingYear" INTEGER NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "totalPaperCost" DECIMAL(65,30) NOT NULL,
    "totalPrintingCharge" DECIMAL(65,30) NOT NULL,
    "otherCharges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "printingRecordId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PaperSize_name_key" ON "PaperSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GsmType_value_key" ON "GsmType"("value");

-- CreateIndex
CREATE UNIQUE INDEX "PaperType_name_key" ON "PaperType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCategory_name_key" ON "InventoryCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_barcode_key" ON "InventoryItem"("barcode");

-- CreateIndex
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");

-- CreateIndex
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLot_lotCode_key" ON "InventoryLot"("lotCode");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLot_barcode_key" ON "InventoryLot"("barcode");

-- CreateIndex
CREATE INDEX "InventoryLot_inventoryItemId_isActiveStock_idx" ON "InventoryLot"("inventoryItemId", "isActiveStock");

-- CreateIndex
CREATE INDEX "InventoryLot_status_idx" ON "InventoryLot"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransaction_printingRecordId_key" ON "StockTransaction"("printingRecordId");

-- CreateIndex
CREATE INDEX "StockTransaction_inventoryItemId_idx" ON "StockTransaction"("inventoryItemId");

-- CreateIndex
CREATE INDEX "StockTransaction_lotId_idx" ON "StockTransaction"("lotId");

-- CreateIndex
CREATE INDEX "StockTransaction_createdAt_idx" ON "StockTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_lecturerCode_key" ON "Lecturer"("lecturerCode");

-- CreateIndex
CREATE INDEX "Lecturer_status_idx" ON "Lecturer"("status");

-- CreateIndex
CREATE INDEX "PrintingPriceRule_paperSizeId_gsmId_paperTypeId_colourMode__idx" ON "PrintingPriceRule"("paperSizeId", "gsmId", "paperTypeId", "colourMode", "sides", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PrintingRecord_printingCode_key" ON "PrintingRecord"("printingCode");

-- CreateIndex
CREATE INDEX "PrintingRecord_lecturerId_idx" ON "PrintingRecord"("lecturerId");

-- CreateIndex
CREATE INDEX "PrintingRecord_date_idx" ON "PrintingRecord"("date");

-- CreateIndex
CREATE INDEX "PrintingRecord_lotId_idx" ON "PrintingRecord"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_lecturerId_billingMonth_billingYear_key" ON "Invoice"("lecturerId", "billingMonth", "billingYear");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItem_printingRecordId_key" ON "InvoiceItem"("printingRecordId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_printingRecordId_fkey" FOREIGN KEY ("printingRecordId") REFERENCES "PrintingRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingPriceRule" ADD CONSTRAINT "PrintingPriceRule_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingPriceRule" ADD CONSTRAINT "PrintingPriceRule_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingPriceRule" ADD CONSTRAINT "PrintingPriceRule_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_priceRuleId_fkey" FOREIGN KEY ("priceRuleId") REFERENCES "PrintingPriceRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRecord" ADD CONSTRAINT "PrintingRecord_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_printingRecordId_fkey" FOREIGN KEY ("printingRecordId") REFERENCES "PrintingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
