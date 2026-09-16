import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { adjustLotQuantity } from "@/server/lot-service";
import { adjustLotQuantitySchema } from "@/lib/validation/lots";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = adjustLotQuantitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const lot = await adjustLotQuantity(id, parsed.data, session.userId);
    await logAudit({
      userId: session.userId,
      action: "ADJUST_STOCK",
      entityType: "InventoryLot",
      entityId: lot.id,
      newValue: { delta: parsed.data.delta, type: parsed.data.type, reason: parsed.data.reason },
    });
    return NextResponse.json({ lot });
  } catch (err) {
    return handleApiError(err);
  }
}
