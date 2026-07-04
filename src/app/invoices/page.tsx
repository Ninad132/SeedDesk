import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

type InvoiceRow = {
  due_amount: number;
  grand_total: number;
  id: string;
  invoice_date: string;
  invoice_number: number;
  invoice_prefix: string;
  customer_name: string;
  mobile: string | null;
  village: string | null;
};

export default async function InvoicesPage() {
  const supabase = createServerAnonSupabaseClient();
  const { data: invoices } = (await supabase
    .from("invoices")
    .select("id,invoice_prefix,invoice_number,invoice_date,customer_name,village,mobile,grand_total,due_amount")
    .eq("company_id", demoSession.company.id)
    .order("invoice_date", { ascending: false })) as { data: InvoiceRow[] | null };

  return (
    <AppShell eyebrow="Invoices" title="Invoices" subtitle="Invoice list is grouped from Sale rows by Invoice no.">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
