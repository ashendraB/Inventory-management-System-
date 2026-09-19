"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "@/lib/session-context";

export function ItemRowActions({
  itemId,
  status,
}: {
  itemId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const router = useRouter();
  const { role } = useSession();

  async function toggleStatus() {
    const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmed = window.confirm(
      nextStatus === "INACTIVE"
        ? "Deactivate this inventory item? It will stop appearing as available for new stock lots."
        : "Reactivate this inventory item?"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/inventory/items/${itemId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      toast.error("Could not update status.");
      return;
    }
    toast.success(nextStatus === "ACTIVE" ? "Item reactivated" : "Item deactivated");
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Remove this item? It will no longer appear in Inventory Items, Stock Lots, or the Printing Calculator. Existing printing records and invoices are not affected."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/inventory/items/${itemId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Could not delete this item.");
      return;
    }
    toast.success("Item removed");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href={`/inventory/items/${itemId}`} className="text-slate-400 hover:underline">
        View
      </Link>
      {role === "ADMINISTRATOR" && (
        <>
          <Link
            href={`/inventory/items/${itemId}/edit`}
            className="text-gold-400 hover:underline"
          >
            Edit
          </Link>
          <button onClick={toggleStatus} className="text-slate-400 hover:underline">
            {status === "ACTIVE" ? "Deactivate" : "Reactivate"}
          </button>
          <button onClick={handleDelete} className="text-red-600 hover:underline">
            Delete
          </button>
        </>
      )}
    </div>
  );
}
