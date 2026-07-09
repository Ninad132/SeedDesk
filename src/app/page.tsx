import { BarChart3, Boxes, CalendarDays, PackageCheck, ReceiptIndianRupee, UsersRound, WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardInvoiceRow = {
  due_amount: number;
  grand_total: number;
  invoice_date: string;
};

type DashboardInvoiceItemRow = {
  amount: number;
  bags: number;
  item_name: string;
  quantity_quintal: number;
};

type DashboardInventoryRow = {
  available_bags: number;
  available_value: number;
  display_name: string;
  inward_slip_id: string | null;
};

type DashboardCustomerRow = {
  id: string;
};

type DashboardInwardRow = {
  id: string;
};

type ProductSummary = {
  amount: number;
  bags: number;
  name: string;
  quantity: number;
};

type InventorySummary = {
  bags: number;
  name: string;
  value: number;
};

async function getDashboardData() {
  const supabase = createServerAnonSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const [invoiceResult, invoiceItemResult, inventoryResult, customerResult, inwardResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("grand_total,due_amount,invoice_date")
      .eq("company_id", demoSession.company.id),
    supabase
      .from("invoice_items")
      .select("item_name,bags,quantity_quintal,amount")
      .eq("company_id", demoSession.company.id),
    supabase
      .from("seed_lot_availability")
      .select("display_name,inward_slip_id,available_bags,available_value")
      .eq("company_id", demoSession.company.id)
      .eq("source_state", "PACKED"),
    supabase
      .from("customers")
      .select("id")
      .eq("company_id", demoSession.company.id),
    supabase
      .from("inward_slips")
      .select("id")
      .eq("company_id", demoSession.company.id)
  ]);

  const inwardIds = new Set(((inwardResult.data ?? []) as DashboardInwardRow[]).map((row) => row.id));

  return {
    customers: (customerResult.data ?? []) as DashboardCustomerRow[],
    inventory: ((inventoryResult.data ?? []) as DashboardInventoryRow[]).filter((lot) => lot.inward_slip_id && inwardIds.has(lot.inward_slip_id)),
    invoiceItems: (invoiceItemResult.data ?? []) as DashboardInvoiceItemRow[],
    invoices: (invoiceResult.data ?? []) as DashboardInvoiceRow[],
    today
  };
}

function summarizeProducts(items: DashboardInvoiceItemRow[]) {
  const productMap = new Map<string, ProductSummary>();

  for (const item of items) {
    const name = item.item_name || "Unknown item";
    const current = productMap.get(name) ?? { amount: 0, bags: 0, name, quantity: 0 };
    current.amount += Number(item.amount ?? 0);
    current.bags += Number(item.bags ?? 0);
    current.quantity += Number(item.quantity_quintal ?? 0);
    productMap.set(name, current);
  }

  return Array.from(productMap.values()).sort((a, b) => b.amount - a.amount);
}

function summarizeInventory(lots: DashboardInventoryRow[]) {
  const inventoryMap = new Map<string, InventorySummary>();

  for (const lot of lots) {
    const name = lot.display_name || "Unknown item";
    const current = inventoryMap.get(name) ?? { bags: 0, name, value: 0 };
    current.bags += Number(lot.available_bags ?? 0);
    current.value += Number(lot.available_value ?? 0);
    inventoryMap.set(name, current);
  }

  return Array.from(inventoryMap.values()).sort((a, b) => b.bags - a.bags);
}

export default async function DashboardPage() {
  const { customers, inventory, invoiceItems, invoices, today } = await getDashboardData();
  const totalRevenue = invoices.reduce((total, row) => total + Number(row.grand_total ?? 0), 0);
  const todaysSale = invoices
    .filter((row) => row.invoice_date === today)
    .reduce((total, row) => total + Number(row.grand_total ?? 0), 0);
  const totalBagsSold = invoiceItems.reduce((total, row) => total + Number(row.bags ?? 0), 0);
  const creditPending = invoices.reduce((total, row) => total + Number(row.due_amount ?? 0), 0);
  const stockBags = inventory.reduce((total, lot) => total + Number(lot.available_bags ?? 0), 0);
  const stockValue = inventory.reduce((total, lot) => total + Number(lot.available_value ?? 0), 0);
  const productSummary = summarizeProducts(invoiceItems);
  const maxProductAmount = Math.max(...productSummary.map((product) => product.amount), 1);
  const topProducts = productSummary.slice(0, 8);
  const topFiveProducts = productSummary.slice(0, 5);
  const inventorySummary = summarizeInventory(inventory).slice(0, 8);
  const maxInventoryBags = Math.max(...inventorySummary.map((lot) => lot.bags), 1);

  const heroMetrics = [
    { label: "Total revenue", value: formatCurrency(totalRevenue), icon: ReceiptIndianRupee },
    { label: "Today's sale", value: formatCurrency(todaysSale), icon: CalendarDays },
    { label: "Total bags sold", value: formatNumber(totalBagsSold), icon: PackageCheck },
    { label: "Credit pending", value: formatCurrency(creditPending), icon: WalletCards }
  ];

  const stats = [
    { label: "Invoices", value: formatNumber(invoices.length), icon: BarChart3 },
    { label: "Customers", value: formatNumber(customers.length), icon: UsersRound },
    { label: "Stock bags", value: formatNumber(stockBags), icon: Boxes },
    { label: "Stock value", value: formatCurrency(stockValue), icon: ReceiptIndianRupee }
  ];

  return (
    <AppShell
      eyebrow="Dashboard"
      title="SeedDesk"
      subtitle="Daily sales, credit, stock, and product performance."
    >
      <section className="dashboard-hero-grid">
        {heroMetrics.map(({ icon: Icon, label, value }) => (
          <article className="dashboard-metric-card" key={label}>
            <div className="dashboard-metric-icon">
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="stats-grid dashboard-stats-grid">
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

      <section className="dashboard-content-grid">
        <article className="panel dashboard-chart-panel">
          <div className="panel-heading">
            <BarChart3 size={19} />
            <h3>Product sales by revenue</h3>
          </div>
          <div className="product-bar-list">
            {topProducts.length > 0 ? topProducts.map((product) => (
              <div className="product-bar-row" key={product.name}>
                <div className="product-bar-meta">
                  <strong>{product.name}</strong>
                  <span>{formatCurrency(product.amount)} · {formatNumber(product.bags)} bags · {formatNumber(product.quantity)} qtl</span>
                </div>
                <div className="product-bar-track">
                  <div style={{ width: `${Math.max((product.amount / maxProductAmount) * 100, 3)}%` }} />
                </div>
              </div>
            )) : (
              <p className="dashboard-empty">No invoice item sales yet.</p>
            )}
          </div>
        </article>

        <article className="panel dashboard-chart-panel">
          <div className="panel-heading">
            <PackageCheck size={19} />
            <h3>Top 5 sold products</h3>
          </div>
          <div className="top-products-list">
            {topFiveProducts.length > 0 ? topFiveProducts.map((product, index) => (
              <div className="top-product-row" key={product.name}>
                <span>{index + 1}</span>
                <div>
                  <strong>{product.name}</strong>
                  <small>{formatNumber(product.bags)} bags · {formatCurrency(product.amount)}</small>
                </div>
              </div>
            )) : (
              <p className="dashboard-empty">No sold products yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-content-grid single-chart-grid">
        <article className="panel dashboard-chart-panel">
          <div className="panel-heading">
            <Boxes size={19} />
            <h3>Inventory position</h3>
          </div>
          <div className="inventory-vertical-chart">
            {inventorySummary.length > 0 ? inventorySummary.map((lot) => (
              <div className="inventory-vertical-bar" key={lot.name}>
                <div className="inventory-vertical-value">{formatNumber(lot.bags)}</div>
                <div className="inventory-vertical-track">
                  <div style={{ height: `${Math.max((lot.bags / maxInventoryBags) * 100, 6)}%` }} />
                </div>
                <span>{lot.name}</span>
              </div>
            )) : <p className="dashboard-empty">No packed inventory available.</p>}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
