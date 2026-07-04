import { Boxes, FilePlus2, ReceiptIndianRupee, Search, UsersRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { initialCustomers } from "@/lib/customers";
import { formatCurrency, formatNumber } from "@/lib/format";
import { availableBags, initialSeedLots, stockValue } from "@/lib/inventory";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import { getInvoiceRows, saleReportRows } from "@/lib/reports";

export const dynamic = "force-dynamic";

const modules = [
  {
    href: "/invoice",
    icon: FilePlus2,
    label: "New Invoice",
    text: "Create invoice rows, print bill, and generate Sale rows."
  },
  {
    href: "/reports",
    icon: Search,
    label: "Reports",
    text: "Search invoices, date-wise sales, stock, and outstanding Difference."
  },
  {
    href: "/inventory",
    icon: Boxes,
    label: "Inventory",
    text: "Review Variety, Purchse Qty, Sale Qty, HOLD, and In Stock."
  },
  {
    href: "/customers",
    icon: UsersRound,
    label: "Customers",
    text: "Maintain Customer name, Village, Mobile No, remark, and ledger."
  }
] as const;

type DashboardInvoiceRow = {
  due_amount: number;
  grand_total: number;
};

type DashboardInventoryRow = {
  available_bags: number;
  available_value: number;
};

type DashboardCustomerRow = {
  id: string;
};

async function getDashboardData() {
  const supabase = createServerAnonSupabaseClient();
  const [invoiceResult, inventoryResult, customerResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("grand_total,due_amount")
      .eq("company_id", demoSession.company.id),
    supabase
      .from("seed_lot_availability")
      .select("available_bags,available_value")
      .eq("company_id", demoSession.company.id),
    supabase
      .from("customers")
      .select("id")
      .eq("company_id", demoSession.company.id)
  ]);

  return {
    customers: (customerResult.data ?? []) as DashboardCustomerRow[],
    inventory: (inventoryResult.data ?? []) as DashboardInventoryRow[],
    invoices: (invoiceResult.data ?? []) as DashboardInvoiceRow[]
  };
}

export default async function DashboardPage() {
  const { customers, inventory, invoices } = await getDashboardData();
  const fallbackInvoiceRows = getInvoiceRows(saleReportRows);
  const fallbackStock = initialSeedLots.reduce((total, lot) => total + availableBags(lot), 0);
  const fallbackStockAmount = initialSeedLots.reduce((total, lot) => total + stockValue(lot), 0);

  const sales = invoices.length > 0
    ? invoices.reduce((total, row) => total + Number(row.grand_total ?? 0), 0)
    : fallbackInvoiceRows.reduce((total, row) => total + row.grandTotal, 0);
  const difference = invoices.length > 0
    ? invoices.reduce((total, row) => total + Number(row.due_amount ?? 0), 0)
    : fallbackInvoiceRows.reduce((total, row) => total + row.difference, 0);
  const stock = inventory.length > 0
    ? inventory.reduce((total, lot) => total + Number(lot.available_bags ?? 0), 0)
    : fallbackStock;
  const stockAmount = inventory.length > 0
    ? inventory.reduce((total, lot) => total + Number(lot.available_value ?? 0), 0)
    : fallbackStockAmount;
  const customerRows = customers.length > 0 ? customers.length : initialCustomers.length;

  const stats = [
    { label: "GRAND TOTAL", value: formatCurrency(sales), icon: ReceiptIndianRupee },
    { label: "Difference", value: formatCurrency(difference), icon: WalletCards },
    { label: "In Stock", value: formatNumber(stock), icon: Boxes },
    { label: "Customer rows", value: formatNumber(customerRows), icon: UsersRound }
  ];

  return (
    <AppShell
      eyebrow="Day 7 MVP"
      title="SeedDesk MVP"
      subtitle="Seed dealer billing, lot-wise inventory, customer ledger, invoice print, and reports are now connected as a navigable MVP."
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

      <section className="module-grid">
        {modules.map(({ href, icon: Icon, label, text }) => (
          <Link className="module-card" href={href} key={href}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>
            <strong>{label}</strong>
            <span>{text}</span>
          </Link>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel wide">
          <div className="panel-heading">
            <Boxes size={19} />
            <h3>MVP relationship status</h3>
          </div>
          <ul className="step-list">
            <li>Purchase and stock rows feed Inventory.</li>
            <li>Inventory In Stock controls invoice item availability.</li>
            <li>Invoice finalization creates Sale rows and reduces stock.</li>
            <li>Sale payment columns drive Customer Difference and reports.</li>
            <li>Print preview uses the same invoice rows, not separate calculations.</li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <ReceiptIndianRupee size={19} />
            <h3>Stock value</h3>
          </div>
          <p>{formatCurrency(stockAmount)}</p>
        </article>
      </section>
    </AppShell>
  );
}
