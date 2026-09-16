import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listPriceRules, createPriceRule, type PriceRuleFilters } from "@/server/pricing-service";
import { createPriceRuleSchema } from "@/lib/validation/pricing";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: PriceRuleFilters = {
      paperSizeId: sp.get("paperSizeId") ?? undefined,
      status: (sp.get("status") as PriceRuleFilters["status"]) ?? undefined,
    };
    const rules = await listPriceRules(filters);
    return NextResponse.json({ rules });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createPriceRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const rule = await createPriceRule(parsed.data, session.userId);
    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
