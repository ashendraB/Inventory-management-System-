"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ReprintButton } from "@/components/printing/ReprintButton";

export function StoredDocumentRowActions({
  recordId,
  documentName,
}: {
  recordId: string;
  documentName: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      `Remove the saved file "${documentName}"? The printing record, its cost, and its place in reports/invoices stay exactly as they are — only the file itself is deleted, and Reprint won't be available for it anymore. This cannot be undone.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/settings/documents/${recordId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove this file.");
      return;
    }
    toast.success("File removed");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <ReprintButton recordId={recordId} />
      <button type="button" onClick={handleDelete} className="text-red-600 hover:underline">
        Delete
      </button>
    </div>
  );
}
