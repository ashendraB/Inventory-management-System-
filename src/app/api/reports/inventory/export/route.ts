import { requireRole, handleApiError } from "@/lib/api-auth";
import { getInventoryReport } from "@/server/report-service";
import { csvResponse } from "@/lib/csv";

export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const report = await getInventoryReport();
    return csvResponse(
      "inventory-report.csv",
      ["Item Code", "Name", "Category", "Stock", "Price", "Value", "Status"],
      report.rows.map((r) => [r.itemCode, r.name, r.category, r.stock, r.price.toFixed(2), r.value.toFixed(2), r.status])
    );
  } catch (err) {
    return handleApiError(err);
  }
}
