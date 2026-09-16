"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, Select, Button } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export interface LookupOption {
  id: string;
  label: string;
}

export interface PriceRuleRow {
  id: string;
  paperSize: { name: string };
  gsm: { value: number };
  paperType: { name: string };
  colourMode: "BW" | "COLOUR";
  sides: "SINGLE" | "DOUBLE";
  chargePerSheet: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: "ACTIVE" | "INACTIVE";
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function PriceRuleManager({
  paperSizes,
  gsmTypes,
  paperTypes,
  rules,
}: {
  paperSizes: LookupOption[];
  gsmTypes: LookupOption[];
  paperTypes: LookupOption[];
  rules: PriceRuleRow[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [paperSizeId, setPaperSizeId] = useState("");
  const [gsmId, setGsmId] = useState("");
  const [paperTypeId, setPaperTypeId] = useState("");
  const [colourMode, setColourMode] = useState<"BW" | "COLOUR">("BW");
  const [sides, setSides] = useState<"SINGLE" | "DOUBLE">("SINGLE");
  const [chargePerSheet, setChargePerSheet] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());
  const [effectiveTo, setEffectiveTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/printing/price-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperSizeId,
          gsmId,
          paperTypeId,
          colourMode,
          sides,
          chargePerSheet: Number(chargePerSheet),
          effectiveFrom,
          effectiveTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save this pricing rule.");
        return;
      }
      toast.success("Pricing rule added");
      setShowForm(false);
      setChargePerSheet("");
      setEffectiveTo("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(rule: PriceRuleRow) {
    const nextStatus = rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/printing/price-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      toast.error("Could not update this rule.");
      return;
    }
    toast.success(nextStatus === "ACTIVE" ? "Rule reactivated" : "Rule deactivated");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!showForm && <Button onClick={() => setShowForm(true)}>+ Add Pricing Rule</Button>}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldWrapper label="Paper Size" htmlFor="pr-size" required>
              <Select id="pr-size" required value={paperSizeId} onChange={(e) => setPaperSizeId(e.target.value)}>
                <option value="">Select size</option>
                {paperSizes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="GSM" htmlFor="pr-gsm" required>
              <Select id="pr-gsm" required value={gsmId} onChange={(e) => setGsmId(e.target.value)}>
                <option value="">Select GSM</option>
                {gsmTypes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Paper Type" htmlFor="pr-type" required>
              <Select id="pr-type" required value={paperTypeId} onChange={(e) => setPaperTypeId(e.target.value)}>
                <option value="">Select type</option>
                {paperTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Colour" htmlFor="pr-colour" required>
              <Select
                id="pr-colour"
                value={colourMode}
                onChange={(e) => setColourMode(e.target.value as "BW" | "COLOUR")}
              >
                <option value="BW">Black &amp; White</option>
                <option value="COLOUR">Colour</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Sides" htmlFor="pr-sides" required>
              <Select
                id="pr-sides"
                value={sides}
                onChange={(e) => setSides(e.target.value as "SINGLE" | "DOUBLE")}
              >
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Printing Charge (Rs./sheet)" htmlFor="pr-charge" required>
              <TextInput
                id="pr-charge"
                type="number"
                min={0}
                step="any"
                required
                value={chargePerSheet}
                onChange={(e) => setChargePerSheet(e.target.value)}
                placeholder="25"
              />
            </FieldWrapper>
            <FieldWrapper label="Effective From" htmlFor="pr-from" required>
              <TextInput
                id="pr-from"
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Effective To" htmlFor="pr-to" hint="Optional — leave blank for no end date">
              <TextInput
                id="pr-to"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </FieldWrapper>
          </div>
          <p className="text-xs text-slate-500">
            If an active rule already exists for this exact combination, it will be superseded
            (marked inactive) automatically.
          </p>
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add Rule"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Paper Size</th>
              <th className="px-4 py-3">GSM</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Colour</th>
              <th className="px-4 py-3">Sides</th>
              <th className="px-4 py-3">Charge</th>
              <th className="px-4 py-3">Effective</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  No pricing rules yet. Printing jobs can&apos;t be priced until one exists.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">{rule.paperSize.name}</td>
                  <td className="px-4 py-3">{rule.gsm.value}</td>
                  <td className="px-4 py-3">{rule.paperType.name}</td>
                  <td className="px-4 py-3">{rule.colourMode === "BW" ? "B&W" : "Colour"}</td>
                  <td className="px-4 py-3">{rule.sides === "SINGLE" ? "Single" : "Double"}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(rule.chargePerSheet))}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(rule.effectiveFrom)}
                    {rule.effectiveTo ? ` – ${formatDate(rule.effectiveTo)}` : " – ongoing"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={rule.status === "ACTIVE" ? "success" : "neutral"}>{rule.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(rule)} className="text-indigo-600 hover:underline">
                      {rule.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
