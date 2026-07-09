# Sheet Relationships

The app must preserve the workbook relationships from `Copy of Billing.xlsx`.

## Workbook Flow

1. `INWARDDATA` is the source for raw stock received.
2. `Purchase` is the raw receipt ledger generated from inward entries.
3. `GRADING PACKING` / `PACKING` produces packed saleable lots.
4. `Inventory` shows packed saleable lots minus sold/held bags.
5. `Invoice` is the entry/print screen that writes rows into `Sale`.
6. Customer ledger is calculated from `Sale` invoice totals and payment columns.

## Relationship Rules

### Purchase -> Inventory

- Inward-generated `Purchase` rows are raw receipt rows.
- Raw inward lots are not directly saleable.
- Packing output creates the saleable inventory lot.
- Packed `NO OF BAGS` contributes to `Inventory.Purchse Qty` / available bags.
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
- `Table2` column 10 maps to Inventory seed type.
- Client clarified seed type meaning:
  - `VS` = government certified seed
  - `TL` = unregistered seed
- Seed type must be selected/stored explicitly. It should not be inferred only from `KG` in the item name.
- The next invoice number is calculated as max existing Sale `Invoice no` for that seed type, plus one.

TODO: Confirm whether dealer/wholesale mode from `Vasundhara_Billing (2).html` needs a separate invoice number series in addition to `TL` and `VS`.

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
