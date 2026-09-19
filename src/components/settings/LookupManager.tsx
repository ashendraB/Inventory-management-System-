"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { TextInput, Button } from "@/components/ui/Field";

export interface LookupItem {
  id: string;
  label: string;
  isActive: boolean;
}

export function LookupManager({
  apiBase,
  payloadKey,
  inputType = "text",
  inputPlaceholder,
  items,
}: {
  apiBase: string; // e.g. "/api/settings/paper-sizes"
  payloadKey: "name" | "value";
  inputType?: "text" | "number";
  inputPlaceholder?: string;
  items: LookupItem[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload =
        payloadKey === "value" ? { value: Number(value) } : { name: value.trim() };
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add this.");
        return;
      }
      toast.success("Added");
      setValue("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: LookupItem) {
    const res = await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (!res.ok) {
      toast.error("Could not update this.");
      return;
    }
    toast.success(item.isActive ? "Deactivated" : "Reactivated");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <TextInput
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={inputPlaceholder}
          className="max-w-xs"
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add"}
        </Button>
      </form>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-brand-700 bg-brand-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  None yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 font-medium">{item.label}</td>
                  <td className="px-4 py-3">
                    <Badge tone={item.isActive ? "success" : "neutral"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(item)}
                      className="text-gold-400 hover:underline"
                    >
                      {item.isActive ? "Deactivate" : "Reactivate"}
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
