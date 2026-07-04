# SeedDesk

SeedDesk is a multi-company SaaS foundation for seed dealers. The first tenant is Vasundhara Seeds, but every business record is designed to belong to a company through `company_id`.

## Day 1 Scope

- Next.js application scaffold.
- Desktop-first app shell.
- Company-aware mock session.
- Hindi/English language switch.
- Initial SaaS database schema.
- Vasundhara company settings seed data.

## MVP Routes

- `/` Dashboard
- `/invoice` New invoice and print preview
- `/reports` Search and reports
- `/inventory` Inventory
- `/customers` Customer master
- `/ledger` Customer ledger
- `/invoices` Invoice list
- `/purchases` Purchase/stock entry view
- `/settings` Company settings

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

Supabase wiring has been added, but the app still uses demo data until a project is created.

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. Run `db/schema.sql`.
4. Run `db/seed.sql`.
5. Add project credentials to `.env.local`.

See [docs/supabase-setup.md](docs/supabase-setup.md).

## Product Direction

The MVP focuses on seed dealer billing, lot-wise inventory, and customer dues. GST compliance and mobile optimization are intentionally out of scope for the first version.
