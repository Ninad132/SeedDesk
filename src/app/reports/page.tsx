import { BarChart3, Boxes, ReceiptIndianRupee, WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import { ReportSearchTable, type SaleSheetReportRow } from "./_components/ReportSearchTable";

type RawSaleSheetRow = Record<string, unknown>;
type RawStockRow = Record<string, unknown>;
type RawBalanceRow = Record<string, unknown>;

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function stringValue(value: unknown) {
  return String(value ?? "");
}

function mapSaleRow(row: RawSaleSheetRow): SaleSheetReportRow {
  return {
    amount: numberValue(row.Amount),
    bags: numberValue(row.Bags),
    customerName: stringValue(row["Customer name"]),
    date: stringValue(row.Date),
    invoiceNo: numberValue(row["Invoice no"]),
    lotNo: stringValue(row["Lot No"]),
    mobileNo: stringValue(row["Mobile No"]),
    quantity: numberValue(row.Quantity),
    rate: numberValue(row.Rate),
    remark: stringValue(row.remark),
    village: stringValue(row.Village),
    weight: numberValue(row.Weight)
  };
}

export default async function ReportsPage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: saleRows }, { data: stockRows }, { data: balanceRows }] = (await Promise.all([
    supabase.from("sale_sheet_rows").select("*").eq("company_id", demoSession.company.id),
    supabase.from("seed_lot_availability").select("*").eq("company_id", demoSession.company.id),
    supabase.from("customer_balances").select("*").eq("company_id", demoSession.company.id)
  ])) as [{ data: RawSaleSheetRow[] | null }, { data: RawStockRow[] | null }, { data: RawBalanceRow[] | null }];

  const rows = (saleRows ?? []).map(mapSaleRow);
  const uniqueInvoices = new Set(rows.map((row) => row.invoiceNo));
  const grandTotalByInvoice = new Map<number, number>();

  for (const row of saleRows ?? []) {
    const invoiceNo = numberValue(row["Invoice no"]);
    if (!grandTotalByInvoice.has(invoiceNo)) {
      grandTotalByInvoice.set(invoiceNo, numberValue(row["GRAND TOTAL"]));
    }
  }

  const grandTotal = Array.from(grandTotalByInvoice.values()).reduce((total, value) => total + value, 0);
  const soldBags = rows.reduce((total, row) => total + row.bags, 0);
  const outstanding = (balanceRows ?? []).reduce((total, row) => total + numberValue(row.Difference), 0);
  const stockBags = (stockRows ?? []).reduce((total, row) => total + numberValue(row.available_bags), 0);

  const stats = [
    { label: "Invoice count", value: formatNumber(uniqueInvoices.size), icon: BarChart3 },
    { label: "GRAND TOTAL", value: formatCurrency(grandTotal), icon: ReceiptIndianRupee },
    { label: "Bags", value: formatNumber(soldBags), icon: Boxes },
    { label: "Difference", value: formatCurrency(outstanding), icon: WalletCards }
  ];

  return (
    <AppShell
      eyebrow="Reports"
      title="Reports and search"
      subtitle="Sales, stock, and customer balances."
    >
      <section className="stats-grid">
        {stats.map(({ icon: Icon, label, value }) => (
          <article className="stat-card" key={label}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="inventory-layout">
        <article className="panel">
          <div className="panel-heading">
            <BarChart3 size={19} />
            <h3>Reports</h3>
          </div>
          <ul className="step-list">
            <li>Invoice search</li>
            <li>Inventory summary</li>
            <li>Customer balances</li>
            <li>Date-wise sales</li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <Boxes size={19} />
            <h3>In Stock</h3>
          </div>
          <p>{formatNumber(stockBags)}</p>
        </article>

        <ReportSearchTable rows={rows} />
      </section>
    </AppShell>
  );
}
