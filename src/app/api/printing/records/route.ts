import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import {
  listPrintingRecords,
  submitPrintingJob,
  type PrintingRecordFilters,
} from "@/server/printing-service";
import { printingJobInputSchema } from "@/lib/validation/printing";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: PrintingRecordFilters = {
      lecturerId: sp.get("lecturerId") ?? undefined,
      search: sp.get("search") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    };
    const result = await listPrintingRecords(filters);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = printingJobInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const record = await submitPrintingJob(parsed.data, session.userId);
    await logAudit({
      userId: session.userId,
      action: "SUBMIT_PRINTING_RECORD",
      entityType: "PrintingRecord",
      entityId: record.id,
      newValue: { printingCode: record.printingCode, totalCost: record.totalCost.toString() },
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
