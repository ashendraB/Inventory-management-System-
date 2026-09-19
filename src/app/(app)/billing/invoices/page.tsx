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
          <h1 className="text-xl font-semibold text-gold-400">Invoices</h1>
          <p className="text-sm text-slate-400">{invoices.length} invoice(s)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/billing/invoices/history"
            className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-gold-500/50 hover:bg-white/10"
          >
            Invoice History
          </Link>
          <Link
            href="/billing/monthly"
            className="rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-brand-900 transition-all duration-150 hover:bg-gold-600 hover:shadow-md active:scale-[0.97]"
          >
            + Generate Invoices
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-brand-700 bg-brand-800 p-4 shadow-sm">
        <Link
          href="/billing/invoices"
          className={`rounded-md px-3 py-1.5 text-sm ${!status ? "bg-gold-500 font-medium text-brand-900" : "text-slate-300 hover:bg-white/10"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/billing/invoices?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm ${status === s ? "bg-gold-500 font-medium text-brand-900" : "text-slate-300 hover:bg-white/10"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-700 bg-brand-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                <tr key={inv.id} className="border-b border-white/10 last:border-0 transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/billing/invoices/${inv.id}`}
                      className="font-medium text-gold-400 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {inv.lecturer.name} <span className="text-slate-400">({inv.lecturer.lecturerCode})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {MONTH_NAMES[inv.billingMonth - 1]} {inv.billingYear}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{inv._count.items}</td>
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
