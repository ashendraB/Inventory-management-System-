import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LecturerForm } from "@/components/lecturers/LecturerForm";

export const dynamic = "force-dynamic";

export default async function NewLecturerPage() {
  const session = await getSession();
  // Adding a lecturer is Administrator-only; middleware doesn't know about
  // this specific dynamic route, so enforce it here too.
  if (session?.role !== "ADMINISTRATOR") redirect("/lecturers");

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add Lecturer</h1>
        <p className="text-sm text-slate-500">
          A Lecturer ID is generated automatically once you save.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <LecturerForm />
      </div>
    </div>
  );
}
