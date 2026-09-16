import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getLot } from "@/server/lot-service";

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
