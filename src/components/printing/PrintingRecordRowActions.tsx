"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "@/lib/session-context";
import { ReprintButton } from "@/components/printing/ReprintButton";

export function PrintingRecordRowActions({
  recordId,
  hasDocument,
}: {
  recordId: string;
  hasDocument?: boolean;
}) {
  const router = useRouter();
  const { role } = useSession();

  if (role !== "ADMINISTRATOR" && role !== "PRINTING_OPERATOR") return null;

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this printing record? The sheets it used (including any marked wasted) will be restored to the stock lot. This cannot be undone."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/printing/records/${recordId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Could not delete this record.");
      return;
    }
    toast.success("Printing record deleted, stock restored");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {hasDocument && <ReprintButton recordId={recordId} />}
      <button onClick={handleDelete} className="text-red-600 hover:underline">
        Delete
      </button>
    </div>
  );
}
