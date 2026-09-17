import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import {
  getPrintingRecord,
  updatePrintingRecord,
  deletePrintingRecord,
} from "@/server/printing-service";
import { updatePrintingRecordSchema } from "@/lib/validation/printing";
import { logAudit } from "@/lib/audit";

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

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const { id } = await ctx.params;
    const existing = await getPrintingRecord(id);
    if (!existing) throw new ApiError(404, "Printing record not found.");

    const body = await request.json().catch(() => null);
    const parsed = updatePrintingRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const record = await updatePrintingRecord(id, parsed.data, session.userId);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_PRINTING_RECORD",
      entityType: "PrintingRecord",
      entityId: id,
      oldValue: { wastedSheets: existing.wastedSheets, notes: existing.notes },
      newValue: { wastedSheets: record.wastedSheets, notes: record.notes },
    });
    return NextResponse.json({ record });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const { id } = await ctx.params;
    const existing = await getPrintingRecord(id);
    if (!existing) throw new ApiError(404, "Printing record not found.");

    await deletePrintingRecord(id, session.userId);
    await logAudit({
      userId: session.userId,
      action: "DELETE_PRINTING_RECORD",
      entityType: "PrintingRecord",
      entityId: id,
      oldValue: existing,
      newValue: null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
