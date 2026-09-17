import { NextRequest } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { getCostReport, parseDateRange } from "@/server/report-service";
import { csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const { start, end } = parseDateRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
    const report = await getCostReport(start, end);
    return csvResponse(
      "cost-report.csv",
      ["Month", "Paper Cost", "Printing Charge", "Total"],
      report.monthly.map((m) => [m.month, m.paperCost.toFixed(2), m.printingCharge.toFixed(2), m.total.toFixed(2)])
    );
  } catch (err) {
    return handleApiError(err);
  }
}
