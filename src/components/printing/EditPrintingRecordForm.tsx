"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Button } from "@/components/ui/Field";

export function EditPrintingRecordForm({
  recordId,
  initialValues,
  defaultOpen,
}: {
  recordId: string;
  initialValues: { wastedSheets: number; notes: string };
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!!defaultOpen);
  const [wastedSheets, setWastedSheets] = useState(String(initialValues.wastedSheets));
  const [notes, setNotes] = useState(initialValues.notes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Closing (whether by Cancel or a successful save) drops any ?edit=1 the
  // list page's Edit link arrived with, so a refresh or back-navigation
  // doesn't reopen the form on its own.
  function close() {
    setOpen(false);
    router.replace(`/printing/records/${recordId}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/printing/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wastedSheets: Number(wastedSheets),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }
      toast.success("Printing record updated");
      close();
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Edit
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 p-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <p className="text-xs text-slate-500">
        Lecturer, paper, pages, and pricing are locked in once a job is printed — to fix one of
        those, delete this record and submit it again. Use Wasted Sheets to record sheets spoiled
        by a printing-time error (jam, misalignment, ...); the extra sheets are deducted from the
        same stock lot but never added to what the lecturer is billed.
      </p>
      <FieldWrapper
        label="Wasted Sheets"
        htmlFor="edit-wasted-sheets"
        hint="Sheets spoiled during this job, on top of the sheets already billed."
      >
        <TextInput
          id="edit-wasted-sheets"
          type="number"
          min={0}
          step={1}
          value={wastedSheets}
          onChange={(e) => setWastedSheets(e.target.value)}
        />
      </FieldWrapper>
      <FieldWrapper label="Notes" htmlFor="edit-record-notes">
        <TextArea id="edit-record-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrapper>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
