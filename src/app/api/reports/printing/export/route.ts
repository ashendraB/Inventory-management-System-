import { NextRequest } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { getPrintingReport, parseDateRange } from "@/server/report-service";
import { csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const { start, end } = parseDateRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
    const report = await getPrintingReport(start, end);
    return csvResponse(
      "printing-report.csv",
      [
        "Printing Code", "Date", "Lecturer", "Document", "Paper", "Colour", "Sides",
        "Sheets", "Wasted", "Paper Cost", "Printing Charge", "Total",
      ],
      report.records.map((r) => [
        r.printingCode,
        formatDate(r.date),
        r.lecturer.name,
        r.documentName,
        `${r.paperSize.name}/${r.gsm.value}/${r.paperType.name}`,
        r.colourMode,
        r.sides,
        r.physicalSheets,
        r.wastedSheets,
        Number(r.totalPaperCost).toFixed(2),
        Number(r.totalPrintingCharge).toFixed(2),
        Number(r.totalCost).toFixed(2),
      ])
    );
  } catch (err) {
    return handleApiError(err);
  }
}
