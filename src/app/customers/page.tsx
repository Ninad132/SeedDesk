import { UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { initialCustomers, initialLedgerRows } from "@/lib/customers";
import { formatCurrency, formatNumber } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

type CustomerRow = {
  id: string;
  mobile: string | null;
  name: string;
  notes: string | null;
  opening_balance: number;
  village: string | null;
};

function getFallbackCustomers(): CustomerRow[] {
  return initialCustomers.map((customer) => ({
    id: customer.id,
    mobile: customer.mobileNo,
    name: customer.customerName,
    notes: customer.remark,
    opening_balance: customer.openingDifference,
    village: customer.village
  }));
}

export default async function CustomersPage() {
  const supabase = createServerAnonSupabaseClient();
  const { data } = (await supabase
    .from("customers")
    .select("id,name,village,mobile,opening_balance,notes")
    .eq("company_id", demoSession.company.id)
    .order("name")) as { data: CustomerRow[] | null };
  const customers = data && data.length > 0 ? data : getFallbackCustomers();
  const outstanding = initialLedgerRows.reduce((total, row) => total + row.difference, 0);

  return (
    <AppShell
      eyebrow="Customers"
      title="Customers and ledger"
      subtitle="Customer master follows the Sale sheet fields: Customer name, Village, Mobile No, remark, and Difference."
    >
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <UsersRound size={20} />
          </div>
          <span>Customer rows</span>
          <strong>{formatNumber(customers.length)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <UsersRound size={20} />
          </div>
          <span>Difference</span>
          <strong>{formatCurrency(outstanding)}</strong>
        </article>
      </section>

      <article className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h3>Customer master</h3>
            <p>Primary customer fields match the Excel Sale sheet.</p>
          </div>
        </div>
        <div className="stock-table-wrap">
          <table className="stock-table compact-table">
            <thead>
              <tr>
                <th>Customer name</th>
                <th>Village</th>
                <th>Mobile No</th>
                <th>remark</th>
                <th>Opening Difference</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.village}</td>
                  <td>{customer.mobile}</td>
                  <td>{customer.notes}</td>
                  <td>{formatCurrency(Number(customer.opening_balance ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
