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
  /** Price-rule charge per sheet for the job's own sides setting. */
  printingChargePerSheet: number;
  /** Double-sided jobs only: the price-rule charge for a sheet printed on one
   * side only (the odd last page of a copy). When missing, those sheets are
   * charged at printingChargePerSheet. */
  singleSidedChargePerSheet?: number | null;
  availableStock: number;
}

export interface CalculationResult {
  physicalSheets: number;
  /** Sheets of a double-sided job that carry printing on one side only. */
  singleSidedSheets: number;
  paperCostPerSheet: number;
  /** Printing charge per sheet actually applied — the price-rule charge plus
   * whatever the sheet price was rounded up by (see sheetPrice). */
  printingChargePerSheet: number;
  /** Same, for the one-side-only sheets; null when there are none. */
  singleSidedChargePerSheet: number | null;
  totalPaperCost: number;
  totalPrintingCharge: number;
  totalCost: number;
  remainingStock: number;
  sufficientStock: boolean;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** A sheet's selling price (paper + printing) is rounded UP to the next
 * Rs. 0.50 — e.g. 6.30 -> 6.50, 10.30 -> 10.50, 20.60 -> 21.00. Done in whole
 * cents so floating-point noise can't push an exact .50 up a step. */
export function sheetPrice(paperCostPerSheet: number, chargePerSheet: number): number {
  const cents = Math.round((paperCostPerSheet + chargePerSheet) * 100);
  return (Math.ceil(cents / 50) * 50) / 100;
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
  return describeSheetMath(pages, copies, sides, layout).physicalSheets;
}

/** The same sheet math as calculatePhysicalSheets, but with every
 * intermediate number exposed so a record can show its working. Single
 * source of truth — calculatePhysicalSheets just returns the last step.
 *
 * singleSidedSheets: in a double-sided job, the last sheet of each copy is
 * only half used when the pages don't fill it (e.g. page 25 of 25 sits alone
 * on its sheet). That sheet has printing on one side only, so it is billed at
 * the cheaper one-sided price. If the leftover pages need both sides (e.g. 3
 * leftover pages on a 4-page booklet sheet) it counts as a normal double-sided
 * sheet. Single-sided jobs have no such sheets. */
export function describeSheetMath(
  pages: number,
  copies: number,
  sides: PrintSidesValue,
  layout: PrintLayoutValue
) {
  const pagesPerSide = layout === "BOOKLET" ? 2 : 1;
  const pagesPerSheet = sides === "DOUBLE" ? pagesPerSide * 2 : pagesPerSide;
  const sheetsPerCopy = Math.ceil(pages / pagesPerSheet);
  const leftover = pages % pagesPerSheet;
  const singleSidedPerCopy =
    sides === "DOUBLE" && leftover > 0 && leftover <= pagesPerSide ? 1 : 0;
  return {
    totalPrints: pages * copies,
    pagesPerSheet,
    sheetsPerCopy,
    physicalSheets: sheetsPerCopy * copies,
    singleSidedSheetsPerCopy: singleSidedPerCopy,
    singleSidedSheets: singleSidedPerCopy * copies,
  };
}

export function calculatePrintingJob(input: CalculationInput): CalculationResult {
  const math = describeSheetMath(input.pages, input.copies, input.sides, input.layout);
  const { physicalSheets, singleSidedSheets } = math;
  const paper = input.paperCostPerSheet;

  // Per-sheet printing charge actually applied: whatever makes the sheet's
  // price (paper + printing) land on the rounded-up Rs. 0.50 figure.
  const mainCharge = round2(sheetPrice(paper, input.printingChargePerSheet) - paper);
  const singleCharge =
    singleSidedSheets > 0
      ? round2(
          sheetPrice(paper, input.singleSidedChargePerSheet ?? input.printingChargePerSheet) - paper
        )
      : null;

  const totalPaperCost = round2(physicalSheets * paper);
  const totalPrintingCharge = round2(
    (physicalSheets - singleSidedSheets) * mainCharge + singleSidedSheets * (singleCharge ?? 0)
  );
  const totalCost = round2(totalPaperCost + totalPrintingCharge);
  const remainingStock = input.availableStock - physicalSheets;

  return {
    physicalSheets,
    singleSidedSheets,
    paperCostPerSheet: paper,
    printingChargePerSheet: mainCharge,
    singleSidedChargePerSheet: singleCharge,
    totalPaperCost,
    totalPrintingCharge,
    totalCost,
    remainingStock,
    sufficientStock: remainingStock >= 0,
  };
}
