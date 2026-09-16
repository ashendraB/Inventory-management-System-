import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listLots, type LotFilters } from "@/server/lot-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: LotFilters = {
      itemId: sp.get("itemId") ?? undefined,
      status: (sp.get("status") as LotFilters["status"]) ?? undefined,
      search: sp.get("search") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    };
    const result = await listLots(filters);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
