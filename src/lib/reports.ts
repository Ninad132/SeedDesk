import { demoSession } from "./session";
import type { SaleReportRow, SeedLot } from "./types";
import { availableBags, quantityQuintal, stockValue } from "./inventory";

export const saleReportRows: SaleReportRow[] = [
  {
    id: "sale-001",
    companyId: demoSession.company.id,
    column1: "VS",
    invoiceNo: 19273,
    customerName: "DINESH RAGHUWANSHI",
    village: "KAKARAYI",
    mobileNo: "9977096885",
    remark: "VS",
    lotNo: "HI-1650(पूसा ओजस्वी) MAR-25-12-763-40(3) (FII)",
    bags: 10,
    weight: 40,
    quantity: 4,
    rate: 5500,
    amount: 22000,
    totalBillAmount: 26400,
    discount: 2400,
    grandTotal: 24000,
    cardPay: 0,
    cashTaken: 24000,
    difference: 0,
    date: "13-09-2025"
  },
  {
    id: "sale-002",
    companyId: demoSession.company.id,
    column1: "VS",
    invoiceNo: 19273,
    customerName: "DINESH RAGHUWANSHI",
    village: "KAKARAYI",
    mobileNo: "9977096885",
    remark: "VS",
    lotNo: "GW-513 MAR-25-12-763-20(2) (CI)",
    bags: 2,
    weight: 40,
    quantity: 0.8,
    rate: 5500,
    amount: 4400,
    totalBillAmount: 26400,
    discount: 2400,
    grandTotal: 24000,
    cardPay: 0,
    cashTaken: 24000,
    difference: 0,
    date: "13-09-2025"
  },
  {
    id: "sale-003",
    companyId: demoSession.company.id,
    column1: "VS",
    invoiceNo: 3597,
    customerName: "SARANG",
    village: "HUH",
    mobileNo: "21212",
    remark: "Credit-vs",
    lotNo: "HI-8663 (पोषण ) APR-2024-12-763-135628-FI-B",
    bags: 4,
    weight: 40,
    quantity: 1.6,
    rate: 5000,
    amount: 8000,
    totalBillAmount: 14000,
    discount: 0,
    grandTotal: 14000,
    cardPay: 5000,
    cashTaken: 7000,
    difference: 2000,
    date: "13-09-2025"
  },
  {
    id: "sale-004",
    companyId: demoSession.company.id,
    column1: "VS",
    invoiceNo: 3597,
    customerName: "SARANG",
    village: "HUH",
    mobileNo: "21212",
    remark: "Credit-vs",
    lotNo: "GW-513 APR-2024-12-763-135624-FII-(I)-A",
    bags: 3,
    weight: 40,
    quantity: 1.2,
    rate: 5000,
    amount: 6000,
    totalBillAmount: 14000,
    discount: 0,
    grandTotal: 14000,
    cardPay: 5000,
    cashTaken: 7000,
    difference: 2000,
    date: "13-09-2025"
  },
  {
    id: "sale-005",
    companyId: demoSession.company.id,
    column1: "TL",
    invoiceNo: 8846,
    customerName: "RAJESH PATIDAR",
    village: "UJJAIN",
    mobileNo: "9425332517",
    remark: "BANK-VS",
    lotNo: "GW-513 40KG",
    bags: 5,
    weight: 40,
    quantity: 2,
    rate: 5300,
    amount: 10600,
    totalBillAmount: 31800,
    discount: 0,
    grandTotal: 31800,
    cardPay: 31800,
    cashTaken: 0,
    difference: 0,
    date: "13-09-2025"
  },
  {
    id: "sale-006",
    companyId: demoSession.company.id,
    column1: "TL",
    invoiceNo: 8846,
    customerName: "RAJESH PATIDAR",
    village: "UJJAIN",
    mobileNo: "9425332517",
    remark: "BANK-VS",
    lotNo: "HI-1655(पूसा हर्षा) 40KG",
    bags: 10,
    weight: 40,
    quantity: 4,
    rate: 5300,
    amount: 21200,
    totalBillAmount: 31800,
    discount: 0,
    grandTotal: 31800,
    cardPay: 31800,
    cashTaken: 0,
    difference: 0,
    date: "13-09-2025"
  }
];

export function getInvoiceRows(rows: SaleReportRow[]) {
  const byInvoice = new Map<number, SaleReportRow>();

  for (const row of rows) {
    if (!byInvoice.has(row.invoiceNo)) {
      byInvoice.set(row.invoiceNo, row);
    }
  }

  return Array.from(byInvoice.values());
}

export function getDateWiseSales(rows: SaleReportRow[]) {
  const totals = new Map<string, { date: string; invoices: Set<number>; grandTotal: number; cashTaken: number; cardPay: number; difference: number }>();

  for (const invoice of getInvoiceRows(rows)) {
    const current =
      totals.get(invoice.date) ??
      { cardPay: 0, cashTaken: 0, date: invoice.date, difference: 0, grandTotal: 0, invoices: new Set<number>() };
    current.invoices.add(invoice.invoiceNo);
    current.grandTotal += invoice.grandTotal;
    current.cashTaken += invoice.cashTaken;
    current.cardPay += invoice.cardPay;
    current.difference += invoice.difference;
    totals.set(invoice.date, current);
  }

  return Array.from(totals.values()).map((row) => ({
    ...row,
    invoiceCount: row.invoices.size
  }));
}

export function getItemWiseSales(rows: SaleReportRow[]) {
  const totals = new Map<string, { lotNo: string; bags: number; quantity: number; amount: number }>();

  for (const row of rows) {
    const current = totals.get(row.lotNo) ?? { amount: 0, bags: 0, lotNo: row.lotNo, quantity: 0 };
    current.bags += row.bags;
    current.quantity += row.quantity;
    current.amount += row.amount;
    totals.set(row.lotNo, current);
  }

  return Array.from(totals.values());
}

export function getStockReport(lots: SeedLot[]) {
  return lots.map((lot) => {
    const inStock = availableBags(lot);

    return {
      ...lot,
      inStock,
      quantity: quantityQuintal(inStock, lot.packingKg),
      value: stockValue(lot),
      variety: `${lot.varietyName} ${lot.lotNumber}`
    };
  });
}

export function getInventoryColumn1(lot: Pick<SeedLot, "lotNumber" | "varietyName">) {
  const itemName = `${lot.varietyName} ${lot.lotNumber}`.trim().toUpperCase();

  return itemName.endsWith("KG") ? "TL" : "VS";
}

export function getNextInvoiceNo(rows: Array<Pick<SaleReportRow, "column1" | "invoiceNo">>, column1: string) {
  // TODO: Confirm final invoice series rules with the client before database implementation.
  const matchingInvoiceNos = rows
    .filter((row) => row.column1 === column1)
    .map((row) => row.invoiceNo);

  return matchingInvoiceNos.length > 0 ? Math.max(...matchingInvoiceNos) + 1 : 1;
}
