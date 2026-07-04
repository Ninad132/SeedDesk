# Day 4 Plan

## Goal

Build invoice creation while preserving the Excel relationship:

`Customer master + Inventory availability -> Invoice -> Sale rows -> Inventory Sale Qty + Customer Difference`

## Implemented

- New Invoice screen using Excel-like headers.
- Customer selection from customer master.
- Lot selection from inventory lots.
- Quantity calculation:
  - `Quantity = Bags x Weight / 100`
- Amount calculation:
  - `Amount = Quantity x Rate`
- Invoice totals:
  - `TOTAL BILL AMOUT`
  - `Discoumt`
  - `GRAND TOTAL`
  - `Card Pay`
  - `CASH TAKEN`
  - `Difference`
- Sale rows preview with Sale sheet headers.
- Finalize action that:
  - creates Sale rows,
  - increases lot `Sale Qty`,
  - reduces visible `In Stock`,
  - carries customer fields into Sale rows.

## Guardrails

- Sold-out lots are disabled in the item selector.
- Adding more bags than current `In Stock` is rejected.
- The generated Sale row keeps the same customer and amount/payment fields as the Excel `Sale` sheet.

## Next

Day 5 should add printable invoice/PDF layout. It should visually match the current Excel `Invoice` sheet:

- Vasundhara header/address/license.
- Customer fields: Name, Village, Phone no.
- Item rows: Particular, Bags, Packing, Quantity, Rate, Amount.
- Total, discount, grand total, advance/account pay/cash taken.
