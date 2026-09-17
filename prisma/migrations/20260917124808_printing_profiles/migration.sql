-- CreateTable
CREATE TABLE "PrintingProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "colourMode" TEXT NOT NULL,
    "sides" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintingProfile_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintingProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintingProfile_name_key" ON "PrintingProfile"("name");

-- CreateIndex
CREATE INDEX "PrintingProfile_inventoryItemId_idx" ON "PrintingProfile"("inventoryItemId");
