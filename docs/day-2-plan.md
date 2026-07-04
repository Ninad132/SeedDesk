# Day 2 Plan

## Goal

Build the inventory master needed before billing can work:

- Products and varieties.
- Seed lots.
- Packing size.
- Opening stock.
- Hold stock.
- Rate.
- Available stock.
- Low-stock/sold-out status.

## Current Implementation

- Added a working inventory screen in the app shell.
- Added demo Vasundhara lot data.
- Added an add-lot form.
- Added live stock totals.
- Added a lot-wise table with quantity and stock value calculations.
- Added Hindi/English labels for the inventory workflow.
- Added `seed_lot_availability` database view for future invoice selection.
- Aligned inventory and purchase-entry labels with `Copy of Billing.xlsx`.
- Added `docs/excel-column-map.md` as the source of truth for workbook-to-app labels.

## Important Rules

- Every lot must remain company-scoped with `company_id`.
- Invoice item selection should use only available stock.
- `In Stock` is calculated as `Purchse Qty - Sale Qty - HOLD`.
- Sold-out lots should be blocked during invoice creation.
- Low-stock lots should be visible but warned.

## Next

Day 3 should add customer master and customer ledger:

- Customer name, village, mobile.
- Opening balance.
- Search/filter.
- Payment history structure.
- Outstanding balance view.
