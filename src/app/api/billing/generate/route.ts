import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import {
  generateInvoiceForLecturer,
  generateInvoicesForMonth,
} from "@/server/billing-service";
import {
  generateInvoiceSchema,
  generateMonthInvoicesSchema,
} from "@/lib/validation/billing";

/** Body { lecturerId, month, year } generates/tops up one lecturer's
 * invoice; { month, year } alone generates for every lecturer with
 * unbilled printing records that month. */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);

    if (body?.lecturerId) {
      const parsed = generateInvoiceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input." },
          { status: 400 }
        );
      }
      const result = await generateInvoiceForLecturer(
        parsed.data.lecturerId,
        parsed.data.year,
        parsed.data.month,
        session.userId
      );
      if (!result) {
        return NextResponse.json(
          { error: "No unbilled printing records for this lecturer in that month." },
          { status: 409 }
        );
      }
      return NextResponse.json({ result });
    }

    const parsed = generateMonthInvoicesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const results = await generateInvoicesForMonth(
      parsed.data.year,
      parsed.data.month,
      session.userId
    );
    return NextResponse.json({ results });
  } catch (err) {
    return handleApiError(err);
  }
}
