/*
  Warnings:

  - You are about to drop the column `itemType` on the `InventoryItem` table. All the data in the column will be lost.

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
INSERT INTO "new_InventoryItem" ("barcode", "brand", "categoryId", "createdAt", "defaultPrice", "description", "id", "itemCode", "location", "minStock", "name", "notes", "status", "supplierId", "unit", "updatedAt") SELECT "barcode", "brand", "categoryId", "createdAt", "defaultPrice", "description", "id", "itemCode", "location", "minStock", "name", "notes", "status", "supplierId", "unit", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");
CREATE UNIQUE INDEX "InventoryItem_barcode_key" ON "InventoryItem"("barcode");
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
