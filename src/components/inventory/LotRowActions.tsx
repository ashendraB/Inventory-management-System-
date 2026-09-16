"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "@/lib/session-context";

export function LotRowActions({
  lotId,
  status,
  isActiveStock,
}: {
  lotId: string;
  status: string;
  isActiveStock: boolean;
}) {
  const router = useRouter();
  const { role } = useSession();
  const [busy, setBusy] = useState(false);

  if (role === "PRINTING_OPERATOR") return null;

  async function handleSetActive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/inventory/lots/${lotId}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not set this lot active.");
        return;
      }
      toast.success("Lot set as active stock");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    if (!window.confirm("Mark this lot as finished? It will no longer be usable for printing.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/inventory/lots/${lotId}/finish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not finish this lot.");
        return;
      }
      toast.success("Lot marked as finished");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const canActivate = !isActiveStock && status !== "FINISHED" && status !== "OUT_OF_STOCK";
  const canFinish = status !== "FINISHED";

  return (
    <div className="flex items-center gap-3 text-sm">
      {canActivate && (
        <button disabled={busy} onClick={handleSetActive} className="text-indigo-600 hover:underline">
          Set Active
        </button>
      )}
      {canFinish && (
        <button disabled={busy} onClick={handleFinish} className="text-slate-500 hover:underline">
          Mark Finished
        </button>
      )}
    </div>
  );
}
