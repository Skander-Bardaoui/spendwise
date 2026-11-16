# SpendWise

**Live app:** [https://sppendwise.netlify.app/](https://sppendwise.netlify.app/)

SpendWise is a personal expense tracker that turns day-to-day spending into a
clear monthly picture. Expenses sync across devices through Supabase Auth and
Postgres with Row Level Security, receipts are stored in a private Supabase
Storage bucket, and every user only sees their own data. The interface is in
French.

## Features

- Email/password authentication with a persisted session and account settings.
- Dashboard with monthly totals, spending by category, and trends over time.
- Expenses CRUD with categories, dates, notes, search, and filtering.
- Monthly budgets per category with progress and overspending warnings.
- Recurring expenses for subscriptions and regular bills.
- CSV bank-statement import with a column-mapping step.
- Receipt upload and preview for each expense (private Storage bucket).
- Reports as PDF and Excel exports.
- Light and dark themes, responsive layout, and keyboard-accessible dialogs.

## Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, Vite, TypeScript strict, Tailwind CSS v4 |
| Data fetching | TanStack Query |
| Forms and validation | React Hook Form, Zod |
| Charts | Recharts |
| Backend | Supabase Auth, Postgres + RLS, Storage, Edge Functions |
| Reports | jsPDF with autotable, SheetJS, Papa Parse |
| Hosting | Netlify (`netlify.toml`, SPA rewrite) |

## Run it

```bash
npm install
cp frontend/.env.example frontend/.env
```

Fill `frontend/.env` with the values from your Supabase project
(**Project Settings → API**):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then start both the app from the repository root:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Database

Apply the SQL files in `supabase/` to a Supabase project, in order:

1. `init_expense_tracker.sql` — tables, policies, and triggers.
2. `rls_and_receipts_bucket.sql` — RLS hardening and the private receipts bucket.
3. `storage_receipts_policies.sql` — storage policies scoped to `auth.uid()`.
4. `seed.sql` — default categories for new accounts.

Never expose the `service_role` key to the frontend. Only the project URL and
the anon key belong in `VITE_*` variables.

## Build

```bash
npm run build
npm run preview
```

## Project structure

```text
frontend/          React SPA (workspace)
  src/
    components/    auth, budgets, categories, dashboard, expenses, recurring, settings, ui
    hooks/         auth, budgets, categories, dashboard, expenses, recurring, templates
    services/      Supabase data access and receipts
    pages/         Dashboard, Expenses, Budgets, Categories, Recurring, Import, Settings
supabase/          Schema, RLS, storage policies, seed, tests
netlify.toml       Build config and SPA rewrite
```
