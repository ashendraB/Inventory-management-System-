import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";

export default function BarcodesPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Barcode Generator</h1>
        <p className="text-sm text-slate-500">
          Every inventory item and stock lot gets a unique barcode automatically when it&apos;s
          created — there&apos;s nothing to generate by hand. Scan or type a barcode below to look
          it up, preview it, reprint it, or set a stock lot active.
        </p>
      </div>
      <BarcodeScanner />
    </div>
  );
}
