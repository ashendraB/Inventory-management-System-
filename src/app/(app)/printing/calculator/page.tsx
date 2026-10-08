import { listActiveLecturers } from "@/server/lecturer-service";
import { listPaperItemsForCalculator, getPrintingRecord } from "@/server/printing-service";
import { listSubjects, listGrades } from "@/server/paper-config-service";
import { PrintingCalculatorForm } from "@/components/printing/PrintingCalculatorForm";

export const dynamic = "force-dynamic";

export default async function PrintingCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ reprint?: string }>;
}) {
  const { reprint: reprintId } = await searchParams;
  const [lecturers, items, subjects, grades, source] = await Promise.all([
    listActiveLecturers(),
    listPaperItemsForCalculator(),
    listSubjects(),
    listGrades(),
    reprintId ? getPrintingRecord(reprintId) : null,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Printing Calculator</h1>
        <p className="text-sm text-slate-400">
          Pick the lecturer, the paper, and the job details — cost is calculated from the
          currently active stock lot and the configured printing price, automatically.
        </p>
      </div>
      <PrintingCalculatorForm
        lecturers={lecturers.map((l) => ({
          id: l.id,
          name: l.name,
          subjectIds: l.subjects.map((s) => s.id),
        }))}
        initialItems={items}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        grades={grades.map((g) => ({ id: g.id, name: g.name }))}
        reprint={
          source?.documentFileName
            ? {
                recordId: source.id,
                printingCode: source.printingCode,
                lecturerId: source.lecturerId,
                documentName: source.documentName,
                subjectId: source.subjectId ?? "",
                gradeId: source.gradeId ?? "",
                inventoryItemId: source.lot.inventoryItemId,
                colourMode: source.colourMode,
                sides: source.sides,
                layout: source.layout,
                pages: source.pages,
                copies: source.copies,
                documentFileName: source.documentFileName,
              }
            : undefined
        }
      />
    </div>
  );
}
