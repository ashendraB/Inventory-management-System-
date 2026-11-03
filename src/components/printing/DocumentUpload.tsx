"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Field";
import { stampBarcode } from "@/lib/stamp-barcode";

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
  /** Saves the attached PDF to the computer (so it can be opened and printed
   * in Adobe Acrobat). */
  download: () => void;
  /** The attached file, but only when it's a supported, readable PDF — null
   * otherwise (no file, or an unsupported format like .docx). Used to save
   * the document alongside the printing record for "Reprint" later. */
  getPdfFile: () => File | null;
  /** Replaces what is printed/downloaded/previewed with a copy of the PDF that
   * has a barcode for `code` (the printing ID) on page 1, and resolves once
   * the preview has reloaded. The attached original is untouched — it is what
   * gets saved for Reprint, and what a later barcode is stamped onto. Rejects
   * if the PDF can't be modified; the caller then prints it as it is.
   * Pass null to print WITHOUT a barcode: if an earlier job left a stamped copy
   * in the preview, this puts the plain original back. */
  applyBarcode: (code: string | null) => Promise<void>;
}

function stripExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function DocumentUpload({
  onPagesDetected,
  onFileSelected,
  onReadyChange,
  initialDocument,
  ref,
}: {
  onPagesDetected: (pages: number) => void;
  /** Fired with the file's name (extension stripped) whenever a new file is
   * chosen, so the caller can auto-fill Document Name — still just a plain
   * text field afterward, so the operator can edit or clear it freely. */
  onFileSelected?: (name: string) => void;
  onReadyChange?: (ready: boolean) => void;
  /** A saved PDF to load straight away, as if the operator had just chosen it
   * (used when reprinting a stored document). */
  initialDocument?: { url: string; name: string };
  ref?: React.Ref<DocumentUploadHandle>;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadWaiter = useRef<(() => void) | null>(null);
  // The printing ID stamped on the current preview, if any.
  const [barcodeCode, setBarcodeCode] = useState<string | null>(null);

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

  const handleDownload = useCallback(() => {
    if (!fileUrl || !fileName) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [fileUrl, fileName]);

  const applyBarcode = useCallback(
    async (code: string | null) => {
      if (!file || unsupported) throw new Error("No PDF to stamp.");
      // No barcode wanted: nothing to do unless a stamped copy from an earlier
      // job is still showing, in which case put the plain original back.
      if (code === null && !barcodeCode) return;

      let blob: Blob;
      let settleMs: number;
      if (code === null) {
        blob = file;
        settleMs = 1500;
      } else {
        const stamped = await stampBarcode(await file.arrayBuffer(), code);
        blob = new Blob([stamped as BlobPart], { type: "application/pdf" });
        settleMs = 1500 + Math.min(3500, Math.round((stamped.length / 1_048_576) * 500));
      }
      const url = URL.createObjectURL(blob);
      // Wait for the preview iframe to load the new copy so printing it
      // immediately afterwards prints the right file (the old URL is revoked
      // by the effect above once fileUrl changes).
      const loaded = new Promise<void>((resolve) => {
        loadWaiter.current = resolve;
      });
      setPreviewReady(false);
      setBarcodeCode(code);
      setFileUrl(url);
      await Promise.race([loaded, new Promise<void>((resolve) => setTimeout(resolve, 10_000))]);
      loadWaiter.current = null;
      // The iframe's load event fires when the PDF viewer page is up, not when
      // the document inside it has been drawn; printing straight away can print
      // a blank or the previous copy. Give the viewer time (more for big files).
      await new Promise<void>((resolve) => setTimeout(resolve, settleMs));
    },
    [file, unsupported, barcodeCode]
  );
  useImperativeHandle(
    ref,
    () => ({
      print: handlePrint,
      download: handleDownload,
      getPdfFile: () => (!unsupported && file ? file : null),
      applyBarcode,
    }),
    [handlePrint, handleDownload, applyBarcode, unsupported, file]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) void loadFile(selected);
  }

  async function loadFile(selected: File) {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setDetectedPages(null);
    setUnsupported(false);
    setPreviewReady(false);
    setBarcodeCode(null);
    setFileName(selected.name);
    setFile(selected);
    onFileSelected?.(stripExtension(selected.name));

    const isPdf = selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    const url = URL.createObjectURL(selected);
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
      const arrayBuffer = await selected.arrayBuffer();
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

  const initialLoaded = useRef(false);
  useEffect(() => {
    if (!initialDocument || initialLoaded.current) return;
    initialLoaded.current = true;
    (async () => {
      try {
        const res = await fetch(initialDocument.url);
        if (!res.ok) throw new Error("not found");
        const blob = await res.blob();
        await loadFile(new File([blob], initialDocument.name, { type: "application/pdf" }));
      } catch {
        toast.error("Could not load the saved PDF — attach the file again to continue.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClear() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileName(null);
    setFile(null);
    setFileUrl(null);
    setDetectedPages(null);
    setUnsupported(false);
    setPreviewReady(false);
    setBarcodeCode(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-gold-400">Document to Print</h2>
      <p className="mb-3 text-xs text-slate-400">
        Optional — attach the file to auto-fill the page count and Document Name (from the
        filename — edit or clear it below if you need to) and preview it below. The Print button
        saves the job, adds its barcode (the printing ID) to page 1 of the PDF unless you untick
        the barcode box next to the Print button, and then opens your browser&apos;s print dialog.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-900 hover:file:bg-brand-100"
      />

      {fileName && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-slate-200">{fileName}</p>
          {loading && <p className="text-slate-400">Reading page count...</p>}
          {detectedPages !== null && (
            <p className="text-emerald-400">
              Detected {detectedPages} page{detectedPages === 1 ? "" : "s"} — filled into
              &quot;Number of Pages&quot; below. You can still edit it if needed.
            </p>
          )}
          {barcodeCode && (
            <p className="text-emerald-400">
              Barcode <strong>{barcodeCode}</strong> was added to the bottom-right corner of page 1
              (shown in the preview below).
            </p>
          )}
          {unsupported && (
            <p className="text-amber-400">
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
                className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
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
          // Once a barcode is stamped, show the whole of page 1 so it is visible.
          src={barcodeCode ? `${fileUrl}#page=1&view=Fit` : fileUrl}
          title="Document preview"
          onLoad={() => {
            setPreviewReady(true);
            loadWaiter.current?.();
          }}
          className={`mt-4 w-full rounded-md border border-white/10 ${barcodeCode ? "h-[600px]" : "h-80"}`}
        />
      )}
    </div>
  );
}
