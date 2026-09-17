import { NextRequest } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { getLecturerReport, parseDateRange } from "@/server/report-service";
import { csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const { start, end } = parseDateRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
    const report = await getLecturerReport(start, end);
    return csvResponse(
      "lecturer-report.csv",
      ["Lecturer Code", "Lecturer", "Jobs", "Sheets", "Total Cost", "Billed Jobs", "Unbilled Jobs"],
      report.rows.map((r) => [
        r.lecturerCode,
        r.lecturerName,
        r.jobCount,
        r.sheets,
        r.totalCost.toFixed(2),
        r.billedJobCount,
        r.jobCount - r.billedJobCount,
      ])
    );
  } catch (err) {
    return handleApiError(err);
  }
}
