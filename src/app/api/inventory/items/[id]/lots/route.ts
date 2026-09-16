import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { addStockLot } from "@/server/lot-service";
import { getInventoryItem, getCategory } from "@/server/inventory-service";
import { addStockLotSchema } from "@/lib/validation/lots";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const { id } = await ctx.params;

    const item = await getInventoryItem(id);
    if (!item) throw new ApiError(404, "Inventory item not found.");

    const category = await getCategory(item.categoryId);
    if (category?.name.toLowerCase() !== "paper") {
      throw new ApiError(400, "Only Paper items use stock lots.");
    }

    const body = await request.json().catch(() => null);
    const parsed = addStockLotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const lot = await addStockLot(id, parsed.data, session.userId);
    await logAudit({
      userId: session.userId,
      action: "ADD_STOCK_LOT",
      entityType: "InventoryLot",
      entityId: lot.id,
      newValue: lot,
    });
    return NextResponse.json({ lot }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
