import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoice } from "@/server/billing-service";
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
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div className="no-print flex items-start justify-between">
        <div>
          <Link href="/billing/invoices" className="text-sm text-indigo-600 hover:underline">
            ← Back to Invoices
          </Link>
        </div>
        <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Invoice</h1>
            <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={invoice.status} />
            <p className="mt-1 text-sm text-slate-500">{formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Billed To</p>
            <p className="font-medium text-slate-900">{invoice.lecturer.name}</p>
            <p className="text-sm text-slate-500">{invoice.lecturer.lecturerCode}</p>
            {invoice.lecturer.department && (
              <p className="text-sm text-slate-500">{invoice.lecturer.department}</p>
            )}
            {invoice.lecturer.email && (
              <p className="text-sm text-slate-500">{invoice.lecturer.email}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase text-slate-400">Billing Period</p>
            <p className="font-medium text-slate-900">
              {MONTH_NAMES[invoice.billingMonth - 1]} {invoice.billingYear}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
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
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{item.printingRecord.printingCode}</td>
                  <td className="py-2 text-slate-500">{formatDate(item.printingRecord.date)}</td>
                  <td className="py-2">{item.printingRecord.documentName}</td>
                  <td className="py-2">{item.printingRecord.physicalSheets.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-500">
                    {formatCurrency(Number(item.printingRecord.totalPaperCost))}
                  </td>
                  <td className="py-2 text-right text-slate-500">
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
          <div className="border-t border-slate-200 pt-1">
            <Row label="Grand Total" value={formatCurrency(Number(invoice.grandTotal))} bold />
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-xs font-medium uppercase text-slate-400">Notes</p>
            <p className="text-sm text-slate-700">{invoice.notes}</p>
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
      <dt className="text-slate-500">{label}</dt>
      <dd className={bold ? "text-base font-semibold text-slate-900" : "text-slate-700"}>{value}</dd>
    </div>
  );
}
