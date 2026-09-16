import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { findByBarcode } from "@/server/lot-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const barcode = request.nextUrl.searchParams.get("barcode")?.trim();
    if (!barcode) throw new ApiError(400, "Barcode is required.");

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
