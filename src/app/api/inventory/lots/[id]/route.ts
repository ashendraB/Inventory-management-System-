import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getLot, updateLot } from "@/server/lot-service";
import { updateLotSchema } from "@/lib/validation/lots";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const { id } = await ctx.params;
    const lot = await getLot(id);
    if (!lot) throw new ApiError(404, "Stock lot not found.");
    return NextResponse.json({ lot });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Editing an existing lot's details is Administrator-only, mirroring
    // inventory item edits — operators can add lots but not correct them.
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = updateLotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const lot = await updateLot(id, parsed.data, session.userId);
    return NextResponse.json({ lot });
  } catch (err) {
    return handleApiError(err);
  }
}
