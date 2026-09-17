"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Field";

/**
 * Lets the operator attach the actual document being printed. Page count is
 * auto-detected client-side for PDFs only — PDF is the one common format
 * with a real, unambiguous page count baked into the file; Word documents
 * don't store one (it depends on fonts/margins/printer at render time), so
 * for those we ask the operator to enter it manually.
 *
 * "Print Document" opens the browser's native print dialog for the file —
 * no web page can silently send a job to a printer (that's a deliberate
 * browser security restriction), so this is the same thing Ctrl+P does,
 * just one click away and scoped to the uploaded file instead of the page.
 */
export function DocumentUpload({
  onPagesDetected,
}: {
  onPagesDetected: (pages: number) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs must be revoked or they leak memory for the life of the tab.
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setDetectedPages(null);
    setUnsupported(false);
    setIframeReady(false);
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

  function handlePrint() {
    const iframe = iframeRef.current;
    try {
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch {
      // fall through to the new-tab fallback below
    }
    if (fileUrl) window.open(fileUrl, "_blank");
  }

  function handleClear() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileName(null);
    setFileUrl(null);
    setDetectedPages(null);
    setUnsupported(false);
    setIframeReady(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Document to Print</h2>
      <p className="mb-3 text-xs text-slate-500">
        Optional — attach the file to auto-fill the page count and print it from here.
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
              Automatic page count only works for PDF files. Please enter the page count
              manually below, and use your own Word/PDF viewer to print this file.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!unsupported && fileUrl && (
              <Button type="button" variant="secondary" onClick={handlePrint} disabled={!iframeReady}>
                {iframeReady ? "Print Document" : "Loading preview..."}
              </Button>
            )}
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

      {!unsupported && fileUrl && (
        <iframe
          ref={iframeRef}
          src={fileUrl}
          title="Document preview"
          onLoad={() => setIframeReady(true)}
          className="mt-4 h-64 w-full rounded-md border border-slate-200"
        />
      )}
    </div>
  );
}
