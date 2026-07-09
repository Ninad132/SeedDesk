import { ReceiptIndianRupee, UsersRound, WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BalanceRow = {
  company_id: string;
  customer_id: string;
  "Customer name": string;
  "Difference": number;
  "GRAND TOTAL": number;
  "Mobile No": string | null;
  "Opening Difference": number;
  "Received": number;
  "Village": string | null;
};

type PaymentRow = {
  amount: number;
  mode: string;
};

type InvoiceLedgerRow = {
  customer_name: string;
  due_amount: number;
  grand_total: number;
  id: string;
  invoice_date: string;
  invoice_number: number;
  invoice_prefix: string;
  mobile: string | null;
  paid_amount: number;
  payments: PaymentRow[];
  village: string | null;
};

export default async function LedgerPage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: balanceRows }, { data: invoiceRows }] = (await Promise.all([
    supabase
      .from("customer_balances")
      .select("*")
      .eq("company_id", demoSession.company.id)
      .order("Customer name"),
    supabase
      .from("invoices")
      .select("id,invoice_prefix,invoice_number,invoice_date,customer_name,village,mobile,grand_total,paid_amount,due_amount,payments(amount,mode)")
      .eq("company_id", demoSession.company.id)
      .order("invoice_date", { ascending: false })
      .order("invoice_number", { ascending: false })
  ])) as [{ data: BalanceRow[] | null }, { data: InvoiceLedgerRow[] | null }];

  const balances = balanceRows ?? [];
  const invoices = invoiceRows ?? [];
  const totalBilled = invoices.reduce((total, row) => total + Number(row.grand_total ?? 0), 0);
  const totalReceived = invoices.reduce((total, row) => total + Number(row.paid_amount ?? 0), 0);
  const totalPending = balances.reduce((total, row) => total + Number(row["Difference"] ?? 0), 0);
  const customersWithCredit = balances.filter((row) => Number(row["Difference"] ?? 0) > 0).length;

  return (
    <AppShell
      eyebrow="Ledger"
      title="Customer ledger"
      subtitle="Customer-wise balances and invoice-wise pending payments."
    >
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <ReceiptIndianRupee size={20} />
          </div>
          <span>Total billed</span>
          <strong>{formatCurrency(totalBilled)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <WalletCards size={20} />
          </div>
          <span>Total received</span>
          <strong>{formatCurrency(totalReceived)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <WalletCards size={20} />
          </div>
          <span>Credit pending</span>
          <strong>{formatCurrency(totalPending)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <UsersRound size={20} />
          </div>
          <span>Customers with credit</span>
          <strong>{formatNumber(customersWithCredit)}</strong>
        </article>
      </section>

      <article className="panel table-panel">
        <div className="panel-heading">
          <UsersRound size={19} />
          <h3>Customer balance summary</h3>
        </div>
        <div className="stock-table-wrap">
          <table className="stock-table compact-table">
            <thead>
              <tr>
                <th>Customer name</th>
                <th>Village</th>
                <th>Mobile No</th>
                <th>Opening Difference</th>
                <th>GRAND TOTAL</th>
                <th>Received</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((row) => (
                <tr key={row.customer_id}>
                  <td>{row["Customer name"]}</td>
                  <td>{row["Village"]}</td>
                  <td>{row["Mobile No"]}</td>
                  <td>{formatCurrency(Number(row["Opening Difference"] ?? 0))}</td>
                  <td>{formatCurrency(Number(row["GRAND TOTAL"] ?? 0))}</td>
                  <td>{formatCurrency(Number(row["Received"] ?? 0))}</td>
                  <td>{formatCurrency(Number(row["Difference"] ?? 0))}</td>
                </tr>
              ))}
              {balances.length === 0 ? <tr><td colSpan={7}>No customer balances yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel table-panel ledger-invoice-panel">
        <div className="panel-heading">
          <WalletCards size={19} />
          <h3>Invoice-wise ledger</h3>
        </div>
        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Invoice no</th>
                <th>Date</th>
                <th>Customer name</th>
                <th>Village</th>
                <th>Mobile No</th>
                <th>GRAND TOTAL</th>
                <th>Cash</th>
                <th>Card / Bank</th>
                <th>Received</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const cash = (invoice.payments ?? [])
                  .filter((payment) => payment.mode === "cash")
                  .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);
                const cardOrBank = (invoice.payments ?? [])
                  .filter((payment) => payment.mode === "card" || payment.mode === "bank")
                  .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

                return (
                  <tr key={invoice.id}>
                    <td>{invoice.invoice_prefix}-{invoice.invoice_number}</td>
                    <td>{invoice.invoice_date}</td>
                    <td>{invoice.customer_name}</td>
                    <td>{invoice.village}</td>
                    <td>{invoice.mobile}</td>
                    <td>{formatCurrency(Number(invoice.grand_total ?? 0))}</td>
                    <td>{formatCurrency(cash)}</td>
                    <td>{formatCurrency(cardOrBank)}</td>
                    <td>{formatCurrency(Number(invoice.paid_amount ?? 0))}</td>
                    <td>{formatCurrency(Number(invoice.due_amount ?? 0))}</td>
                  </tr>
                );
              })}
              {invoices.length === 0 ? <tr><td colSpan={10}>No invoices saved yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
