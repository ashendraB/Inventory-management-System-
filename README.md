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
- [ ] Phase 2 — inventory items, categories, suppliers
- [ ] Phase 3 — stock lots, stock transactions, barcode generation/scanning
- [ ] Phase 4 — paper size/GSM/type config, printing price configuration
- [ ] Phase 5 — printing calculator (active-lot lookup, cost calculation, stock deduction)
- [ ] Phase 6 — printing records, lecturer management
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
