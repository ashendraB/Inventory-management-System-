import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { markLotFinished } from "@/server/lot-service";

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const { id } = await ctx.params;
    const lot = await markLotFinished(id, session.userId);
    return NextResponse.json({ lot });
  } catch (err) {
    return handleApiError(err);
  }
}
