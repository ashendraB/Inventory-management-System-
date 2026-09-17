"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Field";

/**
 * Lets the operator attach the actual document being printed. Page count is
 * auto-detected client-side for PDFs only — PDF is the one common format
 * with a real, unambiguous page count baked into the file; Word documents
 * don't store one (it depends on fonts/margins/printer at render time), so
 * for those we ask the operator to enter it manually.
 *
 * Printing itself is triggered by the parent form (via the exposed `print`
 * handle) at the moment the printing record is saved — see
 * PrintingCalculatorForm's "Submit & Print" button. `print()` opens the PDF
 * in a new browser tab using its native PDF viewer (Edge/Chrome both ship
 * one), which has its own Print button and responds to Ctrl+P — that native
 * viewer's print flow is more consistent than scripting `.print()` on an
 * embedded iframe, which routes through a stripped-down plugin UI instead.
 */
export interface DocumentUploadHandle {
  print: () => void;
}

export function DocumentUpload({
  onPagesDetected,
  onReadyChange,
  ref,
}: {
  onPagesDetected: (pages: number) => void;
  onReadyChange?: (ready: boolean) => void;
  ref?: React.Ref<DocumentUploadHandle>;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const printable = !unsupported && !!fileUrl;

  // Object URLs must be revoked or they leak memory for the life of the tab.
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  useEffect(() => {
    onReadyChange?.(printable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printable]);

  useImperativeHandle(
    ref,
    () => ({
      print: () => {
        if (!fileUrl) return;
        const win = window.open(fileUrl, "_blank");
        if (!win) {
          // Popup blocked (browser setting/extension) — the record still
          // saves either way, so just point them at the manual fallback.
          toast.error('Pop-up blocked. Click "Open in New Tab" below to print the document.');
        }
      },
    }),
    [fileUrl]
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setDetectedPages(null);
    setUnsupported(false);
    setFileName(file.name);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    if (!isPdf) {
      setUnsupported(true);
      return;
    }

    setLoading(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      // Served from public/ (kept in sync with the installed pdfjs-dist
      // version by the postinstall script) rather than resolved through the
      // bundler — pdf.js requires the worker version to exactly match the
      // API version, and a plain static file sidesteps bundler asset quirks.
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setDetectedPages(doc.numPages);
      onPagesDetected(doc.numPages);
      toast.success(`Detected ${doc.numPages} page${doc.numPages === 1 ? "" : "s"}`);
    } catch {
      toast.error("Could not read this PDF's page count — enter it manually below.");
      setUnsupported(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileName(null);
    setFileUrl(null);
    setDetectedPages(null);
    setUnsupported(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Document to Print</h2>
      <p className="mb-3 text-xs text-slate-500">
        Optional — attach the file to auto-fill the page count. When attached, the Submit
        button below also opens it in a new tab for printing.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
      />

      {fileName && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-slate-700">{fileName}</p>
          {loading && <p className="text-slate-400">Reading page count...</p>}
          {detectedPages !== null && (
            <p className="text-emerald-700">
              Detected {detectedPages} page{detectedPages === 1 ? "" : "s"} — filled into
              &quot;Number of Pages&quot; below. You can still edit it if needed.
            </p>
          )}
          {unsupported && (
            <p className="text-amber-700">
              Automatic page count and in-app printing only work for PDF files. Please enter
              the page count manually below, and print this file from Word/your PDF viewer.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Open in New Tab
              </a>
            )}
            <Button type="button" variant="secondary" onClick={handleClear}>
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
