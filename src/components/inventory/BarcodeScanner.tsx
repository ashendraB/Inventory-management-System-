"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button, TextInput } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/format";

interface ScanItemResult {
  type: "item";
  item: {
    id: string;
    itemCode: string;
    name: string;
    barcode: string;
    category: { name: string };
  };
}

interface ScanLotResult {
  type: "lot";
  lot: {
    id: string;
    lotCode: string;
    currentQuantity: number;
    costPerSheet: string;
    status: string;
    isActiveStock: boolean;
    inventoryItem: { id: string; name: string; itemCode: string };
  };
}

type ScanResult = ScanItemResult | ScanLotResult;

export function BarcodeScanner() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/inventory/scan?barcode=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Barcode not found.");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(lotId: string) {
    const res = await fetch(`/api/inventory/lots/${lotId}/activate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not set this lot active.");
      return;
    }
    toast.success("Lot set as active stock");
    setResult((r) => (r && r.type === "lot" ? { ...r, lot: { ...r.lot, isActiveStock: true } } : r));
    router.refresh();
  }

  function reset() {
    setValue("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <TextInput
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Scan or type a barcode (item or stock lot)..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Looking up..." : "Scan"}
        </Button>
        {(result || error) && (
          <Button type="button" variant="secondary" onClick={reset}>
            Clear
          </Button>
        )}
      </form>

      {error && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <Link
            href={`/inventory/items/new?barcode=${encodeURIComponent(value.trim())}`}
            className="mt-1 inline-block font-medium text-brand-800 hover:underline"
          >
            + Add as new inventory item →
          </Link>
        </div>
      )}

      {result?.type === "item" && (
        <div className="mt-3 rounded-md border border-slate-200 p-3 text-sm">
          <p className="font-medium text-slate-900">{result.item.name}</p>
          <p className="text-slate-500">
            {result.item.itemCode} · {result.item.category.name}
          </p>
          <Link
            href={`/inventory/items/${result.item.id}`}
            className="mt-2 inline-block text-brand-800 hover:underline"
          >
            View item →
          </Link>
        </div>
      )}

      {result?.type === "lot" && (
        <div className="mt-3 rounded-md border border-slate-200 p-3 text-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-slate-900">{result.lot.lotCode}</p>
              <p className="text-slate-500">{result.lot.inventoryItem.name}</p>
            </div>
            <Badge tone={statusTone(result.lot.status)}>{result.lot.status}</Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <p>
              Available: <span className="font-medium">{result.lot.currentQuantity.toLocaleString()}</span>
            </p>
            <p>
              Cost: <span className="font-medium">{formatCurrency(Number(result.lot.costPerSheet))}/sheet</span>
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            {result.lot.isActiveStock ? (
              <Badge tone="success">Active Stock</Badge>
            ) : (
              <Button
                type="button"
                onClick={() => handleSetActive(result.lot.id)}
                disabled={result.lot.status === "FINISHED" || result.lot.status === "OUT_OF_STOCK"}
              >
                Set as Active Stock
              </Button>
            )}
            <Link
              href={`/inventory/items/${result.lot.inventoryItem.id}`}
              className="text-brand-800 hover:underline"
            >
              View item →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
