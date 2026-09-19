import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { clearDocument } from "@/server/printing-service";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    await clearDocument(id);
    await logAudit({
      userId: session.userId,
      action: "CLEAR_PRINTING_DOCUMENT",
      entityType: "PrintingRecord",
      entityId: id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
