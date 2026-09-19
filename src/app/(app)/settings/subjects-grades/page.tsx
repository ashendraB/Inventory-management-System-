import { listSubjects, listGrades } from "@/server/paper-config-service";
import { LookupManager } from "@/components/settings/LookupManager";

export const dynamic = "force-dynamic";

export default async function SubjectsGradesSettingsPage() {
  const [subjects, grades] = await Promise.all([listSubjects(true), listGrades(true)]);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Subjects &amp; Grades</h1>
        <p className="text-sm text-slate-500">
          Shown as dropdowns on the Printing Calculator. Deactivating one hides it from new
          selections without touching existing printing records.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Subjects</h2>
        <LookupManager
          apiBase="/api/settings/subjects"
          payloadKey="name"
          inputPlaceholder="e.g. Physics"
          items={subjects.map((s) => ({ id: s.id, label: s.name, isActive: s.isActive }))}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Grades</h2>
        <LookupManager
          apiBase="/api/settings/grades"
          payloadKey="name"
          inputPlaceholder="e.g. Grade 10"
          items={grades.map((g) => ({ id: g.id, label: g.name, isActive: g.isActive }))}
        />
      </div>
    </div>
  );
}
