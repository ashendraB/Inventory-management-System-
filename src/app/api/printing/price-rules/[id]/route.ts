import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { updatePriceRule } from "@/server/pricing-service";
import { updatePriceRuleSchema } from "@/lib/validation/pricing";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = updatePriceRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const rule = await updatePriceRule(id, parsed.data);
    return NextResponse.json({ rule });
  } catch (err) {
    return handleApiError(err);
  }
}
