import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { countDocumentsOlderThan } from "@/server/printing-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const before = request.nextUrl.searchParams.get("before");
    if (!before) throw new ApiError(400, "Date is required.");
    const count = await countDocumentsOlderThan(new Date(before));
    return NextResponse.json({ count });
  } catch (err) {
    return handleApiError(err);
  }
}
