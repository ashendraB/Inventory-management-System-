import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getInventoryItem, setInventoryItemStatus } from "@/server/inventory-service";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getInventoryItem(id);
    if (!existing) throw new ApiError(404, "Inventory item not found.");

    const body = await request.json().catch(() => null);
    const status = body?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";

    const item = await setInventoryItemStatus(id, status);
    await logAudit({
      userId: session.userId,
      action: status === "ACTIVE" ? "REACTIVATE_INVENTORY_ITEM" : "DEACTIVATE_INVENTORY_ITEM",
      entityType: "InventoryItem",
      entityId: item.id,
      oldValue: { status: existing.status },
      newValue: { status: item.status },
    });
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}
