"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Field";

/**
 * Lets the operator attach the actual document being printed, shows it
 * inline on the page, and prints it from there. Page count is auto-detected
 * client-side for PDFs only — PDF is the one common format with a real,
 * unambiguous page count baked into the file; Word documents don't store
 * one (it depends on fonts/margins/printer at render time), so for those we
 * ask the operator to enter it manually.
 *
 * Printing calls `.print()` on the *embedded preview* shown on this page —
 * not `window.open()` to a new tab. A new tab is a new browsing context, and
 * browsers only allow opening one as a direct result of a user click within
 * the same tick; by the time an async save request resolves, that window
 * has closed and the browser silently blocks it as an unrequested popup.
 * Printing the embedded content instead doesn't create a new window at all,
 * so there's nothing for a popup blocker to catch — the browser just shows
 * its normal print dialog for the visible PDF, same as Ctrl+P.
 */
export interface DocumentUploadHandle {
  print: () => void;
}

function stripExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function DocumentUpload({
  onPagesDetected,
  onFileSelected,
  onReadyChange,
  ref,
}: {
  onPagesDetected: (pages: number) => void;
  /** Fired with the file's name (extension stripped) whenever a new file is
   * chosen, so the caller can auto-fill Document Name — still just a plain
   * text field afterward, so the operator can edit or clear it freely. */
  onFileSelected?: (name: string) => void;
  onReadyChange?: (ready: boolean) => void;
  ref?: React.Ref<DocumentUploadHandle>;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const printable = !unsupported && !!fileUrl && previewReady;

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

  const handlePrint = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      toast.error("The preview hasn't finished loading yet — try again in a moment.");
      return;
    }
    win.focus();
    win.print();
  }, []);

  useImperativeHandle(ref, () => ({ print: handlePrint }), [handlePrint]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setDetectedPages(null);
    setUnsupported(false);
    setPreviewReady(false);
    setFileName(file.name);
    onFileSelected?.(stripExtension(file.name));

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
    setPreviewReady(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Document to Print</h2>
      <p className="mb-3 text-xs text-slate-500">
        Optional — attach the file to auto-fill the page count and Document Name (from the
        filename — edit or clear it below if you need to) and preview it below. The Print button
        prints this preview directly (your browser&apos;s own print dialog) and saves the record
        at the same time.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-900 hover:file:bg-brand-100"
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
          {!unsupported && fileUrl && !previewReady && (
            <p className="text-slate-400">Loading preview...</p>
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

      {!unsupported && fileUrl && (
        <iframe
          ref={iframeRef}
          src={fileUrl}
          title="Document preview"
          onLoad={() => setPreviewReady(true)}
          className="mt-4 h-80 w-full rounded-md border border-slate-200"
        />
      )}
    </div>
  );
}
