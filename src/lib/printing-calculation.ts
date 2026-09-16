// The one authoritative printing-cost calculation (spec §56). No server-only
// dependencies — this same module is imported by the client (live preview
// in the calculator) and the server (final calculation before persisting),
// so the math is never duplicated or allowed to drift between the two.

export type ColourModeValue = "BW" | "COLOUR";
export type PrintSidesValue = "SINGLE" | "DOUBLE";

export interface CalculationInput {
  sides: PrintSidesValue;
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

/** Single-sided: pages × copies. Double-sided: CEILING(pages / 2) × copies. */
export function calculatePhysicalSheets(
  pages: number,
  copies: number,
  sides: PrintSidesValue
): number {
  const sheetsPerCopy = sides === "DOUBLE" ? Math.ceil(pages / 2) : pages;
  return sheetsPerCopy * copies;
}

export function calculatePrintingJob(input: CalculationInput): CalculationResult {
  const physicalSheets = calculatePhysicalSheets(input.pages, input.copies, input.sides);
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
