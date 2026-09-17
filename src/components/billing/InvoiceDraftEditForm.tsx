"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Button } from "@/components/ui/Field";

export function InvoiceDraftEditForm({
  invoiceId,
  initialValues,
}: {
  invoiceId: string;
  initialValues: { otherCharges: string; discount: string; notes: string };
}) {
  const router = useRouter();
  const [otherCharges, setOtherCharges] = useState(initialValues.otherCharges);
  const [discount, setDiscount] = useState(initialValues.discount);
  const [notes, setNotes] = useState(initialValues.notes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherCharges: Number(otherCharges || 0),
          discount: Number(discount || 0),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }
      toast.success("Invoice updated");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="no-print space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <p className="text-xs text-slate-500">
        Adjustable while this invoice is a draft — paper cost and printing charge come from the
        printing records themselves and aren&apos;t editable here.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldWrapper label="Other Charges (Rs.)" htmlFor="inv-other">
          <TextInput
            id="inv-other"
            type="number"
            min={0}
            step="any"
            value={otherCharges}
            onChange={(e) => setOtherCharges(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label="Discount (Rs.)" htmlFor="inv-discount">
          <TextInput
            id="inv-discount"
            type="number"
            min={0}
            step="any"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Notes" htmlFor="inv-notes">
        <TextArea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrapper>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
