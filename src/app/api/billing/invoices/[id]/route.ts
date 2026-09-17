import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import {
  getInvoice,
  updateInvoiceDraftFields,
  transitionInvoiceStatus,
  deleteInvoice,
} from "@/server/billing-service";
import { updateInvoiceSchema, invoiceStatusSchema } from "@/lib/validation/billing";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const invoice = await getInvoice(id);
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    return NextResponse.json({ invoice });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Body with `status` transitions the invoice's workflow state; body with
 * otherCharges/discount/notes edits a draft's adjustable fields. */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);

    if (body?.status) {
      const parsed = invoiceStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input." },
          { status: 400 }
        );
      }
      const invoice = await transitionInvoiceStatus(id, parsed.data.status, session.userId);
      return NextResponse.json({ invoice });
    }

    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const existing = await getInvoice(id);
    if (!existing) throw new ApiError(404, "Invoice not found.");
    const invoice = await updateInvoiceDraftFields(id, parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_INVOICE",
      entityType: "Invoice",
      entityId: id,
      oldValue: {
        otherCharges: existing.otherCharges.toString(),
        discount: existing.discount.toString(),
        notes: existing.notes,
      },
      newValue: {
        otherCharges: invoice.otherCharges.toString(),
        discount: invoice.discount.toString(),
        notes: invoice.notes,
      },
    });
    return NextResponse.json({ invoice });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getInvoice(id);
    if (!existing) throw new ApiError(404, "Invoice not found.");

    await deleteInvoice(id);
    await logAudit({
      userId: session.userId,
      action: "DELETE_INVOICE",
      entityType: "Invoice",
      entityId: id,
      oldValue: { invoiceNumber: existing.invoiceNumber, status: existing.status },
      newValue: null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
