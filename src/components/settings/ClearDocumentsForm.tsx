"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, Button } from "@/components/ui/Field";

export function ClearDocumentsForm() {
  const [before, setBefore] = useState("");
  const [checking, setChecking] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  async function handleCheck() {
    if (!before) return;
    setChecking(true);
    setCount(null);
    try {
      const res = await fetch(`/api/settings/documents/count?before=${before}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not check.");
        return;
      }
      setCount(data.count);
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setChecking(false);
    }
  }

  async function handleClear() {
    if (!count) return;
    const confirmed = window.confirm(
      `Remove the saved file from ${count} printing record${count === 1 ? "" : "s"} dated before ${before}? ` +
        `The printing records themselves, their costs, and any invoices stay exactly as they are — only the attached file is deleted, and Reprint won't be available for these anymore. This cannot be undone.`
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      const res = await fetch("/api/settings/documents/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ before }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not clear files.");
        return;
      }
      toast.success(`Cleared ${data.cleared} file${data.cleared === 1 ? "" : "s"}`);
      setCount(0);
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <FieldWrapper
        label="Remove files older than"
        htmlFor="before"
        hint="Printing jobs printed before this date — their record, cost, and billing history are never affected."
      >
        <TextInput
          id="before"
          type="date"
          value={before}
          onChange={(e) => {
            setBefore(e.target.value);
            setCount(null);
          }}
        />
      </FieldWrapper>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={handleCheck} disabled={!before || checking}>
          {checking ? "Checking..." : "Check"}
        </Button>
        {count !== null && count > 0 && (
          <Button type="button" variant="danger" onClick={handleClear} disabled={clearing}>
            {clearing ? "Clearing..." : `Clear ${count} File${count === 1 ? "" : "s"}`}
          </Button>
        )}
      </div>

      {count !== null && (
        <p className="text-sm text-slate-600">
          {count === 0
            ? "No stored files match — nothing to clear."
            : `${count} printing record${count === 1 ? " has" : "s have"} a stored file dated before ${before}.`}
        </p>
      )}
    </div>
  );
}
