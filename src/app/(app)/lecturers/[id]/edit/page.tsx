import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLecturer } from "@/server/lecturer-service";
import { listSubjects } from "@/server/paper-config-service";
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

  const [lecturer, subjects] = await Promise.all([getLecturer(id), listSubjects()]);
  if (!lecturer) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Edit {lecturer.name}</h1>
        <p className="text-sm text-slate-400">{lecturer.lecturerCode}</p>
      </div>
      <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
        <LecturerForm
          lecturerId={lecturer.id}
          subjectOptions={subjects.map((s) => s.name)}
          initialValues={{
            name: lecturer.name,
            subject: lecturer.subject?.name ?? "",
            email: lecturer.email ?? "",
            phone: lecturer.phone ?? "",
            notes: lecturer.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
