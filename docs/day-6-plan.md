# Day 6 Plan

## Goal

Add reports and search while keeping report data tied to the workbook relationships.

## Implemented

- Invoice/Sale row search.
- Date-wise sales.
- Item-wise sales.
- Stock report.
- Outstanding customer report.
- Report relationship rules shown in the UI.

## Report Sources

- Invoice search reads Sale-style rows.
- Date-wise sales groups unique `Invoice no` totals.
- Item-wise sales groups `Lot No`.
- Stock report follows Inventory:
  - `In Stock = Purchse Qty - Sale Qty - HOLD`
- Outstanding report follows customer ledger:
  - `Difference = GRAND TOTAL - Card Pay - CASH TAKEN`

## Excel Header Alignment

Report tables keep workbook headers where possible:

- `Invoice no`
- `Customer name`
- `Village`
- `Mobile No`
- `remark`
- `Lot No`
- `Bags`
- `Weight`
- `Quantity`
- `RATE`
- `Amount`
- `GRAND TOTAL`
- `Card Pay`
- `CASH TAKEN`
- `Difference`
- `Date`

## Next

Day 7 should focus on polish and deployment readiness:

- Route structure instead of one changing page.
- Persist data in a database.
- Basic auth/company session.
- Final UI checks.
- Deployment instructions.
