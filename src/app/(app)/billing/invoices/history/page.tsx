import Link from "next/link";
import { listInvoiceHistory } from "@/server/billing-service";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function InvoiceHistoryPage() {
  const invoices = await listInvoiceHistory();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Invoice History</h1>
          <p className="text-sm text-slate-500">
            {invoices.length} paid or cancelled invoice{invoices.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/billing/invoices" className="text-sm text-brand-800 hover:underline">
          ← Back to Invoices
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No paid or cancelled invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/billing/invoices/${inv.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {inv.lecturer.name} <span className="text-slate-400">({inv.lecturer.lecturerCode})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {MONTH_NAMES[inv.billingMonth - 1]} {inv.billingYear}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(inv.grandTotal))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(inv.invoiceDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
