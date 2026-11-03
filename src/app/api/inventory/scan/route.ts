import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { findByBarcode } from "@/server/lot-service";
import { findPrintingRecordByCode } from "@/server/printing-service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const barcode = request.nextUrl.searchParams.get("barcode")?.trim();
    if (!barcode) throw new ApiError(400, "Barcode is required.");

    // A printing ID (PRT-000031) is stamped as a barcode on printed documents.
    // Only roles that can see printing records get the job back.
    if (/^PRT-\d+$/i.test(barcode) && session.role !== "INVENTORY_OPERATOR") {
      const record = await findPrintingRecordByCode(barcode);
      if (record) return NextResponse.json({ type: "printing", record });
      return NextResponse.json({ error: `No printing job matches "${barcode}".` }, { status: 404 });
    }

    const result = await findByBarcode(barcode);
    if (!result) {
      return NextResponse.json(
        { error: `No item or stock lot matches barcode "${barcode}".` },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
