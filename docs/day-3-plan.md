# Day 3 Plan

## Goal

Build customer master and customer ledger while preserving the Excel sheet relationships.

## Implemented

- Customer master screen using Sale sheet headers:
  - `Customer name`
  - `Village`
  - `Mobile No`
  - `remark`
  - `Opening Difference`
- Customer ledger table using Sale sheet amount/payment headers:
  - `Invoice no`
  - `TOTAL BILL AMOUT`
  - `Discoumt`
  - `GRAND TOTAL`
  - `Card Pay`
  - `CASH TAKEN`
  - `Difference`
  - `Date`
- Demo ledger rows from the Excel pattern.
- Sheet relationship panel in the UI.
- Database views:
  - `sale_sheet_rows`
  - corrected `customer_balances`
- Relationship reference in `docs/sheet-relationships.md`.

## Next

Day 4 should implement invoice creation. It must connect:

- Customer selection from customer master.
- Lot/item selection from `seed_lot_availability`.
- Sale row creation using Sale sheet headers.
- Inventory deduction.
- Customer Difference calculation.
