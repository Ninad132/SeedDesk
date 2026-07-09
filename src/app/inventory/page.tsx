import { Boxes } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import StockAdjustmentForm, { type AdjustmentLotOption } from "./_components/StockAdjustmentForm";

export const dynamic = "force-dynamic";

type InventoryRow = {
  available_bags: number;
  available_quintal: number;
  available_value: number;
  company_id: string;
  crop: string;
  current_bags: number;
  display_name: string;
  hold_bags: number;
  inward_slip_id: string | null;
  lot_number: string;
  opening_bags: number;
  packing_kg: number;
  rate: number;
  seed_class: string | null;
  seed_lot_id: string;
  source_state?: string | null;
  variety_name: string;
};

type StockAdjustmentRow = {
  adjustment_date: string;
  adjustment_type: string;
  bags: number;
  id: string;
  notes: string | null;
  reason: string;
  seed_lots: {
    lot_number: string;
    products: {
      display_name: string;
    } | null;
  } | null;
};

type InwardMaterialRow = {
  id: string;
  slip_no: number;
  supplier_name: string;
};

export default async function InventoryPage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data }, { data: adjustments }, { data: inwardRows }] = (await Promise.all([
    supabase
      .from("seed_lot_availability")
      .select("*")
      .eq("company_id", demoSession.company.id)
      .eq("source_state", "PACKED")
      .order("display_name"),
    supabase
      .from("stock_adjustments")
      .select("id,adjustment_date,adjustment_type,bags,reason,notes,seed_lots(lot_number,products(display_name))")
      .eq("company_id", demoSession.company.id)
      .order("adjustment_date", { ascending: false })
      .limit(10),
    supabase
      .from("inward_slips")
      .select("id,slip_no,supplier_name")
      .eq("company_id", demoSession.company.id)
  ])) as [{ data: InventoryRow[] | null }, { data: StockAdjustmentRow[] | null }, { data: InwardMaterialRow[] | null }];
  const inwardIds = new Set((inwardRows ?? []).map((row) => row.id));
  const inwardById = new Map((inwardRows ?? []).map((row) => [row.id, row]));
  const rows = (data ?? []).filter((lot) => lot.inward_slip_id && inwardIds.has(lot.inward_slip_id));
  const totalStock = rows.reduce((total, lot) => total + Number(lot.available_bags ?? 0), 0);
  const adjustmentLots: AdjustmentLotOption[] = rows.map((lot) => ({
    availableBags: Number(lot.available_bags ?? 0),
    currentBags: Number(lot.current_bags ?? 0),
    holdBags: Number(lot.hold_bags ?? 0),
    id: lot.seed_lot_id,
    label: `${lot.display_name} ${lot.lot_number} | In Stock: ${formatNumber(Number(lot.available_bags ?? 0))}`
  }));

  return (
    <AppShell
      eyebrow="Inventory"
      title="Inventory"
      subtitle="Lot-wise stock, holds, and availability."
    >
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <Boxes size={20} />
          </div>
          <span>In Stock</span>
          <strong>{formatNumber(totalStock)}</strong>
        </article>
      </section>

      <section className="inventory-layout">
        <StockAdjustmentForm lots={adjustmentLots} />

        <article className="panel">
          <div className="panel-heading">
            <Boxes size={19} />
            <h3>Recent adjustments</h3>
          </div>
          <div className="stock-table-wrap">
            <table className="stock-table compact-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Lot No</th>
                  <th>Bags</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {(adjustments ?? []).map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td>{adjustment.adjustment_date}</td>
                    <td>{adjustment.adjustment_type}</td>
                    <td>
                      <strong>{adjustment.seed_lots?.products?.display_name} {adjustment.seed_lots?.lot_number}</strong>
                      <span>{adjustment.notes}</span>
                    </td>
                    <td>{formatNumber(Number(adjustment.bags ?? 0))}</td>
                    <td>{adjustment.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <article className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h3>Inventory</h3>
            <p>In Stock = Purchse Qty - Sale Qty - HOLD.</p>
          </div>
        </div>
        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Variety</th>
                <th>Purchse Qty</th>
                <th>Sale Qty</th>
                <th>HOLD</th>
                <th>In Stock</th>
                <th>RATE</th>
                <th>Seed type</th>
                <th>Lot No</th>
                <th>Inward Slip No</th>
                <th>Supplier</th>
                <th>Weight</th>
                <th>Quantity</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lot) => {
                const soldQty = Number(lot.opening_bags ?? 0) - Number(lot.current_bags ?? 0);

                return (
                  <tr key={lot.seed_lot_id}>
                    <td>
                      <strong>{lot.display_name} {lot.lot_number}</strong>
                      <span>{lot.crop} · {lot.source_state ?? ""}</span>
                    </td>
                    <td>{formatNumber(Number(lot.opening_bags ?? 0))}</td>
                    <td>{formatNumber(soldQty)}</td>
                    <td>{formatNumber(Number(lot.hold_bags ?? 0))}</td>
                    <td>{formatNumber(Number(lot.available_bags ?? 0))}</td>
                    <td>{formatCurrency(Number(lot.rate ?? 0))}</td>
                    <td>{lot.seed_class}</td>
                    <td>{lot.lot_number}</td>
                    <td>{lot.inward_slip_id ? `SLIP-${inwardById.get(lot.inward_slip_id)?.slip_no ?? "-"}` : "-"}</td>
                    <td>{lot.inward_slip_id ? inwardById.get(lot.inward_slip_id)?.supplier_name ?? "-" : "-"}</td>
                    <td>{formatNumber(Number(lot.packing_kg ?? 0))}</td>
                    <td>{formatNumber(Number(lot.available_quintal ?? 0))}</td>
                    <td>{formatCurrency(Number(lot.available_value ?? 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
