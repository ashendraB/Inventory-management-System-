-- Double-sided jobs: sheets that carry printing on one side only (the odd last
-- page of each copy) are billed at the one-sided price. Additive; existing
-- records keep 0 / NULL and their stored totals are untouched.

-- AlterTable
ALTER TABLE "PrintingRecord" ADD COLUMN     "singleSidedChargePerSheet" DECIMAL(65,30),
ADD COLUMN     "singleSidedSheets" INTEGER NOT NULL DEFAULT 0;