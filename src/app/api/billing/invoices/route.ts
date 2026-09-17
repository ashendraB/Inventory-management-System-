import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listInvoices, type InvoiceFilters } from "@/server/billing-service";
import type { InvoiceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: InvoiceFilters = {
      status: (sp.get("status") as InvoiceStatus) ?? undefined,
      lecturerId: sp.get("lecturerId") ?? undefined,
    };
    const invoices = await listInvoices(filters);
    return NextResponse.json({ invoices });
  } catch (err) {
    return handleApiError(err);
  }
}
