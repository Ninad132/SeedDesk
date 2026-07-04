# Day 1 Plan

## Decisions

- Product: seed dealer billing, lot inventory, and dues management SaaS.
- First tenant: Vasundhara Seeds.
- Future tenants: other seed dealers/companies.
- Invoice compliance: non-GST.
- Languages: Hindi and English switchable.
- Mobile: not required for MVP.
- Credit/dues: required.
- Historical migration: not required. Only current masters/current stock will be entered or imported.

## Day 1 Deliverables

- App foundation.
- Multi-tenant database schema with `company_id`.
- Company profile/settings structure.
- Language dictionary and switcher.
- Dashboard shell for Vasundhara.
- Placeholder navigation for upcoming Day 2-7 modules.

## Tenant Rule

Every business table must include `company_id`:

- users
- customers
- products
- seed_lots
- purchases
- purchase_items
- invoices
- invoice_items
- payments
- company_settings

Queries must always filter by the active user's company.
