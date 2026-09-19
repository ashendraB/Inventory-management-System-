import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getPrintingRecordDocument } from "@/server/printing-service";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const { id } = await ctx.params;
    const record = await getPrintingRecordDocument(id);
    if (!record || !record.documentData) {
      throw new ApiError(404, "No document was saved for this printing record.");
    }
    const name = (record.documentFileName ?? "document").replace(/"/g, "");
    const fileName = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
    return new NextResponse(new Uint8Array(record.documentData), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
