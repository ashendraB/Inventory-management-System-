import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import {
  getInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  inventoryItemDeleteBlockReason,
} from "@/server/inventory-service";
import { updateInventoryItemSchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const { id } = await ctx.params;
    const item = await getInventoryItem(id);
    if (!item) throw new ApiError(404, "Inventory item not found.");
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Editing existing items is Administrator-only (spec §4); operators may
    // only *add* new items.
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getInventoryItem(id);
    if (!existing) throw new ApiError(404, "Inventory item not found.");

    const body = await request.json().catch(() => null);
    const parsed = updateInventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const item = await updateInventoryItem(id, parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_INVENTORY_ITEM",
      entityType: "InventoryItem",
      entityId: item.id,
      oldValue: existing,
      newValue: item,
    });
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Deleting is Administrator-only, same as editing (spec §4).
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getInventoryItem(id);
    if (!existing) throw new ApiError(404, "Inventory item not found.");

    const blockReason = await inventoryItemDeleteBlockReason(existing);
    if (blockReason) {
      throw new ApiError(409, blockReason);
    }

    await deleteInventoryItem(id);
    await logAudit({
      userId: session.userId,
      action: "DELETE_INVENTORY_ITEM",
      entityType: "InventoryItem",
      entityId: id,
      oldValue: existing,
      newValue: null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
