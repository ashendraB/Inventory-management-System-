import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import {
  getPriceRule,
  updatePriceRule,
  deletePriceRule,
  priceRuleInUse,
} from "@/server/pricing-service";
import { updatePriceRuleSchema } from "@/lib/validation/pricing";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getPriceRule(id);
    if (!existing) throw new ApiError(404, "Pricing rule not found.");

    const body = await request.json().catch(() => null);
    const parsed = updatePriceRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const rule = await updatePriceRule(id, parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_PRICE_RULE",
      entityType: "PrintingPriceRule",
      entityId: id,
      oldValue: {
        chargePerSheet: existing.chargePerSheet.toString(),
        effectiveTo: existing.effectiveTo,
        status: existing.status,
      },
      newValue: {
        chargePerSheet: rule.chargePerSheet.toString(),
        effectiveTo: rule.effectiveTo,
        status: rule.status,
      },
    });
    return NextResponse.json({ rule });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getPriceRule(id);
    if (!existing) throw new ApiError(404, "Pricing rule not found.");

    if (await priceRuleInUse(id)) {
      throw new ApiError(
        409,
        "This rule has already priced one or more printing jobs. Deactivate it instead."
      );
    }

    await deletePriceRule(id);
    await logAudit({
      userId: session.userId,
      action: "DELETE_PRICE_RULE",
      entityType: "PrintingPriceRule",
      entityId: id,
      oldValue: existing,
      newValue: null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
