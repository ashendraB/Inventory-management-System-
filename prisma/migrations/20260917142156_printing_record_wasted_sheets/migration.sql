-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrintingRecord" (
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
    "wastedSheets" INTEGER NOT NULL DEFAULT 0,
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
INSERT INTO "new_PrintingRecord" ("batchClass", "colourMode", "copies", "course", "createdAt", "date", "documentName", "gsmId", "id", "lecturerId", "lotId", "notes", "operatorId", "pages", "paperCostPerSheet", "paperSizeId", "paperTypeId", "physicalSheets", "priceRuleId", "printingChargePerSheet", "printingCode", "printingMachine", "sides", "subject", "totalCost", "totalPaperCost", "totalPrintingCharge") SELECT "batchClass", "colourMode", "copies", "course", "createdAt", "date", "documentName", "gsmId", "id", "lecturerId", "lotId", "notes", "operatorId", "pages", "paperCostPerSheet", "paperSizeId", "paperTypeId", "physicalSheets", "priceRuleId", "printingChargePerSheet", "printingCode", "printingMachine", "sides", "subject", "totalCost", "totalPaperCost", "totalPrintingCharge" FROM "PrintingRecord";
DROP TABLE "PrintingRecord";
ALTER TABLE "new_PrintingRecord" RENAME TO "PrintingRecord";
CREATE UNIQUE INDEX "PrintingRecord_printingCode_key" ON "PrintingRecord"("printingCode");
CREATE INDEX "PrintingRecord_lecturerId_idx" ON "PrintingRecord"("lecturerId");
CREATE INDEX "PrintingRecord_date_idx" ON "PrintingRecord"("date");
CREATE INDEX "PrintingRecord_lotId_idx" ON "PrintingRecord"("lotId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
