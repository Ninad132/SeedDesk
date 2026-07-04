import InvoiceForm, {
  type InvoiceCustomerOption,
  type InvoiceLotOption
} from "./_components/InvoiceForm";
import { initialCustomers } from "@/lib/customers";
import { initialSeedLots, availableBags } from "@/lib/inventory";
import { getInventoryColumn1 } from "@/lib/reports";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

type CustomerRow = {
  id: string;
  mobile: string | null;
  name: string;
  notes: string | null;
  village: string | null;
};

type InventoryRow = {
  available_bags: number;
  company_id: string;
  display_name: string;
  lot_number: string;
  packing_kg: number;
  rate: number;
  seed_class: string | null;
  seed_lot_id: string;
};

type InvoiceNumberRow = {
  invoice_number: number;
  invoice_prefix: string;
};

function fallbackCustomers(): InvoiceCustomerOption[] {
  return initialCustomers.map((customer) => ({
    customerName: customer.customerName,
    id: customer.id,
    mobileNo: customer.mobileNo,
    remark: customer.remark,
    village: customer.village
  }));
}

function fallbackLots(): InvoiceLotOption[] {
  return initialSeedLots.map((lot) => ({
    availableBags: availableBags(lot),
    column1: getInventoryColumn1(lot),
    id: lot.id,
    lotNo: `${lot.varietyName} ${lot.lotNumber}`,
    packingKg: lot.packingKg,
    rate: lot.rate
  }));
}

export default async function InvoicePage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: customerRows }, { data: lotRows }, { data: invoiceRows }] = (await Promise.all([
    supabase
      .from("customers")
      .select("id,name,village,mobile,notes")
      .eq("company_id", demoSession.company.id)
      .order("name"),
    supabase
      .from("seed_lot_availability")
      .select("seed_lot_id,company_id,display_name,lot_number,packing_kg,rate,available_bags,seed_class")
      .eq("company_id", demoSession.company.id)
      .order("display_name"),
    supabase
      .from("invoices")
      .select("invoice_prefix,invoice_number")
      .eq("company_id", demoSession.company.id)
      .order("invoice_number")
  ])) as [{ data: CustomerRow[] | null }, { data: InventoryRow[] | null }, { data: InvoiceNumberRow[] | null }];

  const customers =
    customerRows && customerRows.length > 0
      ? customerRows.map((customer) => ({
          customerName: customer.name,
          id: customer.id,
          mobileNo: customer.mobile ?? "",
          remark: customer.notes ?? "",
          village: customer.village ?? ""
        }))
      : fallbackCustomers();
  const lots =
    lotRows && lotRows.length > 0
      ? lotRows.map((lot) => ({
          availableBags: Number(lot.available_bags ?? 0),
          column1: getInventoryColumn1({
            lotNumber: lot.lot_number,
            varietyName: lot.display_name
          }),
          id: lot.seed_lot_id,
          lotNo: `${lot.display_name} ${lot.lot_number}`,
          packingKg: Number(lot.packing_kg ?? 0),
          rate: Number(lot.rate ?? 0)
        }))
      : fallbackLots();
  const existingInvoices =
    invoiceRows?.map((invoice) => ({
      column1: invoice.invoice_prefix,
      invoiceNo: invoice.invoice_number
    })) ?? [];

  return <InvoiceForm customers={customers} existingInvoices={existingInvoices} lots={lots} />;
}
