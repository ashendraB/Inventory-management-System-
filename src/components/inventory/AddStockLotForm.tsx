"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/format";

export function AddStockLotForm({
  itemId,
  suppliers,
  hasActiveLot,
}: {
  itemId: string;
  suppliers: { id: string; name: string }[];
  hasActiveLot: boolean;
}) {
  const router = useRouter();
  const [packs, setPacks] = useState("");
  const [sheetsPerPack, setSheetsPerPack] = useState("");
  const [packPrice, setPackPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [setActive, setSetActive] = useState(!hasActiveLot);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costPerSheet = useMemo(() => {
    const p = Number(packPrice);
    const s = Number(sheetsPerPack);
    if (!p || !s) return null;
    return p / s;
  }, [packPrice, sheetsPerPack]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/items/${itemId}/lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packs: Number(packs || 0),
          sheetsPerPack: Number(sheetsPerPack || 0),
          packPrice: Number(packPrice || 0),
          supplierId,
          location,
          notes,
          setActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add this stock lot.");
        return;
      }
      toast.success(`Lot ${data.lot.lotCode} added`);
      router.push(`/inventory/items/${itemId}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrapper label="Number of Packs" htmlFor="packs" required>
          <TextInput
            id="packs"
            type="number"
            min={1}
            step="any"
            required
            value={packs}
            onChange={(e) => setPacks(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label="Sheets per Pack" htmlFor="sheetsPerPack" required>
          <TextInput
            id="sheetsPerPack"
            type="number"
            min={1}
            step="any"
            required
            value={sheetsPerPack}
            onChange={(e) => setSheetsPerPack(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label="Pack Price (Rs.)" htmlFor="packPrice" required>
          <TextInput
            id="packPrice"
            type="number"
            min={0}
            step="any"
            required
            value={packPrice}
            onChange={(e) => setPackPrice(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Price per Sheet"
          htmlFor="costPerSheet"
          hint="Calculated automatically"
        >
          <TextInput
            id="costPerSheet"
            readOnly
            disabled
            value={costPerSheet !== null ? formatCurrency(costPerSheet) : "—"}
          />
        </FieldWrapper>
        <FieldWrapper label="Supplier" htmlFor="supplierId">
          <Select id="supplierId" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <FieldWrapper label="Location" htmlFor="location">
          <TextInput id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </FieldWrapper>
      </div>

      <FieldWrapper label="Notes" htmlFor="notes">
        <TextArea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrapper>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={setActive}
          onChange={(e) => setSetActive(e.target.checked)}
        />
        Set as active stock (used by the printing calculator once it&apos;s built)
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Add Stock Lot"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
