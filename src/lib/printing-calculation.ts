// The one authoritative printing-cost calculation (spec §56). No server-only
// dependencies — this same module is imported by the client (live preview
// in the calculator) and the server (final calculation before persisting),
// so the math is never duplicated or allowed to drift between the two.

export type ColourModeValue = "BW" | "COLOUR";
export type PrintSidesValue = "SINGLE" | "DOUBLE";
export type PrintLayoutValue = "NORMAL" | "BOOKLET";

export interface CalculationInput {
  sides: PrintSidesValue;
  layout: PrintLayoutValue;
  pages: number;
  copies: number;
  paperCostPerSheet: number;
  printingChargePerSheet: number;
  availableStock: number;
}

export interface CalculationResult {
  physicalSheets: number;
  paperCostPerSheet: number;
  totalPaperCost: number;
  printingChargePerSheet: number;
  totalPrintingCharge: number;
  totalCost: number;
  remainingStock: number;
  sufficientStock: boolean;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Normal layout: 1 page per side (single-sided = pages × copies,
 * double-sided = CEILING(pages / 2) × copies).
 * Booklet layout: 2 pages per side — a physical sheet double-sided and
 * folded down the middle holds 4 pages (e.g. two A4 pages imposed on each
 * side of an A3 sheet, folded into an A4-size booklet), or 2 pages if
 * single-sided. */
export function calculatePhysicalSheets(
  pages: number,
  copies: number,
  sides: PrintSidesValue,
  layout: PrintLayoutValue
): number {
  const pagesPerSide = layout === "BOOKLET" ? 2 : 1;
  const pagesPerSheet = sides === "DOUBLE" ? pagesPerSide * 2 : pagesPerSide;
  const sheetsPerCopy = Math.ceil(pages / pagesPerSheet);
  return sheetsPerCopy * copies;
}

export function calculatePrintingJob(input: CalculationInput): CalculationResult {
  const physicalSheets = calculatePhysicalSheets(input.pages, input.copies, input.sides, input.layout);
  const totalPaperCost = round2(physicalSheets * input.paperCostPerSheet);
  const totalPrintingCharge = round2(physicalSheets * input.printingChargePerSheet);
  const totalCost = round2(totalPaperCost + totalPrintingCharge);
  const remainingStock = input.availableStock - physicalSheets;

  return {
    physicalSheets,
    paperCostPerSheet: input.paperCostPerSheet,
    totalPaperCost,
    printingChargePerSheet: input.printingChargePerSheet,
    totalPrintingCharge,
    totalCost,
    remainingStock,
    sufficientStock: remainingStock >= 0,
  };
}
