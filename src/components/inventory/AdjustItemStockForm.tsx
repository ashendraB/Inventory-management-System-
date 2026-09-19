"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, Select, Button } from "@/components/ui/Field";

const TYPES = [
  { value: "MANUAL_ADJUSTMENT", label: "Use" },
  { value: "DAMAGED", label: "Damaged / unusable" },
  { value: "RETURN", label: "Returned to stock" },
  { value: "TRANSFER", label: "Transferred" },
];

export function AdjustItemStockForm({
  itemId,
  defaultOpen,
}: {
  itemId: string;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!!defaultOpen);
  const [delta, setDelta] = useState("");
  const [type, setType] = useState("MANUAL_ADJUSTMENT");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    router.replace(`/inventory/items/${itemId}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/items/${itemId}/adjust`, {
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
      setDelta("");
      setReason("");
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
        Use Stock
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-white/10 p-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <p className="text-xs text-slate-400">
        Mark stock as used, damaged, returned, or corrected. Enter a negative change to remove
        stock (e.g. -1 for one used, or -2 to bring 2 in hand down to 0 / stock finished) —
        positive to add it back.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldWrapper label="Change" htmlFor="item-delta" required hint="Negative to remove, positive to add">
          <TextInput
            id="item-delta"
            type="number"
            step="any"
            required
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="-1"
          />
        </FieldWrapper>
        <FieldWrapper label="Type" htmlFor="item-adjust-type" required>
          <Select
            id="item-adjust-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (e.target.value !== "DAMAGED") setReason("");
            }}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        {type === "DAMAGED" && (
          <FieldWrapper label="Reason" htmlFor="item-adjust-reason" required>
            <TextInput
              id="item-adjust-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. water damage"
            />
          </FieldWrapper>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
