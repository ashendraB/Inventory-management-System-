"use client";

import { useEffect, useState } from "react";
import {
  CalculationBreakdown,
  type CalculationBreakdownProps,
} from "@/components/printing/CalculationBreakdown";

/** "How calculated" button for a Printing Records row — opens the step-by-step
 * working for that job in a pop-up, so it can be checked without leaving the
 * list. */
export function CalculationButton({
  printingCode,
  documentName,
  lecturerName,
  ...breakdown
}: CalculationBreakdownProps & {
  printingCode: string;
  documentName: string;
  lecturerName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap text-gold-400 hover:underline"
      >
        How calculated
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`How ${printingCode} was calculated`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-brand-700 bg-brand-800 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-semibold text-gold-400">{printingCode}</p>
                <p className="truncate text-sm text-slate-200">{documentName}</p>
                <p className="text-xs text-slate-400">{lecturerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md border border-white/20 px-2.5 py-1 text-sm text-slate-200 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <CalculationBreakdown {...breakdown} />
          </div>
        </div>
      )}
    </>
  );
}
