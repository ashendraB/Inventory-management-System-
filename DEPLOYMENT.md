# Deployment Guide

How this app goes from your PC to a real, live website with its own
database — GitHub for source control and CI, Supabase for the database,
Vercel for hosting. Follow the steps in order; each one says exactly what to
click.

## 1. Create the GitHub repository

1. Go to [github.com/new](https://github.com/new).
2. Repository name: `inventory-billing-system` (or anything you like).
3. Leave it **empty** — do NOT check "Add a README", "Add .gitignore", or
   "Choose a license". The project already has all of these; adding them on
   GitHub too would create conflicts.
4. Visibility: Private is recommended (this app handles real institute data).
5. Click **Create repository**.
6. Copy the URL GitHub shows you (looks like
   `https://github.com/<your-username>/inventory-billing-system.git`).

Send me that URL and I'll push the `main` and `dev` branches (already
prepared locally) up to it.

## 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / log in (GitHub
   login is easiest).
2. Click **New project**.
3. Pick an organization (or create one), name the project (e.g.
   `eminent-edification`), set a **database password** — Supabase generates
   one for you, or set your own; **save it somewhere safe**, you'll need it
   in the connection string.
4. Pick the region closest to you/your users.
5. Click **Create new project** and wait ~2 minutes for it to provision.
6. Once it's ready: go to **Project Settings** (gear icon) > **Database**.
7. Under **Connection string**, you'll see two you need:
   - **Transaction pooler** (port `6543`) — this is `DATABASE_URL`.
   - **Session pooler** or **Direct connection** (port `5432`) — this is
     `DIRECT_URL`.
8. Copy both full connection strings (they include your password — replace
   `[YOUR-PASSWORD]` in them with the real password from step 3 if Supabase
   shows it as a placeholder).

Send me both connection strings (or paste them straight into your local
`.env` yourself, following `.env.example`) and I'll:
- switch `prisma/schema.prisma`'s migration history to Postgres,
- run the migration against your new Supabase database,
- re-seed the default admin/operator accounts and lookup data.

## 3. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) and sign up / log in with your
   **GitHub account** (this lets Vercel see your repos directly).
2. Click **Add New... > Project**.
3. Select the `inventory-billing-system` repo you created in step 1 (you
   may need to click "Configure GitHub App" and grant it access to that
   repo first).
4. Vercel auto-detects Next.js — leave the build settings as default.
5. Before clicking Deploy, open **Environment Variables** and add every
   variable from your `.env` (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`,
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
   `SMTP_FROM`) — same names, same values as your local `.env`.
6. Under **Settings > Git**, set the **Production Branch** to `main`. Every
   other branch (including `dev`) automatically gets its own preview URL on
   every push — a safe place to check changes before they reach `main`.
7. Click **Deploy**.

From this point on, Vercel redeploys automatically: pushing to `dev` updates
its preview URL, and merging `dev` into `main` updates the live production
site. No manual deploy step needed.

## The day-to-day workflow, once this is all set up

```
dev branch  →  where you (or I) make changes, pushed automatically to a
                Vercel preview URL to check before it's real
main branch →  production — merging dev into main deploys the live site
```

- New feature or fix: work happens on `dev` (or a branch off `dev`), gets
  pushed, Vercel gives it a preview URL.
- Happy with it: merge `dev` into `main` (a pull request on GitHub, or
  `git checkout main && git merge dev && git push`) — production updates.
- `.github/workflows/ci.yml` runs lint + typecheck + build automatically on
  every push/PR to `main`/`dev`, so a broken change is flagged before it
  merges.

## What I've already done locally (not yet pushed — waiting on step 1)

- Renamed the local branch `master` → `main`, created `dev` from it.
- Added `.github/workflows/ci.yml` (lint/typecheck/build on every push/PR).
- Added `.env.example` documenting every required variable.
- Updated `prisma/schema.prisma`'s datasource to `postgresql` with a
  `directUrl` (Supabase's recommended pooled + direct connection split).
  The existing SQLite migration history will be replaced with a fresh
  Postgres-compatible one once you give me the Supabase connection strings
  — this only affects the *schema history*, not any of your actual data,
  since it's initializing a brand-new empty database.

**Note on your existing data**: this connects the app to a brand-new, empty
Supabase database — your current inventory/lecturers/printing
records/invoices (in the local SQLite file) won't automatically appear
there. If you want that data carried over rather than starting fresh, tell
me and I'll write a one-time export/import script; otherwise I'll just
re-run the seed script to recreate the default admin/operator logins and
lookup data (paper sizes, categories, etc.) on the new database.
