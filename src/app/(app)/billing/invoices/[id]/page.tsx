import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoice } from "@/server/billing-service";
import { getAllSettings } from "@/server/system-settings-service";
import { InvoiceStatusActions } from "@/components/billing/InvoiceStatusActions";
import { InvoiceDraftEditForm } from "@/components/billing/InvoiceDraftEditForm";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([getInvoice(id), getAllSettings()]);
  if (!invoice) notFound();

  const hasInstituteDetails =
    settings.institute_name || settings.institute_address || settings.institute_phone || settings.institute_email;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="no-print flex items-start justify-between">
        <div>
          <Link href="/billing/invoices" className="text-sm text-gold-400 hover:underline">
            ← Back to Invoices
          </Link>
        </div>
        <InvoiceStatusActions
          invoiceId={invoice.id}
          status={invoice.status}
          lecturerEmail={invoice.lecturer.email}
        />
      </div>

      <div className="print-invoice rounded-xl border border-brand-700 bg-brand-800 p-8 shadow-sm print:border-0 print:shadow-none">
        {hasInstituteDetails && (
          <div className="mb-4 border-b border-white/10 pb-4">
            {settings.institute_name && (
              <p className="text-lg font-semibold text-white">{settings.institute_name}</p>
            )}
            {settings.institute_address && (
              <p className="text-sm text-slate-400">{settings.institute_address}</p>
            )}
            {(settings.institute_phone || settings.institute_email) && (
              <p className="text-sm text-slate-400">
                {[settings.institute_phone, settings.institute_email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Invoice</h1>
            <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={invoice.status} />
            <p className="mt-1 text-sm text-slate-400">{formatDate(invoice.invoiceDate)}</p>
            {invoice.emailedAt && (
              <p className="no-print mt-1 text-xs text-slate-400">
                Emailed {formatDate(invoice.emailedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Billed To</p>
            <p className="font-medium text-white">{invoice.lecturer.name}</p>
            <p className="text-sm text-slate-400">{invoice.lecturer.lecturerCode}</p>
            {invoice.lecturer.department && (
              <p className="text-sm text-slate-400">{invoice.lecturer.department}</p>
            )}
            {invoice.lecturer.email && (
              <p className="text-sm text-slate-400">{invoice.lecturer.email}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase text-slate-400">Billing Period</p>
            <p className="font-medium text-white">
              {MONTH_NAMES[invoice.billingMonth - 1]} {invoice.billingYear}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-white/10 text-left text-xs font-semibold uppercase text-slate-400">
              <th className="py-2">Job</th>
              <th className="py-2">Date</th>
              <th className="py-2">Document</th>
              <th className="py-2">Sheets</th>
              <th className="py-2 text-right">Paper Cost</th>
              <th className="py-2 text-right">Printing Charge</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No printing jobs on this invoice.
                </td>
              </tr>
            ) : (
              invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-white/10 last:border-0">
                  <td className="py-2">{item.printingRecord.printingCode}</td>
                  <td className="py-2 text-slate-400">{formatDate(item.printingRecord.date)}</td>
                  <td className="py-2">{item.printingRecord.documentName}</td>
                  <td className="py-2">{item.printingRecord.physicalSheets.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-400">
                    {formatCurrency(Number(item.printingRecord.totalPaperCost))}
                  </td>
                  <td className="py-2 text-right text-slate-400">
                    {formatCurrency(Number(item.printingRecord.totalPrintingCharge))}
                  </td>
                  <td className="py-2 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <Row label="Paper Cost" value={formatCurrency(Number(invoice.totalPaperCost))} />
          <Row label="Printing Charge" value={formatCurrency(Number(invoice.totalPrintingCharge))} />
          {Number(invoice.otherCharges) > 0 && (
            <Row label="Other Charges" value={formatCurrency(Number(invoice.otherCharges))} />
          )}
          {Number(invoice.discount) > 0 && (
            <Row label="Discount" value={`- ${formatCurrency(Number(invoice.discount))}`} />
          )}
          <div className="border-t border-white/10 pt-1">
            <Row label="Grand Total" value={formatCurrency(Number(invoice.grandTotal))} bold />
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-xs font-medium uppercase text-slate-400">Notes</p>
            <p className="text-sm text-slate-200">{invoice.notes}</p>
          </div>
        )}

        {settings.invoice_footer_note && (
          <div className="mt-6 border-t border-dashed border-white/20 pt-4">
            <p className="text-xs text-slate-400">{settings.invoice_footer_note}</p>
          </div>
        )}
      </div>

      {invoice.status === "DRAFT" && (
        <InvoiceDraftEditForm
          invoiceId={invoice.id}
          initialValues={{
            otherCharges: invoice.otherCharges.toString(),
            discount: invoice.discount.toString(),
            notes: invoice.notes ?? "",
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className={bold ? "text-base font-semibold text-white" : "text-slate-200"}>{value}</dd>
    </div>
  );
}
