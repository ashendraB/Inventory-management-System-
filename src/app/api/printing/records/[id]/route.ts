import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getPrintingRecord } from "@/server/printing-service";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const { id } = await ctx.params;
    const record = await getPrintingRecord(id);
    if (!record) throw new ApiError(404, "Printing record not found.");
    return NextResponse.json({ record });
  } catch (err) {
    return handleApiError(err);
  }
}
