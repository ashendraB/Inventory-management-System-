import { MonthlyBillingPanel } from "@/components/billing/MonthlyBillingPanel";

export const dynamic = "force-dynamic";

export default function MonthlyBillingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Monthly Billing</h1>
        <p className="text-sm text-slate-400">
          Pick a month to see which lecturers have printing jobs not yet on an invoice, and
          generate their invoices for that month.
        </p>
      </div>
      <MonthlyBillingPanel />
    </div>
  );
}
