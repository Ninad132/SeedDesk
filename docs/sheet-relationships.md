# Sheet Relationships

The app must preserve the workbook relationships from `Copy of Billing.xlsx`.

## Workbook Flow

1. `Purchase` is the source for stock received.
2. `Sale` is the source for stock sold and customer billing.
3. `Inventory` is calculated from `Purchase` and `Sale`.
4. `Invoice` is the entry/print screen that writes rows into `Sale`.
5. Customer ledger is calculated from `Sale` invoice totals and payment columns.

## Relationship Rules

### Purchase -> Inventory

- `Purchase.Variety` maps to `Inventory.Variety`.
- `Purchase.Bags` contributes to `Inventory.Purchse Qty`.
- `Purchase.Weight` is used to calculate `Purchase.Quantity`.
- `Inventory.In Stock = Purchse Qty - Sale Qty - HOLD`.

### Sale -> Inventory

- `Sale.Lot No` maps to `Inventory.Variety`.
- `Sale.Bags` contributes to `Inventory.Sale Qty`.
- Invoice creation must reject or warn if sale bags exceed `Inventory.In Stock`.

### Invoice -> Sale

- `Invoice` is not just a report. It is the counter-entry screen.
- Each invoice item creates a sale row.
- `Quantity = Bags x Weight / 100`.
- `Amount = Quantity x Rate`.
- `Difference = GRAND TOTAL - Card Pay - CASH TAKEN`.
- Customer fields copied into sale rows:
  - `Customer name`
  - `Village`
  - `Mobile No`
  - `remark`
- Amount fields copied/calculated into sale rows:
  - `TOTAL BILL AMOUT`
  - `Discoumt`
  - `GRAND TOTAL`
  - `Card Pay`
  - `CASH TAKEN`
  - `Difference`
  - `Date`

### Sale -> Customer Ledger

- Customer ledger groups rows by customer identity.
- Primary customer identity should be mobile number when available, otherwise name + village.
- `Difference = GRAND TOTAL - Card Pay - CASH TAKEN`.
- Opening balance is stored separately as `Opening Difference`.

## Day 4 Implementation

The app now demonstrates the relationship in-memory:

- New Invoice reads customer rows from customer master.
- New Invoice reads lot availability from inventory.
- Finalize Invoice creates Sale rows.
- Finalize Invoice increments lot sold bags, which reduces `In Stock`.

## Day 5 Print Implementation

- Printable invoice reads the same draft invoice rows used for Sale row generation.
- Print totals are not separately calculated; they reuse `TOTAL BILL AMOUT`, `Discoumt`, `GRAND TOTAL`, payment, and `Difference` calculations.
- Browser print can be used to save PDF.

## Invoice Number Logic

The original workbook calculates invoice number from:

- `A10 = VLOOKUP(H10, Table2, 10, false)`
- `Invoice no = MAXIFS(Sale!B:B, Sale!A:A, A10) + 1`

In the app:

- `H10` maps to selected `Lot No` / item.
- `Table2` maps to Inventory.
- `Table2` column 10 maps to Inventory `Column 1`.
- `Column 1` is derived from the selected inventory item:
  - items ending in `KG` use `TL`
  - other lot-numbered items use `VS`
- The next invoice number is calculated as max existing Sale `Invoice no` for that `Column 1`, plus one.

TODO: Confirm this invoice series rule with the client before final implementation. The current app mirrors the workbook pattern, but the client may want separate series behavior for `TL`, `VS`, credit invoices, or different seed categories.

## Day 6 Report Implementation

- Invoice search reads Sale-style rows.
- Date-wise sales groups unique `Invoice no` values to avoid double-counting multi-item invoices.
- Item-wise sales groups by `Lot No`.
- Stock report uses Inventory-style calculation.
- Outstanding report uses Sale payment columns and `Difference`.

## Database Views

- `seed_lot_availability` reflects the Inventory sheet.
- `sale_sheet_rows` reflects the Sale sheet.
- `customer_balances` reflects the customer ledger.

Any future feature should update these relationships before changing visible screens.
