# Day 7 Plan

## Goal

Finish the MVP shape by turning the daily screens into a navigable product.

## Implemented

- Shared app shell and sidebar navigation.
- Dashboard as the first screen.
- Routes for:
  - `/`
  - `/invoice`
  - `/reports`
  - `/inventory`
  - `/customers`
  - `/ledger`
  - `/invoices`
  - `/purchases`
  - `/settings`
- Dashboard summary cards.
- Dashboard module cards.
- Reusable format helpers.
- All sidebar destinations resolve without 404.

## MVP Coverage

- Multi-company-ready schema exists in `db/schema.sql`.
- Excel column mapping exists in `docs/excel-column-map.md`.
- Sheet relationships are tracked in `docs/sheet-relationships.md`.
- Inventory, customers, ledger, invoice, print, and reports are represented in the app.
- Build passes across all routes.

## Still Needed Before Real Customer Use

- Connect PostgreSQL/Supabase database.
- Add authentication and company session.
- Persist invoice, stock, customer, and payment writes.
- Import current opening stock from Vasundhara.
- Add edit/delete permissions.
- Add production deployment environment variables.
- Test with real counter workflow before delivery.

## Recommended Next Technical Step

Move from in-memory demo data to a real database, starting with:

1. Supabase project.
2. Apply `db/schema.sql`.
3. Replace demo data files with database queries.
4. Add row-level security by `company_id`.
5. Add auth users linked to `app_users`.
