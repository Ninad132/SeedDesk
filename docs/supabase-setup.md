# Supabase Setup

The app is prepared for Supabase, but it still uses local demo data until a Supabase project is created and credentials are added.

## 1. Create Project

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `db/schema.sql`.
4. Run `db/seed.sql`.

## 2. Environment

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use the service role key only for server-side scripts and admin operations. Never expose it in browser code.

## 3. Current App State

Added:

- `@supabase/supabase-js`
- browser client helper
- server client helper
- database type definitions
- environment template

Not yet changed:

- UI pages still read from local demo arrays.
- Auth is not wired.
- Writes are not persisted.

## 4. Recommended Migration Order

1. Company/settings read.
2. Inventory read from `seed_lot_availability`.
3. Customers read/write.
4. Invoice finalization transaction.
5. Reports from `sale_sheet_rows` and `customer_balances`.
6. Auth and row-level security.

## 5. Important Production Rule

Every query must be scoped by `company_id`. This is the key SaaS safety boundary.
