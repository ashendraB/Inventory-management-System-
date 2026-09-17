import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { deletePrintingProfile } from "@/server/printing-service";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const { id } = await ctx.params;
    await deletePrintingProfile(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
