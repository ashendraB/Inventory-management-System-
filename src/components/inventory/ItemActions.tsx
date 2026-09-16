"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSession } from "@/lib/session-context";
import { Button } from "@/components/ui/Field";

export function ItemActions({
  itemId,
  status,
}: {
  itemId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const router = useRouter();
  const { role } = useSession();

  if (role !== "ADMINISTRATOR") return null;

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

  return (
    <div className="flex gap-2">
      <Link href={`/inventory/items/${itemId}/edit`}>
        <Button type="button" variant="secondary">
          Edit
        </Button>
      </Link>
      <Button type="button" variant={status === "ACTIVE" ? "danger" : "primary"} onClick={toggleStatus}>
        {status === "ACTIVE" ? "Deactivate" : "Reactivate"}
      </Button>
    </div>
  );
}
