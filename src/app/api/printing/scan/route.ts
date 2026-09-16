import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { resolveItemFromBarcode } from "@/server/printing-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const barcode = request.nextUrl.searchParams.get("barcode")?.trim();
    if (!barcode) throw new ApiError(400, "Barcode is required.");
    const result = await resolveItemFromBarcode(barcode);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
