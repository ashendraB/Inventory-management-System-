import { NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listPaperItemsForCalculator } from "@/server/printing-service";

export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const items = await listPaperItemsForCalculator();
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
