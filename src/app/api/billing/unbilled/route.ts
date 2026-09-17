import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getUnbilledSummary } from "@/server/billing-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const year = Number(sp.get("year"));
    const month = Number(sp.get("month"));
    if (!year || !month || month < 1 || month > 12) {
      throw new ApiError(400, "A valid year and month are required.");
    }
    const summary = await getUnbilledSummary(year, month);
    return NextResponse.json({ summary });
  } catch (err) {
    return handleApiError(err);
  }
}
