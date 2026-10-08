import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getPrintingRecordDocument } from "@/server/printing-service";

export async function GET(
  request: NextRequest,
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
        // ?download=1 saves the file (to open in Acrobat etc.) instead of
        // showing it in the browser's own viewer.
        "Content-Disposition": `${
          request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline"
        }; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
