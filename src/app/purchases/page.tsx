import { PackagePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { quantityQuintal } from "@/lib/inventory";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import DeletePurchaseButton from "./_components/DeletePurchaseButton";
import PurchaseForm from "./_components/PurchaseForm";

export const dynamic = "force-dynamic";

type ProductRow = {
  display_name: string;
};

type PurchaseItemRow = {
  amount: number;
  bags: number;
  id: string;
  packing_kg: number;
  quantity_quintal: number;
  rate: number;
  purchases: {
    purchase_date: string;
    supplier_name: string | null;
  } | null;
  seed_lots: {
    lot_number: string;
    seed_class: string | null;
    source_state: string | null;
    products: {
      crop: string;
      display_name: string;
    } | null;
  } | null;
};

export default async function PurchasesPage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: products }, { data: purchaseItems }] = (await Promise.all([
    supabase
      .from("products")
      .select("display_name")
      .eq("company_id", demoSession.company.id)
      .order("display_name"),
    supabase
      .from("purchase_items")
      .select(`
        id,
        bags,
        packing_kg,
        quantity_quintal,
        rate,
        amount,
        purchases(purchase_date,supplier_name),
        seed_lots(lot_number,seed_class,source_state,products(crop,display_name))
      `)
      .eq("company_id", demoSession.company.id)
      .order("id", { ascending: false })
  ])) as [{ data: ProductRow[] | null }, { data: PurchaseItemRow[] | null }];

  const productNames = Array.from(new Set((products ?? []).map((product) => product.display_name).filter(Boolean)));
  const rows = purchaseItems ?? [];
  const totalBags = rows.reduce((total, row) => total + Number(row.bags ?? 0), 0);
  const totalQuantity = rows.reduce((total, row) => total + Number(row.quantity_quintal ?? 0), 0);
  const totalValue = rows.reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return (
    <AppShell
      eyebrow="Purchases"
      title="Purchase / Stock Entry"
      subtitle="Purchase view uses Column3, Lot No, Variety, Bags, Weight, Quantity, Rate, and xyz."
    >
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <PackagePlus size={20} />
          </div>
          <span>Bags</span>
          <strong>{formatNumber(totalBags)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <PackagePlus size={20} />
          </div>
          <span>Quantity</span>
          <strong>{formatNumber(totalQuantity)}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <PackagePlus size={20} />
          </div>
          <span>Value</span>
          <strong>{formatCurrency(totalValue)}</strong>
        </article>
      </section>

      <section className="inventory-layout">
        <PurchaseForm productNames={productNames} />

        <article className="panel table-panel">
          <div className="panel-heading">
            <PackagePlus size={19} />
            <h3>Purchase</h3>
          </div>
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Column3</th>
                  <th>Lot No</th>
                  <th>Variety</th>
                  <th>Bags</th>
                  <th>Weight</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>xyz</th>
                  <th>Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const product = row.seed_lots?.products;
                  const lotNo = row.seed_lots?.lot_number ?? "";
                  const column3 = product?.display_name ?? product?.crop ?? "";
                  const variety = [column3, lotNo].filter(Boolean).join(" ");
                  const quantity = Number(row.quantity_quintal ?? quantityQuintal(Number(row.bags ?? 0), Number(row.packing_kg ?? 0)));

                  return (
                    <tr key={row.id}>
                      <td>{row.purchases?.purchase_date}</td>
                      <td>{column3}</td>
                      <td>{lotNo}</td>
                      <td>
                        <strong>{variety}</strong>
                        <span>{row.purchases?.supplier_name ?? ""}</span>
                      </td>
                      <td>{formatNumber(Number(row.bags ?? 0))}</td>
                      <td>{formatNumber(Number(row.packing_kg ?? 0))}</td>
                      <td>{formatNumber(quantity)}</td>
                      <td>{formatCurrency(Number(row.rate ?? 0))}</td>
                      <td>{row.seed_lots?.source_state}</td>
                      <td>{formatCurrency(Number(row.amount ?? 0))}</td>
                      <td>
                        <DeletePurchaseButton purchaseItemId={row.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
