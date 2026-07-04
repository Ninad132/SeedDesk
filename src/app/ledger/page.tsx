import { WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

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

export default async function LedgerPage() {
  const supabase = createServerAnonSupabaseClient();
  const { data: rows } = (await supabase
    .from("customer_balances")
    .select("*")
    .eq("company_id", demoSession.company.id)
    .order("Customer name")) as { data: BalanceRow[] | null };

  return (
    <AppShell
      eyebrow="Ledger"
      title="Customer ledger"
      subtitle="Difference is calculated from GRAND TOTAL minus Card Pay minus CASH TAKEN."
    >
      <article className="panel table-panel">
        <div className="panel-heading">
          <WalletCards size={19} />
          <h3>Customer ledger</h3>
        </div>
        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Invoice no</th>
                <th>Customer name</th>
                <th>Village</th>
                <th>Mobile No</th>
                <th>GRAND TOTAL</th>
                <th>Received</th>
                <th>Opening Difference</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row) => (
                <tr key={row.customer_id}>
                  <td>-</td>
                  <td>{row["Customer name"]}</td>
                  <td>{row["Village"]}</td>
                  <td>{row["Mobile No"]}</td>
                  <td>{formatCurrency(Number(row["GRAND TOTAL"] ?? 0))}</td>
                  <td>{formatCurrency(Number(row["Received"] ?? 0))}</td>
                  <td>{formatCurrency(Number(row["Opening Difference"] ?? 0))}</td>
                  <td>{formatCurrency(Number(row["Difference"] ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
