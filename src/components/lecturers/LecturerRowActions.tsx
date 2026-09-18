"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "@/lib/session-context";

export function LecturerRowActions({
  lecturerId,
  status,
}: {
  lecturerId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const router = useRouter();
  const { role } = useSession();

  if (role !== "ADMINISTRATOR") return null;

  async function toggleStatus() {
    const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmed = window.confirm(
      nextStatus === "INACTIVE"
        ? "Deactivate this lecturer? They will stop appearing as an option in the Printing Calculator."
        : "Reactivate this lecturer?"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/lecturers/${lecturerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      toast.error("Could not update status.");
      return;
    }
    toast.success(nextStatus === "ACTIVE" ? "Lecturer reactivated" : "Lecturer deactivated");
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Permanently delete this lecturer? This cannot be undone."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/lecturers/${lecturerId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Could not delete this lecturer.");
      return;
    }
    toast.success("Lecturer deleted");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href={`/lecturers/${lecturerId}/edit`} className="text-brand-800 hover:underline">
        Edit
      </Link>
      <button onClick={toggleStatus} className="text-slate-500 hover:underline">
        {status === "ACTIVE" ? "Deactivate" : "Reactivate"}
      </button>
      <button onClick={handleDelete} className="text-red-600 hover:underline">
        Delete
      </button>
    </div>
  );
}
