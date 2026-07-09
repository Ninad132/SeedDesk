import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import DownloadSavedInvoiceButton from "./_components/DownloadSavedInvoiceButton";

type InvoiceItemRow = {
  amount: number;
  bags: number;
  item_name: string;
  packing_kg: number;
  quantity_quintal: number;
  rate: number;
};

type InvoiceRow = {
  discount_amount: number;
  due_amount: number;
  grand_total: number;
  id: string;
  invoice_date: string;
  invoice_items: InvoiceItemRow[];
  invoice_number: number;
  invoice_prefix: string;
  customer_name: string;
  mobile: string | null;
  notes: string | null;
  paid_amount: number;
  subtotal: number;
  village: string | null;
};

export default async function InvoicesPage() {
  const supabase = createServerAnonSupabaseClient();
  const { data: invoices } = (await supabase
    .from("invoices")
    .select("id,invoice_prefix,invoice_number,invoice_date,customer_name,village,mobile,notes,subtotal,discount_amount,grand_total,paid_amount,due_amount,invoice_items(item_name,bags,packing_kg,quantity_quintal,rate,amount)")
    .eq("company_id", demoSession.company.id)
    .order("invoice_date", { ascending: false })) as { data: InvoiceRow[] | null };

  return (
    <AppShell eyebrow="Invoices" title="Invoices" subtitle="Saved customer bills.">
      <article className="panel table-panel">
        <div className="panel-heading">
          <FileText size={19} />
          <h3>Invoices</h3>
        </div>
        <div className="stock-table-wrap">
          <table className="stock-table compact-table">
            <thead>
              <tr>
                <th>Invoice no</th>
                <th>Customer name</th>
                <th>Village</th>
                <th>Mobile No</th>
                <th>GRAND TOTAL</th>
                <th>Difference</th>
                <th>Date</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoice_prefix}-{invoice.invoice_number}</td>
                  <td>{invoice.customer_name}</td>
                  <td>{invoice.village}</td>
                  <td>{invoice.mobile}</td>
                  <td>{formatCurrency(Number(invoice.grand_total ?? 0))}</td>
                  <td>{formatCurrency(Number(invoice.due_amount ?? 0))}</td>
                  <td>{invoice.invoice_date}</td>
                  <td>
                    <DownloadSavedInvoiceButton
                      invoice={{
                        customerName: invoice.customer_name,
                        discountAmount: Number(invoice.discount_amount ?? 0),
                        grandTotal: Number(invoice.grand_total ?? 0),
                        invoiceDate: invoice.invoice_date,
                        invoiceNumber: invoice.invoice_number,
                        invoicePrefix: invoice.invoice_prefix,
                        items: (invoice.invoice_items ?? []).map((item) => ({
                          amount: Number(item.amount ?? 0),
                          bags: Number(item.bags ?? 0),
                          itemName: item.item_name,
                          packingKg: Number(item.packing_kg ?? 0),
                          quantity: Number(item.quantity_quintal ?? 0),
                          rate: Number(item.rate ?? 0)
                        })),
                        mobileNo: invoice.mobile ?? "",
                        paidAmount: Number(invoice.paid_amount ?? 0),
                        remark: invoice.notes ?? "",
                        subtotal: Number(invoice.subtotal ?? 0),
                        village: invoice.village ?? ""
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
