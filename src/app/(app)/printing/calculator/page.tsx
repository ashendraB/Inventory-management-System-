import { listActiveLecturers } from "@/server/lecturer-service";
import { listPaperItemsForCalculator } from "@/server/printing-service";
import { PrintingCalculatorForm } from "@/components/printing/PrintingCalculatorForm";

export const dynamic = "force-dynamic";

export default async function PrintingCalculatorPage() {
  const [lecturers, items] = await Promise.all([
    listActiveLecturers(),
    listPaperItemsForCalculator(),
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
      />
    </div>
  );
}
