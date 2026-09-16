-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "canManagePricing" BOOLEAN NOT NULL DEFAULT false,
    "canManageSettings" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaperSize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GsmType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PaperType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InventoryCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "itemType" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "unit" TEXT NOT NULL,
    "minStock" REAL NOT NULL DEFAULT 0,
    "defaultPrice" DECIMAL NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "paperSizeId" TEXT,
    "gsmId" TEXT,
    "paperTypeId" TEXT,
    "quantityPurchased" REAL NOT NULL,
    "currentQuantity" REAL NOT NULL,
    "costPerSheet" DECIMAL NOT NULL,
    "supplierId" TEXT,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActiveStock" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryLot_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryLot_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryLot_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryLot_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryLot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "lotId" TEXT,
    "quantityChange" REAL NOT NULL,
    "previousQuantity" REAL NOT NULL,
    "newQuantity" REAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "printingRecordId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransaction_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransaction_printingRecordId_fkey" FOREIGN KEY ("printingRecordId") REFERENCES "PrintingRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lecturer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lecturerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PrintingPriceRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperSizeId" TEXT NOT NULL,
    "gsmId" TEXT NOT NULL,
    "paperTypeId" TEXT NOT NULL,
    "colourMode" TEXT NOT NULL,
    "sides" TEXT NOT NULL,
    "chargePerSheet" DECIMAL NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrintingPriceRule_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingPriceRule_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingPriceRule_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrintingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printingCode" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lecturerId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "subject" TEXT,
    "course" TEXT,
    "batchClass" TEXT,
    "paperSizeId" TEXT NOT NULL,
    "gsmId" TEXT NOT NULL,
    "paperTypeId" TEXT NOT NULL,
    "colourMode" TEXT NOT NULL,
    "sides" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "copies" INTEGER NOT NULL,
    "physicalSheets" INTEGER NOT NULL,
    "lotId" TEXT NOT NULL,
    "paperCostPerSheet" DECIMAL NOT NULL,
    "totalPaperCost" DECIMAL NOT NULL,
    "priceRuleId" TEXT,
    "printingChargePerSheet" DECIMAL NOT NULL,
    "totalPrintingCharge" DECIMAL NOT NULL,
    "totalCost" DECIMAL NOT NULL,
    "printingMachine" TEXT,
    "operatorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintingRecord_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingRecord_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingRecord_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingRecord_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingRecord_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingRecord_priceRuleId_fkey" FOREIGN KEY ("priceRuleId") REFERENCES "PrintingPriceRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PrintingRecord_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "billingMonth" INTEGER NOT NULL,
    "billingYear" INTEGER NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalPaperCost" DECIMAL NOT NULL,
    "totalPrintingCharge" DECIMAL NOT NULL,
    "otherCharges" DECIMAL NOT NULL DEFAULT 0,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "printingRecordId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_printingRecordId_fkey" FOREIGN KEY ("printingRecordId") REFERENCES "PrintingRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
CREATE INDEX "InventoryLot_inventoryItemId_idx" ON "InventoryLot"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InventoryLot_paperSizeId_gsmId_paperTypeId_isActiveStock_idx" ON "InventoryLot"("paperSizeId", "gsmId", "paperTypeId", "isActiveStock");

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
CREATE INDEX "PrintingPriceRule_paperSizeId_gsmId_paperTypeId_colourMode_sides_status_idx" ON "PrintingPriceRule"("paperSizeId", "gsmId", "paperTypeId", "colourMode", "sides", "status");

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
