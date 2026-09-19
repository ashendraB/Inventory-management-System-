"use client";

import { useState } from "react";
import toast from "react-hot-toast";

/** Loads the printing record's saved PDF into a hidden iframe (only once
 * clicked — never fetched up front for every row) and opens the browser's
 * print dialog on it, same mechanism as the original Print button on the
 * Printing Calculator. */
export function ReprintButton({
  recordId,
  className = "text-gold-400 hover:underline",
}: {
  recordId: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  function handleClick() {
    setSrc(`/api/printing/records/${recordId}/document`);
  }

  function handleLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    const win = e.currentTarget.contentWindow;
    if (!win) {
      toast.error("Could not load the document.");
      return;
    }
    win.focus();
    win.print();
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        Reprint
      </button>
      {src && (
        <iframe
          src={src}
          title="Reprint document"
          onLoad={handleLoad}
          style={{ position: "absolute", width: 0, height: 0, border: "none" }}
        />
      )}
    </>
  );
}
