"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";

export function EditLotForm({
  lotId,
  suppliers,
  initialValues,
}: {
  lotId: string;
  suppliers: { id: string; name: string }[];
  initialValues: {
    costPerSheet: string;
    supplierId: string;
    location: string;
    notes: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [costPerSheet, setCostPerSheet] = useState(initialValues.costPerSheet);
  const [supplierId, setSupplierId] = useState(initialValues.supplierId);
  const [location, setLocation] = useState(initialValues.location);
  const [notes, setNotes] = useState(initialValues.notes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/lots/${lotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costPerSheet: Number(costPerSheet),
          supplierId,
          location,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }
      toast.success("Lot updated");
      setOpen(false);
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
        Edit Lot
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 p-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <p className="text-xs text-slate-500">
        Fixes a data-entry mistake — quantity isn&apos;t editable here, use Adjust Stock for that
        so every unit change stays logged.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldWrapper label="Cost per Sheet (Rs.)" htmlFor="edit-cost" required>
          <TextInput
            id="edit-cost"
            type="number"
            min={0}
            step="any"
            required
            value={costPerSheet}
            onChange={(e) => setCostPerSheet(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label="Supplier" htmlFor="edit-supplier">
          <Select id="edit-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <FieldWrapper label="Location" htmlFor="edit-location">
          <TextInput id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Notes" htmlFor="edit-notes">
        <TextArea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrapper>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
