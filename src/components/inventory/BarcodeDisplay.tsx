"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/Field";

export function BarcodeDisplay({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height: 60,
      margin: 8,
    });
  }, [value]);

  function handleDownload() {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${value}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Print barcode — ${value}</title></head>
        <body style="display:flex;align-items:center;justify-content:center;margin:0;">
          ${svgData}
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div>
      {label && <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>}
      <div className="inline-block rounded-md border border-brand-700 bg-brand-800 p-3">
        <svg ref={svgRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="secondary" onClick={handlePrint}>
          Print
        </Button>
        <Button type="button" variant="secondary" onClick={handleDownload}>
          Download
        </Button>
      </div>
    </div>
  );
}
