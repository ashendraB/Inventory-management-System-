import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";

export default function BarcodesPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Barcode Reader</h1>
        <p className="text-sm text-slate-400">
          Scan or type an item or stock lot barcode to look it up. USB barcode scanners work like
          a keyboard, so just click into the field and scan — no special setup needed. You&apos;ll
          see current stock, cost per sheet, and status, with options to reprint the barcode or
          set a stock lot as active. New items and lots get their barcode automatically when
          created, so there&apos;s nothing to generate here by hand.
        </p>
      </div>
      <BarcodeScanner />
    </div>
  );
}
