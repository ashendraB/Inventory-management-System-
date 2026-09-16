import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { previewPrintingJob } from "@/server/printing-service";
import { previewJobInputSchema } from "@/lib/validation/printing";

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = previewJobInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const preview = await previewPrintingJob(parsed.data);
    return NextResponse.json(preview);
  } catch (err) {
    return handleApiError(err);
  }
}
