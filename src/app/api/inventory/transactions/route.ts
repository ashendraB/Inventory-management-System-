import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listStockTransactions, type TransactionFilters } from "@/server/lot-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: TransactionFilters = {
      itemId: sp.get("itemId") ?? undefined,
      lotId: sp.get("lotId") ?? undefined,
      type: sp.get("type") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    };
    const result = await listStockTransactions(filters);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
