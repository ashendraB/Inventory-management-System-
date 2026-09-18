import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { adjustItemQuantity } from "@/server/inventory-service";
import { adjustItemQuantitySchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = adjustItemQuantitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const item = await adjustItemQuantity(id, parsed.data, session.userId);
    await logAudit({
      userId: session.userId,
      action: "ADJUST_ITEM_STOCK",
      entityType: "InventoryItem",
      entityId: item.id,
      newValue: { delta: parsed.data.delta, type: parsed.data.type, reason: parsed.data.reason },
    });
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}
