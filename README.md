# Inventory Management & Lecturer Billing System

Institute inventory, paper-lot tracking, printing cost calculation, and
lecturer billing — built to the spec in the original brief (see
`docs/spec.md` if you keep a copy there).

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Prisma + SQLite for local dev (swap to PostgreSQL for production — see below)
- Custom auth: bcrypt password hashing, JWT session cookie (`jose`, edge-compatible)
- Tailwind CSS v4

## Getting started

```bash
npm install
npx prisma migrate dev   # creates/updates prisma/dev.db
npm run db:seed          # creates default users + lookup data
npm run dev
```

Open http://localhost:3000.

### Seeded logins

| Username      | Password       | Role                |
|---------------|----------------|---------------------|
| `admin`       | `admin123`     | Administrator       |
| `inventory.op`| `inventory123` | Inventory Operator  |
| `printing.op` | `printing123`  | Printing Operator   |

Change these before any real deployment.

## Switching to PostgreSQL later

1. Set `DATABASE_URL` in `.env` to your Postgres connection string.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Run `npx prisma migrate dev` again to regenerate migrations for Postgres.

## Project status — build phases

This is being built in phases (see the sidebar — unbuilt pages are marked
"soon"):

- [x] **Phase 1** — project setup, database schema, authentication, roles, dashboard shell
- [x] **Phase 2** — inventory items (with generated Item ID + barcode), categories, suppliers
  - Extra: delete an item (Administrator-only). This is a soft delete — it sets `deletedAt` and nothing else, so the item just stops appearing in Inventory Items, Stock Lots, Active Paper Stock, and the printing calculator's paper picker/barcode scan. Its stock lots, stock transactions, and any printing records/invoices already built from it are never touched, so deleting an item can never change existing reports or billing.
- [x] **Phase 3** — stock lots (add/activate/finish), stock transactions, barcode scanning
  - Renamed "Stock / Lots" to "Stock". It now also lists non-paper items (which don't use lots — their quantity is tracked directly on the item) in a separate section, so every added item shows up here.
- [x] **Phase 4** — paper size/GSM/type config, printing price configuration
  - Extra: edit (charge/effective-to, inline in the table) and delete a pricing rule. Delete is blocked once a rule has priced a job (deactivate instead) — the record's billed amount is already snapshotted either way, so this only guards the rule's traceability, not billing itself.
- [x] **Phase 5** — printing calculator (active-lot lookup, cost calculation, atomic stock deduction), printing records
  - Extra: attach the actual document (PDF) being printed — page count is auto-detected client-side and fills "Number of Pages", and the file is previewed inline on the page. "Submit & Print" saves the record and prints that inline preview through the browser's own print dialog (e.g. Edge's), in one click — no new tab/window, so there's nothing for a popup blocker to catch. The record is saved the moment Submit is clicked, since no website can detect when a user actually finishes a native print dialog. Word/.docx files don't have a real page count in the file itself, so those need manual entry and printing from Word/your own viewer.
  - Removed Subject/Course/Batch/Printing Machine fields from the calculator (unused in practice).
  - Extra: edit and delete a printing record. Edit only allows Notes and a Wasted Sheets count (sheets spoiled by a printing-time error) — raising/lowering it deducts/restores the delta from the same stock lot but never changes what's billed. Delete fully undoes a job: restores its sheets (including any wasted) to the lot and removes the record; blocked once it's been invoiced.
- [x] **Phase 6** — lecturer management (list, add, edit, deactivate/reactivate, delete). Lecturer IDs (`LEC-0001`, ...) come from the same Counter mechanism as item/lot/printing codes. Deactivating a lecturer removes them from the Printing Calculator's picker without touching their existing printing records. Delete is blocked once a lecturer has any printing records (deactivate instead). Add/Edit/Delete are Administrator-only; Printing Operator can view the list (per spec §4, "view lecturer info").
- [ ] Phase 7 — monthly billing, invoice generation (PDF)
- [ ] Phase 8 — reports, exports, audit log UI

## Key design decisions

- **Roles**: `ADMINISTRATOR`, `INVENTORY_OPERATOR`, `PRINTING_OPERATOR`, stored
  on `User.role`. Two extra per-user flags (`canManagePricing`,
  `canManageSettings`) let an admin grant an operator pricing/settings access
  without changing their base role, per the spec's "unless permission is
  granted" wording.
- **Route protection happens in two layers**: `src/proxy.ts` (Next's
  middleware convention, renamed in Next 16) blocks unauthenticated/wrong-role
  access to whole page sections using the single source of truth in
  `src/config/nav.ts`. Individual API routes additionally call
  `requireRole()` from `src/lib/api-auth.ts` — never rely on the frontend nav
  alone for authorization.
- **Historical price protection** (critical business rule): printing records
  will snapshot `paperCostPerSheet` and `printingChargePerSheet` at the time
  of the job, not a reference to the current config. This is already modeled
  in `prisma/schema.prisma` (`PrintingRecord` stores its own decimal columns
  rather than only foreign-keying to the live price rule).
