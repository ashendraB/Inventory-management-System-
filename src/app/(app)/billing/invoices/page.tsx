import Link from "next/link";
import { listInvoices } from "@/server/billing-service";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUSES: InvoiceStatus[] = ["DRAFT", "GENERATED", "ISSUED", "PAID", "CANCELLED"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const status = sp.status as InvoiceStatus | undefined;
  const invoices = await listInvoices({ status });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoice(s)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/billing/invoices/history"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-slate-100"
          >
            Invoice History
          </Link>
          <Link
            href="/billing/monthly"
            className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-900 hover:shadow-md active:scale-[0.97]"
          >
            + Generate Invoices
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link
          href="/billing/invoices"
          className={`rounded-md px-3 py-1.5 text-sm ${!status ? "bg-brand-50 font-medium text-brand-900" : "text-slate-600 hover:bg-slate-100"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/billing/invoices?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm ${status === s ? "bg-brand-50 font-medium text-brand-900" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No invoices match these filters yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0 transition-colors hover:bg-brand-50/60">
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
                  <td className="px-4 py-3 text-slate-500">{inv._count.items}</td>
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
