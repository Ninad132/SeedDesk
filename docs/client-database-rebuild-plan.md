# Client Database Rebuild Plan

Source files reviewed:

- `INWARD WHEAT 2026 (4).xlsm`
- `Vasundhara_Billing (2).html`
- `wheat_inward_v3.html`
- existing `Copy of Billing.xlsx`

## Confirmed Business Meaning

- `VS` = government certified seed.
- `TL` = unregistered seed.
- TL/VS must be selected and stored as a seed type. It should not be inferred only from `KG` in the item name.
- Invoice number series still needs to remain seed-type aware: separate series for `VS` and `TL`, unless client later confirms a different rule.

## New Workbook Structure

`INWARD WHEAT 2026 (4).xlsm` is the operational database workbook, not just billing.

Important sheets:

- `daily aawak`: raw weighbridge/daily inward rows.
- `INWARDDATA`: main operational table `Table_15`.
- `GRADING PACKING`: grading and packing entry/calculation screen.
- `PACKING`: packing-only entry/calculation screen.
- `Database`: pivot-style operational summary by material/variety.
- `RATHI SHIFTING`: shifting/transfer data.

## Main INWARDDATA Columns

The central table is `Table_15` with these groups:

- Inward/weighbridge:
  - `SNO`, `SLIPNO`, `Truck No`, `First Wt`, `DateTime In`, `Second Wt`, `DateTime Out`, `Net Wt`
  - `Material Name`, `Supplier Name`
  - `Bags`, `Size`, `Bag Wgt`, `Wgt-Bag`, `BOUNCING`, `NET WEIGHT`
  - `MOISTURE`, `GERMINATION`, `REMARK`, `RATE`, `AMOUNT`, `CHEQUE`, `CASH`
- Grading:
  - `GRADING DATE`, `CODE`, `VARIETY`, `WEIGHT RECPT`
  - `GRADED BAGS`, `GRADED BAG SIZE`, `GRADED QUANTITY`, `GRADED LOOSE`
  - `Total Graded`, `UNDERSIZE`, `U/s Bags`, `UNDERSIZE %`, `Final Graded`, `LOCATION`, `DIFFERENCE`
- Packing:
  - `PACKING DATE`, `Graded2`, `Packed Quantity`, `Remaining Quantity`
  - `NO OF BAGS`, `PACKING BAG SIZE`, `Packing Quantity`, `PACKING LOOSE`, `GHAMSI`
  - `Total packed`, `Difference3`, `MOISTURE4`, `GERMINATION5`, `LOT NO`, `REMARK / LOCATOIN`
  - `Remaining Grading`, `Remaining packing`, `BAGS COUNT`

## Formula Rules To Preserve

Inward:

- `Bag Wgt = Bags * Size`
- `Wgt-Bag = (Net Wt - Bag Wgt) / 100`
- `BOUNCING = ROUNDUP((Net Wt / 90) * 0.003, 2)`
- `NET WEIGHT = Wgt-Bag - BOUNCING`
- `AMOUNT = RATE * NET WEIGHT`

Grading:

- `GRADED BAG QUANTITY = GRADED BAGS * GRADED BAG SIZE / 100`
- `Total Graded = GRADED BAG QUANTITY + GRADED LOOSE`
- `UNDERSIZE % = UNDERSIZE / WEIGHT RECPT * 100`
- `Final Graded = Total Graded + UNDERSIZE`
- `DIFFERENCE = Final Graded - Remaining/received basis in workbook`

Packing:

- `Packing Quantity = NO OF BAGS * PACKING BAG SIZE / 100`
- `Total packed = Packing Quantity + PACKING LOOSE + GHAMSI`
- `Difference = Remaining/graded basis - Total packed`

## Existing HTML Prototype Findings

`Vasundhara_Billing (2).html`:

- Mobile-first billing prototype.
- Uses `localStorage`, not Supabase.
- Has dashboard, new bill, all bills, credit ledger, stock, settings.
- Supports dealer/wholesale mode and separate invoice settings.
- Has denomination/cash counting UI.
- Has bill PDF generation via `jspdf`.
- Has stock add/edit/delete and local bill history.

`wheat_inward_v3.html`:

- Mobile-first inward/grading/packing prototype.
- Pages: dashboard, slips, add, grade, ledger.
- Supports adding/editing inward slips.
- Supports grading sessions and packing sessions.
- Has supplier/variety ledger rate handling.

## Rebuild Direction

The app should become two connected workspaces:

1. Billing workspace
   - Purchases/stock lots
   - Inventory
   - New invoice
   - Customer ledger
   - Reports

2. Processing workspace
   - Inward slips
   - Supplier/variety inward ledger
   - Grading sessions
   - Packing sessions
   - Processing dashboard

Packed output now feeds sale inventory:

`Inward -> Grading -> Packing -> Seed Lot Inventory -> Invoice`

For TL/unregistered seed, inventory may be added directly through purchase/stock entry.

Client clarified on 2026-07-06 that inward remains the entry point. The current implementation now separates raw receipt from saleable stock:

`Manual Inward entry -> Purchases/raw receipt -> Grading -> Packing -> Inventory -> New Invoice item list`

Implementation rule:

- Saving an inward slip creates/updates a raw internal stock lot for the purchase ledger.
- The created purchase row should be visible in Purchases.
- The raw inward lot should not be selectable in New Invoice.
- Saving a packing session creates/updates the saleable packed stock lot.
- Only packed lots should be visible in sale Inventory and selectable in New Invoice if they have available bags.
- The inward slip number is used as the initial inventory lot reference: `SLIP-{SLIPNO}` until the client provides a separate lot number.

## Immediate Product Changes

- Rename `Column 1` concepts to `Seed type` in UI.
- Store `VS`/`TL` explicitly on seed lots.
- Keep invoice number series based on seed type.
- Add new database tables for inward, grading, packing, and supplier ledger before replacing the current purchase-only flow.
