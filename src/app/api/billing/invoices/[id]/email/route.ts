import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getInvoice, markInvoiceEmailed } from "@/server/billing-service";
import { getAllSettings } from "@/server/system-settings-service";
import { renderInvoiceEmail } from "@/lib/invoice-email";
import { sendMail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const invoice = await getInvoice(id);
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (!invoice.lecturer.email) {
      throw new ApiError(
        400,
        `${invoice.lecturer.name} has no email address on file. Add one from Lecturers before sending.`
      );
    }

    const settings = await getAllSettings();
    const html = renderInvoiceEmail(invoice, settings);
    const period = `${MONTH_NAMES[invoice.billingMonth - 1]} ${invoice.billingYear}`;
    const instituteName = settings.institute_name || "Printing Bill";

    await sendMail({
      to: invoice.lecturer.email,
      subject: `${instituteName} — Invoice ${invoice.invoiceNumber} (${period})`,
      html,
    });

    const updated = await markInvoiceEmailed(id);
    await logAudit({
      userId: session.userId,
      action: "EMAIL_INVOICE",
      entityType: "Invoice",
      entityId: id,
      newValue: { invoiceNumber: invoice.invoiceNumber, sentTo: invoice.lecturer.email },
    });

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
