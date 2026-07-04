# Excel Column Map

The app should feel familiar to Vasundhara users who currently work from `Copy of Billing.xlsx`. Keep screen labels close to the workbook labels unless there is a strong reason to change them.

## Purchase Sheet

| Excel header | App usage |
| --- | --- |
| Date | Purchase/stock entry date |
| Column3 | Crop/base variety name |
| Lot No | Seed lot number |
| Variety | Full sellable item name |
| Bags | Number of bags received |
| Weight | Packing size in kg |
| Quantity | Bags x Weight / 100 |
| Column1 | Sale rate |
| Column2 | Optional remark/source |
| RATE | Source/state marker in the current workbook |

## Inventory Sheet

| Excel header | App usage |
| --- | --- |
| Variety | Full item/lot display name |
| Purchse Qty | Purchase/opening bags, keeping Excel spelling for familiarity |
| Sale Qty | Bags already sold |
| In Stock | Available bags |
| RATE | Rate used for billing |
| HOLD | Bags reserved/held |
| Column 1 | TL/VS/class marker used by the current workbook |

## Sale Sheet

| Excel header | Future app usage |
| --- | --- |
| Invoice no | Invoice number |
| Customer name | Customer name |
| Village | Customer village |
| Mobile No | Customer mobile |
| remark | Invoice remark |
| Lot No | Sold item/lot |
| Bags | Bags sold |
| Weight | Packing size |
| Quantity | Bags x Weight / 100 |
| Rate | Sale rate |
| Amount | Line amount |
| TOTAL BILL AMOUT | Invoice subtotal, keeping Excel spelling where shown |
| Discoumt | Discount, keeping Excel spelling where shown |
| GRAND TOTAL | Final bill amount |
| Card Pay | Card/bank payment |
| CASH TAKEN | Cash received |
| Difference | Balance/difference |
| Date | Invoice date |

## Product Rule

Use Excel labels on table headers and primary form fields. Add cleaner explanations only in helper text, docs, or tooltips.

## Relationship Rule

Visible app screens must also preserve workbook relationships:

- `Purchase` feeds `Inventory.Purchse Qty`.
- `Sale` feeds `Inventory.Sale Qty`.
- `Inventory.In Stock` feeds invoice item availability.
- `Invoice` creates `Sale` rows.
- `Sale` payment columns feed customer ledger `Difference`.
