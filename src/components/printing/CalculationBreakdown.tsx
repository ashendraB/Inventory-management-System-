import { formatCurrency } from "@/lib/format";
import { describeSheetMath } from "@/lib/printing-calculation";

export interface CalculationBreakdownProps {
  pages: number;
  copies: number;
  sides: "SINGLE" | "DOUBLE";
  layout: "NORMAL" | "BOOKLET";
  wastedSheets: number;
  // Double-sided jobs: sheets with printing on one side only (the odd last
  // page of each copy), billed at the one-sided price. 0 / null otherwise.
  singleSidedSheets: number;
  singleSidedChargePerSheet: number | null;
  // The rates and totals saved with the record — never recomputed from
  // today's prices, so this always matches what was actually billed.
  paperCostPerSheet: number;
  printingChargePerSheet: number;
  totalPaperCost: number;
  totalPrintingCharge: number;
  totalCost: number;
}

/** Step-by-step working for how a printing record's total was reached: prints,
 * sheets per copy (from sides/layout), physical sheets, paper cost, printing
 * charge, total. The sheet math comes from the same function the calculator
 * uses, so it can't drift from the real calculation. */
export function CalculationBreakdown(props: CalculationBreakdownProps) {
  const { pages, copies, sides, layout, wastedSheets, singleSidedSheets } = props;
  const math = describeSheetMath(pages, copies, sides, layout);
  const copyWord = copies === 1 ? "copy" : "copies";
  const mainSheets = math.physicalSheets - singleSidedSheets;
  // Records made before the round-up rule was added have un-rounded prices.
  const roundedUp = Math.abs((props.paperCostPerSheet + props.printingChargePerSheet) * 2 % 1) < 1e-6;

  return (
    <div className="rounded-lg border border-gold-500/30 bg-white/5 p-4">
      <h2 className="mb-3 text-sm font-semibold text-gold-400">How the total is calculated</h2>
      <ol className="space-y-3 text-sm text-slate-300">
        <Step n={1} title="Total prints">
          {pages.toLocaleString()} pages × {copies.toLocaleString()} {copyWord} ={" "}
          <b className="text-white">{math.totalPrints.toLocaleString()} prints</b>
        </Step>
        <Step n={2} title="Sheets of paper per copy">
          {sides === "DOUBLE" ? "Double-sided" : "Single-sided"}
          {layout === "BOOKLET" ? " booklet" : ""} fits{" "}
          <b className="text-white">
            {math.pagesPerSheet} page{math.pagesPerSheet === 1 ? "" : "s"} per sheet
          </b>
          , so {pages.toLocaleString()} ÷ {math.pagesPerSheet} (rounded up) ={" "}
          <b className="text-white">{math.sheetsPerCopy.toLocaleString()} sheets per copy</b>
        </Step>
        <Step n={3} title="Physical sheets used">
          {math.sheetsPerCopy.toLocaleString()} sheets × {copies.toLocaleString()} {copyWord} ={" "}
          <b className="text-white">{math.physicalSheets.toLocaleString()} sheets</b>
          {wastedSheets > 0 && <> (wasted sheets are tracked separately and not billed)</>}
          {singleSidedSheets > 0 && (
            <p className="mt-1 text-slate-400">
              {singleSidedSheets.toLocaleString()} of them carry printing on one side only (the odd
              last page of each copy), so they are charged at the one-sided price.
            </p>
          )}
        </Step>
        <Step n={4} title="Paper cost">
          {math.physicalSheets.toLocaleString()} sheets × {formatCurrency(props.paperCostPerSheet)} ={" "}
          <b className="text-white">{formatCurrency(props.totalPaperCost)}</b>
        </Step>
        <Step n={5} title="Printing charge">
          {singleSidedSheets > 0 && props.singleSidedChargePerSheet !== null ? (
            <>
              {mainSheets.toLocaleString()} {sides === "DOUBLE" ? "double-sided " : ""}sheets ×{" "}
              {formatCurrency(props.printingChargePerSheet)} + {singleSidedSheets.toLocaleString()}{" "}
              one-sided sheets × {formatCurrency(props.singleSidedChargePerSheet)} ={" "}
            </>
          ) : (
            <>
              {math.physicalSheets.toLocaleString()} sheets ×{" "}
              {formatCurrency(props.printingChargePerSheet)} ={" "}
            </>
          )}
          <b className="text-white">{formatCurrency(props.totalPrintingCharge)}</b>
          {roundedUp && (
            <p className="mt-1 text-slate-400">
              Each sheet&apos;s price (paper + printing) is rounded up to the next Rs. 0.50, so the
              charge per sheet includes that small round-up.
            </p>
          )}
        </Step>        <Step n={6} title="Total">
          {formatCurrency(props.totalPaperCost)} + {formatCurrency(props.totalPrintingCharge)} ={" "}
          <b className="text-gold-400">{formatCurrency(props.totalCost)}</b>
        </Step>
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Rates shown are the ones saved with this job, so later price changes don&apos;t alter it.
      </p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-brand-900">
        {n}
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
        <p>{children}</p>
      </div>
    </li>
  );
}
