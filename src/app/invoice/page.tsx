import InvoiceForm, {
  type InvoiceCustomerOption,
  type InvoiceLotOption
} from "./_components/InvoiceForm";
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
  inward_slip_id: string | null;
  lot_number: string;
  packing_kg: number;
  rate: number;
  seed_class: string | null;
  seed_lot_id: string;
  source_state: string | null;
};

type InvoiceNumberRow = {
  invoice_number: number;
  invoice_prefix: string;
};

type InwardMaterialRow = {
  id: string;
  slip_no: number;
  supplier_name: string;
};

function normalizeSeedType(seedClass: string | null | undefined) {
  const value = (seedClass ?? "").trim().toUpperCase();
  return value.startsWith("TL") ? "TL" : "VS";
}

export default async function InvoicePage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: customerRows }, { data: lotRows }, { data: invoiceRows }, { data: inwardRows }] = (await Promise.all([
    supabase
      .from("customers")
      .select("id,name,village,mobile,notes")
      .eq("company_id", demoSession.company.id)
      .order("name"),
    supabase
      .from("seed_lot_availability")
      .select("seed_lot_id,company_id,display_name,inward_slip_id,lot_number,packing_kg,rate,available_bags,seed_class,source_state")
      .eq("company_id", demoSession.company.id)
      .eq("source_state", "PACKED")
      .order("display_name"),
    supabase
      .from("invoices")
      .select("invoice_prefix,invoice_number")
      .eq("company_id", demoSession.company.id)
      .order("invoice_number"),
    supabase
      .from("inward_slips")
      .select("id,slip_no,supplier_name")
      .eq("company_id", demoSession.company.id)
  ])) as [
    { data: CustomerRow[] | null },
    { data: InventoryRow[] | null },
    { data: InvoiceNumberRow[] | null },
    { data: InwardMaterialRow[] | null }
  ];

  const customers =
    customerRows?.map((customer) => ({
          customerName: customer.name,
          id: customer.id,
          mobileNo: customer.mobile ?? "",
          remark: customer.notes ?? "",
          village: customer.village ?? ""
        })) ?? [];
  const inwardIds = new Set((inwardRows ?? []).map((row) => row.id));
  const inwardById = new Map((inwardRows ?? []).map((row) => [row.id, row]));
  const lots =
    lotRows?.filter((lot) => lot.inward_slip_id && inwardIds.has(lot.inward_slip_id)).map((lot) => {
        const inward = lot.inward_slip_id ? inwardById.get(lot.inward_slip_id) : null;

        return {
          availableBags: Number(lot.available_bags ?? 0),
          column1: normalizeSeedType(lot.seed_class),
          id: lot.seed_lot_id,
          inwardSlipNo: inward?.slip_no ?? null,
          lotNo: `${lot.display_name} ${lot.lot_number}`,
          packingKg: Number(lot.packing_kg ?? 0),
          rate: Number(lot.rate ?? 0),
          supplierName: inward?.supplier_name ?? ""
        };
      }) ?? [];
  const existingInvoices =
    invoiceRows?.map((invoice) => ({
      column1: invoice.invoice_prefix,
      invoiceNo: invoice.invoice_number
    })) ?? [];

  return <InvoiceForm customers={customers} existingInvoices={existingInvoices} lots={lots} />;
}
