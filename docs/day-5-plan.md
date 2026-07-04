# Day 5 Plan

## Goal

Add a printable invoice/PDF layout that feels familiar to users of the Excel `Invoice` sheet.

## Implemented

- Invoice print preview on the New Invoice screen.
- Browser print support through `window.print()`.
- Print CSS that prints only the invoice preview.
- Company header:
  - Vasundhara Seeds
  - address
  - phone
  - seed license number
- Invoice metadata:
  - `Invoice no`
  - `Date`
- Customer block:
  - `नाम` / `Customer name`
  - `ग्राम` / `Village`
  - `मोबाईल` / `Phone no`
  - `remark`
- Item table:
  - `Sno`
  - `Particular`
  - `Bags`
  - `Weight`
  - `Quantity`
  - `RATE`
  - `Amount`
- Totals:
  - `Total`
  - `Discoumt`
  - `Bill amount`
  - `Advance`
  - `CASH TAKEN`
  - `Account Pay`

## Important Rule

The printable invoice uses the same invoice item rows that generate Sale rows. Do not create separate print-only calculations.

## Next

Day 6 should add reports and search:

- Invoice search.
- Date-wise sales.
- Item-wise sales.
- Stock report.
- Outstanding customer report.
