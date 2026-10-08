import { getDashboardSummary, getRecentActivity } from "@/server/dashboard-service";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { ActivityPanel, ActivityIcons } from "@/components/dashboard/ActivityPanel";
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
        <h1 className="text-xl font-semibold text-gold-400">Dashboard</h1>
        <p className="text-sm text-slate-400">
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

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-base font-semibold text-gold-400">Recent Activity</h2>
          <p className="text-xs text-slate-400">Latest 5 in each area</p>
        </div>
        {!hasAnyActivity ? (
          <p className="rounded-xl border border-brand-700 bg-brand-800 py-10 text-center text-sm text-slate-400">
            No activity yet. Once inventory, stock lots, and printing jobs are
            added, they&apos;ll show up here.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityPanel
              title="Printing jobs"
              icon={ActivityIcons.printing}
              viewAllHref="/printing/records"
              emptyText="No printing jobs yet."
              emptyHref="/printing/calculator"
              emptyLabel="Start a printing job →"
              rows={activity.recentPrinting.map((p) => ({
                id: p.id,
                href: `/printing/records/${p.id}`,
                title: p.documentName,
                subtitle: `${p.printingCode} · ${p.lecturer.name} · ${p.physicalSheets.toLocaleString()} sheets`,
                value: formatCurrency(Number(p.totalCost)),
                date: p.createdAt,
              }))}
            />
            <ActivityPanel
              title="Invoices"
              icon={ActivityIcons.invoices}
              viewAllHref="/billing/invoices"
              emptyText="No invoices generated yet."
              emptyHref="/billing/monthly"
              emptyLabel="Go to Monthly Billing →"
              rows={activity.recentInvoices.map((inv) => ({
                id: inv.id,
                href: `/billing/invoices/${inv.id}`,
                title: inv.invoiceNumber,
                subtitle: inv.lecturer.name,
                value: (
                  <span className="flex items-center justify-end gap-2">
                    <StatusBadge status={inv.status} />
                    {formatCurrency(Number(inv.grandTotal))}
                  </span>
                ),
                date: inv.createdAt,
              }))}
            />
            <ActivityPanel
              title="Inventory items"
              icon={ActivityIcons.inventory}
              viewAllHref="/inventory/items"
              emptyText="No inventory items yet."
              emptyHref="/inventory/items/new"
              emptyLabel="Add an inventory item →"
              rows={activity.recentInventory.map((i) => ({
                id: i.id,
                href: `/inventory/items/${i.id}`,
                title: i.name,
                subtitle: `${i.itemCode} · ${i.category.name}`,
                date: i.createdAt,
              }))}
            />
            <ActivityPanel
              title="Stock lots"
              icon={ActivityIcons.lots}
              viewAllHref="/inventory/lots"
              emptyText="No stock lots yet."
              emptyHref="/inventory/items"
              emptyLabel="Open inventory items →"
              rows={activity.recentLots.map((l) => ({
                id: l.id,
                href: `/inventory/lots/${l.id}`,
                title: l.inventoryItem.name,
                subtitle: l.lotCode,
                value: `+${l.quantityPurchased.toLocaleString()}`,
                date: l.createdAt,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}