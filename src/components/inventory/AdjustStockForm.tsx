"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, Select, Button } from "@/components/ui/Field";

const TYPES = [
  { value: "MANUAL_ADJUSTMENT", label: "Manual correction" },
  { value: "DAMAGED", label: "Damaged / unusable" },
  { value: "RETURN", label: "Returned to stock" },
  { value: "TRANSFER", label: "Transferred" },
];

export function AdjustStockForm({ lotId }: { lotId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [type, setType] = useState("MANUAL_ADJUSTMENT");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/lots/${lotId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: Number(delta), type, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not adjust stock.");
        return;
      }
      toast.success("Stock adjusted");
      setOpen(false);
      setDelta("");
      setReason("");
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
        Adjust Stock
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 p-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldWrapper
          label="Change"
          htmlFor="delta"
          required
          hint="Positive to add, negative to remove"
        >
          <TextInput
            id="delta"
            type="number"
            step="any"
            required
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="-50"
          />
        </FieldWrapper>
        <FieldWrapper label="Type" htmlFor="type" required>
          <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <FieldWrapper label="Reason" htmlFor="reason" required>
          <TextInput
            id="reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. water damage"
          />
        </FieldWrapper>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Adjustment"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
