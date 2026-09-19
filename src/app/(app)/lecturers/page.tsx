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
          <h1 className="text-xl font-semibold text-gold-400">Lecturers</h1>
          <p className="text-sm text-slate-400">{lecturers.length} lecturer(s)</p>
        </div>
        {session?.role === "ADMINISTRATOR" && (
          <Link
            href="/lecturers/new"
            className="rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-brand-900 transition-all duration-150 hover:bg-gold-600 hover:shadow-md active:scale-[0.97]"
          >
            + Add Lecturer
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-700 bg-brand-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                <tr key={l.id} className="border-b border-white/10 last:border-0 transition-colors hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-slate-200">{l.lecturerCode}</td>
                  <td className="px-4 py-3">{l.name}</td>
                  <td className="px-4 py-3 text-slate-400">{l.department ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{l.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{l.phone ?? "—"}</td>
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
