# Functional Spec — Inventory Management + Printing Calculation + Lecturer Billing

Condensed from the original brief. This is the working reference for all
build phases — read it before touching pricing, stock-lot, or billing logic.

## Core concept: Inventory Item vs. Stock Lot

- **Inventory Item** = a definition, e.g. "A4 Paper 80 GSM Plain".
- **Stock Lot** = one purchase batch of that item, e.g. "A4-LOT-002: 10,000
  sheets @ Rs 5.50/sheet". Every purchase creates a *new* lot — never
  overwrite or merge lots, because price changes between lots and every
  printing job must remember exactly which lot (and which price) it used.
- For a given (Paper Size, GSM, Paper Type) combination, exactly one lot at a
  time is the **active stock lot**. The printing calculator always pulls
  paper cost from whichever lot is currently active — never a hardcoded
  price.
- **Implementation note (deviates from the literal spec structure):** rather
  than matching active lots by scanning all lots for a paperSize+gsm+paperType
  combo, each Paper `InventoryItem` IS a specific combo (paperSizeId, gsmId,
  paperTypeId live on the item, set via the three Settings screens under
  `/settings/paper-sizes`, `/settings/gsm`, `/settings/paper-types`) and
  `InventoryLot` no longer carries those fields at all — a lot just belongs to
  one item. "Active lot for A4/80/Plain" == "the active lot of whichever item
  has that paperSize/gsm/paperType". This was a deliberate simplification
  (see `INV-000002` = "A4 Paper 80 GSM Plain" as one catalog entry) that keeps
  the Add Item form simple (packs/sheets/price) while still giving Printing
  Price Rules (`PrintingPriceRule.paperSizeId/gsmId/paperTypeId`) something
  structured to match against.
- When a lot's `currentQuantity` hits 0, it's automatically marked
  `OUT_OF_STOCK`. An operator can also manually mark a lot `FINISHED`. A
  finished/out-of-stock lot must never be used for new printing jobs, but its
  historical printing records keep pointing to it forever.

## Physical sheet calculation

```
single-sided: physicalSheets = pages * copies
double-sided: physicalSheets = ceil(pages / 2) * copies
```

## Printing cost calculation (the one authoritative calculation service)

Inputs: paperSize, gsm, paperType, colourMode, sides, pages, copies,
activeLot, printingPriceRule.

```
physicalSheets      = (see above)
paperCostPerSheet    = activeLot.costPerSheet
totalPaperCost       = physicalSheets * paperCostPerSheet
printingChargePerSheet = matching PrintingPriceRule.chargePerSheet
totalPrintingCharge  = physicalSheets * printingChargePerSheet
totalCost            = totalPaperCost + totalPrintingCharge
```

Price rule lookup key: `paperSize + gsm + paperType + colourMode + sides`.
If no active lot exists for the paper configuration → block submission. If no
matching price rule exists → block submission. If required sheets exceed the
active lot's `currentQuantity` → block submission (admin override may be
added later, spec says "preferably prevent submission" with no override
path specified).

**Historical price protection (critical):** `PrintingRecord` must store the
actual `paperCostPerSheet` / `printingChargePerSheet` used at submission
time. Never recompute a historical record from current lot/price-rule data —
if prices change later, old records must show the old numbers.

## Submit Printing Record — must be one atomic transaction

1. Validate all fields.
2. Find active paper lot for the (size, gsm, type) combo.
3. Check available quantity ≥ required physical sheets.
4. Find matching pricing rule.
5. Run the calculation service above.
6. Create `PrintingRecord` (with snapshotted price fields).
7. Deduct `physicalSheets` from the lot's `currentQuantity`.
8. Create a `StockTransaction` (type `PRINTING_USAGE`) linked to the printing
   record.
9. (Billing is derived later from printing records — no separate "lecturer
   balance" table needed; monthly billing sums printing records for the
   month.)

All of this succeeds or fails together (`prisma.$transaction`). Never deduct
stock without a printing record, and never save a printing record without
deducting stock.

## Stock transaction types

`PURCHASE`, `PRINTING_USAGE`, `MANUAL_ADJUSTMENT`, `TRANSFER`, `RETURN`,
`DAMAGED`, `STOCK_FINISHED`. Every stock quantity change of any kind must
produce one of these — never silently mutate `currentQuantity`.

## Roles

- **Administrator** — everything, including pricing config, settings,
  reports, invoices.
- **Inventory Operator** — view/add inventory, create barcodes, add stock
  lots, scan/update stock, view stock transactions. Cannot touch pricing
  unless granted (`User.canManagePricing`).
- **Printing Operator** — printing calculator, scan paper lot barcode, view
  active stock, submit printing records, view printing history, view
  lecturer info. Cannot touch pricing/settings unless granted.

Enforce on the backend, not just the frontend nav (see
`src/lib/api-auth.ts`).

## Billing / invoices

- Monthly billing groups a lecturer's `PrintingRecord`s for a given
  month/year and sums paper cost, printing charge, and total.
- Invoice numbers are unique, formatted `INV-YYYY-MM-NNNN`.
- Invoice line items reference the printing record but also store their own
  `amount` snapshot — same historical-protection rule as printing records.
- Invoice statuses: `DRAFT → GENERATED → ISSUED → PAID`, or `CANCELLED`.
  Never hard-delete an issued invoice.

## Seed / test scenario (must pass)

1. Create item "A4 80 GSM Plain".
2. Create Lot 001: 5,000 sheets @ Rs 5.00. Set active.
3. Print job: 20 pages × 100 copies, single-sided, colour → 2,000 physical
   sheets. Stock → 3,000.
4. Print another job needing 3,000 sheets → stock → 0 → lot auto-marked
   `OUT_OF_STOCK`.
5. Create Lot 002: 10,000 sheets @ Rs 5.50. Scan + set active.
6. New printing job must use Rs 5.50, not Rs 5.00.
7. Monthly billing for the month must include every printing record from
   that month, using each record's own snapshotted prices.

## Full nav / page structure

See `src/config/nav.ts` — it's the single source of truth for both the
sidebar and route access control (`implemented: false` entries render
"soon" and are blocked by `src/proxy.ts` even for roles that could otherwise
see them).
