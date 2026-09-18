import "server-only";
import { formatCurrency, formatDate } from "@/lib/format";
import type { getInvoice } from "@/server/billing-service";
import type { SettingsMap } from "@/lib/system-settings-defs";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type InvoiceWithItems = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;

/** Plain inline HTML (table-based, no external CSS) so it renders
 * consistently across email clients — mirrors the invoice detail page's
 * layout, minus anything interactive. */
export function renderInvoiceEmail(invoice: InvoiceWithItems, settings: SettingsMap) {
  const period = `${MONTH_NAMES[invoice.billingMonth - 1]} ${invoice.billingYear}`;
  const instituteName = settings.institute_name || "";

  const rows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${item.printingRecord.printingCode}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${formatDate(item.printingRecord.date)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.printingRecord.documentName)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.printingRecord.physicalSheets.toLocaleString()}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(Number(item.amount))}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;">
    ${
      instituteName
        ? `<div style="border-bottom:2px solid #12213D;padding-bottom:12px;margin-bottom:16px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#12213D;">${escapeHtml(instituteName)}</p>
            ${settings.institute_address ? `<p style="margin:2px 0 0;font-size:13px;color:#64748b;">${escapeHtml(settings.institute_address)}</p>` : ""}
            ${
              settings.institute_phone || settings.institute_email
                ? `<p style="margin:2px 0 0;font-size:13px;color:#64748b;">${[settings.institute_phone, settings.institute_email].filter(Boolean).map(escapeHtml).join(" &middot; ")}</p>`
                : ""
            }
          </div>`
        : ""
    }

    <h1 style="font-size:20px;margin:0 0 4px;color:#0f172a;">Invoice ${invoice.invoiceNumber}</h1>
    <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${period}</p>

    <p style="margin:0;font-size:13px;color:#64748b;">Dear ${escapeHtml(invoice.lecturer.name)},</p>
    <p style="font-size:14px;line-height:1.5;">Please find your printing bill for <strong>${period}</strong> below.</p>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
      <thead>
        <tr style="text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;">
          <th style="padding:6px 8px;border-bottom:2px solid #e2e8f0;">Job</th>
          <th style="padding:6px 8px;border-bottom:2px solid #e2e8f0;">Date</th>
          <th style="padding:6px 8px;border-bottom:2px solid #e2e8f0;">Document</th>
          <th style="padding:6px 8px;border-bottom:2px solid #e2e8f0;text-align:right;">Sheets</th>
          <th style="padding:6px 8px;border-bottom:2px solid #e2e8f0;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" style="padding:12px;text-align:center;color:#94a3b8;">No printing jobs on this invoice.</td></tr>`}</tbody>
    </table>

    <table style="width:100%;max-width:260px;margin-left:auto;margin-top:12px;font-size:13px;">
      <tr><td style="padding:2px 0;color:#64748b;">Paper Cost</td><td style="padding:2px 0;text-align:right;">${formatCurrency(Number(invoice.totalPaperCost))}</td></tr>
      <tr><td style="padding:2px 0;color:#64748b;">Printing Charge</td><td style="padding:2px 0;text-align:right;">${formatCurrency(Number(invoice.totalPrintingCharge))}</td></tr>
      ${Number(invoice.otherCharges) > 0 ? `<tr><td style="padding:2px 0;color:#64748b;">Other Charges</td><td style="padding:2px 0;text-align:right;">${formatCurrency(Number(invoice.otherCharges))}</td></tr>` : ""}
      ${Number(invoice.discount) > 0 ? `<tr><td style="padding:2px 0;color:#64748b;">Discount</td><td style="padding:2px 0;text-align:right;">- ${formatCurrency(Number(invoice.discount))}</td></tr>` : ""}
      <tr><td style="padding:6px 0 0;border-top:1px solid #e2e8f0;font-weight:700;">Grand Total</td><td style="padding:6px 0 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCurrency(Number(invoice.grandTotal))}</td></tr>
    </table>

    ${
      settings.invoice_footer_note
        ? `<p style="margin-top:24px;padding-top:12px;border-top:1px dashed #cbd5e1;font-size:12px;color:#64748b;">${escapeHtml(settings.invoice_footer_note)}</p>`
        : ""
    }
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
