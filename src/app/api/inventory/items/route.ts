import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import {
  listInventoryItems,
  createInventoryItem,
  type InventoryItemFilters,
} from "@/server/inventory-service";
import { createInventoryItemSchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: InventoryItemFilters = {
      search: sp.get("search") ?? undefined,
      categoryId: sp.get("categoryId") ?? undefined,
      status: (sp.get("status") as "ACTIVE" | "INACTIVE") ?? undefined,
      supplierId: sp.get("supplierId") ?? undefined,
      sort: (sp.get("sort") as InventoryItemFilters["sort"]) ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    };
    const result = await listInventoryItems(filters);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Both Administrator and Inventory Operator may add items (spec §4);
    // only Administrator may later edit/deactivate them.
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createInventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const item = await createInventoryItem(parsed.data);
    await logAudit({
      userId: session.userId,
      action: "CREATE_INVENTORY_ITEM",
      entityType: "InventoryItem",
      entityId: item.id,
      newValue: item,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
