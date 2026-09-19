import { listActiveLecturers } from "@/server/lecturer-service";
import { listPaperItemsForCalculator } from "@/server/printing-service";
import { listSubjects, listGrades } from "@/server/paper-config-service";
import { PrintingCalculatorForm } from "@/components/printing/PrintingCalculatorForm";

export const dynamic = "force-dynamic";

export default async function PrintingCalculatorPage() {
  const [lecturers, items, subjects, grades] = await Promise.all([
    listActiveLecturers(),
    listPaperItemsForCalculator(),
    listSubjects(),
    listGrades(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Printing Calculator</h1>
        <p className="text-sm text-slate-500">
          Pick the lecturer, the paper, and the job details — cost is calculated from the
          currently active stock lot and the configured printing price, automatically.
        </p>
      </div>
      <PrintingCalculatorForm
        lecturers={lecturers.map((l) => ({ id: l.id, name: l.name, department: l.department }))}
        initialItems={items}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        grades={grades.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}
