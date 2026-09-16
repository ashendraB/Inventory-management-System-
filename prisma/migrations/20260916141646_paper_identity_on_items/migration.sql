/*
  Warnings:

  - You are about to drop the column `gsmId` on the `InventoryLot` table. All the data in the column will be lost.
  - You are about to drop the column `paperSizeId` on the `InventoryLot` table. All the data in the column will be lost.
  - You are about to drop the column `paperTypeId` on the `InventoryLot` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "unit" TEXT NOT NULL,
    "currentQuantity" REAL NOT NULL DEFAULT 0,
    "minStock" REAL NOT NULL DEFAULT 0,
    "paperSizeId" TEXT,
    "gsmId" TEXT,
    "paperTypeId" TEXT,
    "defaultPrice" DECIMAL NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_paperSizeId_fkey" FOREIGN KEY ("paperSizeId") REFERENCES "PaperSize" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GsmType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_paperTypeId_fkey" FOREIGN KEY ("paperTypeId") REFERENCES "PaperType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("barcode", "brand", "categoryId", "createdAt", "currentQuantity", "defaultPrice", "description", "id", "itemCode", "location", "minStock", "name", "notes", "status", "supplierId", "unit", "updatedAt") SELECT "barcode", "brand", "categoryId", "createdAt", "currentQuantity", "defaultPrice", "description", "id", "itemCode", "location", "minStock", "name", "notes", "status", "supplierId", "unit", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");
CREATE UNIQUE INDEX "InventoryItem_barcode_key" ON "InventoryItem"("barcode");
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");
CREATE TABLE "new_InventoryLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
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
    CONSTRAINT "InventoryLot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryLot" ("barcode", "costPerSheet", "createdAt", "currentQuantity", "id", "inventoryItemId", "isActiveStock", "location", "lotCode", "notes", "purchaseDate", "quantityPurchased", "status", "supplierId", "updatedAt") SELECT "barcode", "costPerSheet", "createdAt", "currentQuantity", "id", "inventoryItemId", "isActiveStock", "location", "lotCode", "notes", "purchaseDate", "quantityPurchased", "status", "supplierId", "updatedAt" FROM "InventoryLot";
DROP TABLE "InventoryLot";
ALTER TABLE "new_InventoryLot" RENAME TO "InventoryLot";
CREATE UNIQUE INDEX "InventoryLot_lotCode_key" ON "InventoryLot"("lotCode");
CREATE UNIQUE INDEX "InventoryLot_barcode_key" ON "InventoryLot"("barcode");
CREATE INDEX "InventoryLot_inventoryItemId_isActiveStock_idx" ON "InventoryLot"("inventoryItemId", "isActiveStock");
CREATE INDEX "InventoryLot_status_idx" ON "InventoryLot"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
