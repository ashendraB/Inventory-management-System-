import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listLecturers } from "@/server/lecturer-service";
import { LecturerRowActions } from "@/components/lecturers/LecturerRowActions";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LecturersPage() {
  const [session, lecturers] = await Promise.all([
    getSession(),
    listLecturers(true),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Lecturers</h1>
          <p className="text-sm text-slate-500">{lecturers.length} lecturer(s)</p>
        </div>
        {session?.role === "ADMINISTRATOR" && (
          <Link
            href="/lecturers/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Lecturer
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Lecturer ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lecturers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No lecturers yet.
                </td>
              </tr>
            ) : (
              lecturers.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{l.lecturerCode}</td>
                  <td className="px-4 py-3">{l.name}</td>
                  <td className="px-4 py-3 text-slate-500">{l.department ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{l.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{l.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <LecturerRowActions lecturerId={l.id} status={l.status} />
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
