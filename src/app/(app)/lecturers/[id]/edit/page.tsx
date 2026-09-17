import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLecturer } from "@/server/lecturer-service";
import { LecturerForm } from "@/components/lecturers/LecturerForm";

export const dynamic = "force-dynamic";

export default async function EditLecturerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  // Editing is Administrator-only; middleware doesn't know about this
  // specific dynamic route, so enforce it here too.
  if (session?.role !== "ADMINISTRATOR") redirect("/lecturers");

  const lecturer = await getLecturer(id);
  if (!lecturer) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Edit {lecturer.name}</h1>
        <p className="text-sm text-slate-500">{lecturer.lecturerCode}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <LecturerForm
          lecturerId={lecturer.id}
          initialValues={{
            name: lecturer.name,
            department: lecturer.department ?? "",
            email: lecturer.email ?? "",
            phone: lecturer.phone ?? "",
            notes: lecturer.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
