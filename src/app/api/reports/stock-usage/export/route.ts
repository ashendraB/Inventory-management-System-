import { NextRequest } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { getStockUsageReport, parseDateRange } from "@/server/report-service";
import { csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const { start, end } = parseDateRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
    const report = await getStockUsageReport(start, end);
    return csvResponse(
      "stock-usage-report.csv",
      ["Date", "Type", "Item", "Lot", "Change", "New Quantity", "User", "Reason"],
      report.transactions.map((t) => [
        formatDate(t.createdAt),
        t.type,
        `${t.inventoryItem.itemCode} - ${t.inventoryItem.name}`,
        t.lot?.lotCode ?? "",
        t.quantityChange,
        t.newQuantity,
        t.user.name,
        t.reason ?? "",
      ])
    );
  } catch (err) {
    return handleApiError(err);
  }
}
