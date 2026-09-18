import { getDashboardSummary, getRecentActivity } from "@/server/dashboard-service";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, activity] = await Promise.all([
    getDashboardSummary(),
    getRecentActivity(),
  ]);

  const hasAnyActivity =
    activity.recentInventory.length > 0 ||
    activity.recentLots.length > 0 ||
    activity.recentPrinting.length > 0 ||
    activity.recentInvoices.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of inventory, printing activity, and billing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Inventory Items" value={summary.totalInventoryItems} />
        <StatCard
          label="Active Stock (sheets)"
          value={summary.totalActiveStock.toLocaleString()}
        />
        <StatCard
          label="Low Stock Lots"
          value={summary.lowStockItems}
          tone={summary.lowStockItems > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Out of Stock Lots"
          value={summary.outOfStockItems}
          tone={summary.outOfStockItems > 0 ? "danger" : "default"}
        />
        <StatCard label="Active Paper Lots" value={summary.activePaperLots} />
        <StatCard label="Today's Printing Jobs" value={summary.todaysPrintingJobs} />
        <StatCard
          label="This Month's Printing Cost"
          value={formatCurrency(summary.currentMonthPrintingCost)}
        />
        <StatCard label="Lecturers" value={summary.lecturerCount} />
        <StatCard label="Pending Invoices" value={summary.pendingInvoices} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Recent Activity
        </h2>
        {!hasAnyActivity ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No activity yet. Once inventory, stock lots, and printing jobs are
            added, they&apos;ll show up here.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <ActivityList
              title="Recently added inventory"
              items={activity.recentInventory.map((i) => ({
                id: i.id,
                primary: i.name,
                secondary: i.itemCode,
                date: i.createdAt,
              }))}
            />
            <ActivityList
              title="Recently added stock lots"
              items={activity.recentLots.map((l) => ({
                id: l.id,
                primary: l.lotCode,
                secondary: l.inventoryItem.name,
                date: l.createdAt,
              }))}
            />
            <ActivityList
              title="Recent printing jobs"
              items={activity.recentPrinting.map((p) => ({
                id: p.id,
                primary: p.documentName,
                secondary: `${p.lecturer.name} · ${formatCurrency(Number(p.totalCost))}`,
                date: p.createdAt,
              }))}
            />
            <ActivityList
              title="Recently generated invoices"
              items={activity.recentInvoices.map((inv) => ({
                id: inv.id,
                primary: inv.invoiceNumber,
                secondary: `${inv.lecturer.name} · ${formatCurrency(Number(inv.grandTotal))}`,
                date: inv.createdAt,
              }))}
            />
          </div>
        )}
      </div>

    </div>
  );
}

function ActivityList({
  title,
  items,
}: {
  title: string;
  items: { id: string; primary: string; secondary: string; date: Date }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">None yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="font-medium text-slate-800">{item.primary}</span>{" "}
              <span className="text-slate-500">— {item.secondary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
