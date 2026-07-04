export type Language = "en" | "hi";

export type Company = {
  id: string;
  name: string;
  address: string;
  phone: string;
  seedLicenseNumber: string;
  invoicePrefix: string;
};

export type AppUser = {
  id: string;
  companyId: string;
  name: string;
  role: "owner" | "admin" | "staff";
  preferredLanguage: Language;
};

export type Session = {
  company: Company;
  user: AppUser;
};

export type SeedLot = {
  id: string;
  companyId: string;
  crop: string;
  varietyName: string;
  lotNumber: string;
  seedClass: string;
  packingKg: number;
  openingBags: number;
  soldBags: number;
  holdBags: number;
  rate: number;
  sourceState: string;
};

export type Customer = {
  id: string;
  companyId: string;
  customerName: string;
  village: string;
  mobileNo: string;
  remark: string;
  openingDifference: number;
};

export type CustomerLedgerRow = {
  id: string;
  companyId: string;
  invoiceNo: number;
  customerId: string;
  customerName: string;
  village: string;
  mobileNo: string;
  remark: string;
  totalBillAmount: number;
  discount: number;
  grandTotal: number;
  cardPay: number;
  cashTaken: number;
  difference: number;
  date: string;
};

export type SaleReportRow = {
  id: string;
  companyId: string;
  column1: string;
  invoiceNo: number;
  customerName: string;
  village: string;
  mobileNo: string;
  remark: string;
  lotNo: string;
  bags: number;
  weight: number;
  quantity: number;
  rate: number;
  amount: number;
  totalBillAmount: number;
  discount: number;
  grandTotal: number;
  cardPay: number;
  cashTaken: number;
  difference: number;
  date: string;
};
