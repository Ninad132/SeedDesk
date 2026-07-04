import { demoSession } from "./session";
import type { Customer, CustomerLedgerRow } from "./types";

export const initialCustomers: Customer[] = [
  {
    id: "customer-001",
    companyId: demoSession.company.id,
    customerName: "DINESH RAGHUWANSHI",
    village: "KAKARAYI",
    mobileNo: "9977096885",
    remark: "VS",
    openingDifference: 0
  },
  {
    id: "customer-002",
    companyId: demoSession.company.id,
    customerName: "SARANG",
    village: "HUH",
    mobileNo: "21212",
    remark: "Credit-vs",
    openingDifference: 2000
  },
  {
    id: "customer-003",
    companyId: demoSession.company.id,
    customerName: "RAJESH PATIDAR",
    village: "UJJAIN",
    mobileNo: "9425332517",
    remark: "BANK-VS",
    openingDifference: 0
  }
];

export const initialLedgerRows: CustomerLedgerRow[] = [
  {
    id: "ledger-001",
    companyId: demoSession.company.id,
    invoiceNo: 19273,
    customerId: "customer-001",
    customerName: "DINESH RAGHUWANSHI",
    village: "KAKARAYI",
    mobileNo: "9977096885",
    remark: "VS",
    totalBillAmount: 26400,
    discount: 2400,
    grandTotal: 24000,
    cardPay: 0,
    cashTaken: 24000,
    difference: 0,
    date: "13-09-2025"
  },
  {
    id: "ledger-002",
    companyId: demoSession.company.id,
    invoiceNo: 3597,
    customerId: "customer-002",
    customerName: "SARANG",
    village: "HUH",
    mobileNo: "21212",
    remark: "Credit-vs",
    totalBillAmount: 14000,
    discount: 0,
    grandTotal: 14000,
    cardPay: 5000,
    cashTaken: 7000,
    difference: 2000,
    date: "13-09-2025"
  },
  {
    id: "ledger-003",
    companyId: demoSession.company.id,
    invoiceNo: 8846,
    customerId: "customer-003",
    customerName: "RAJESH PATIDAR",
    village: "UJJAIN",
    mobileNo: "9425332517",
    remark: "BANK-VS",
    totalBillAmount: 31800,
    discount: 0,
    grandTotal: 31800,
    cardPay: 31800,
    cashTaken: 0,
    difference: 0,
    date: "13-09-2025"
  }
];

export function receivedAmount(row: CustomerLedgerRow) {
  return row.cardPay + row.cashTaken;
}

export function calculateDifference(row: Pick<CustomerLedgerRow, "grandTotal" | "cardPay" | "cashTaken">) {
  return row.grandTotal - row.cardPay - row.cashTaken;
}
