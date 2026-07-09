import { PackagePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import DeletePurchaseButton from "./_components/DeletePurchaseButton";
import PurchaseDatabaseReport, { type PurchaseDatabaseReportRow } from "./_components/PurchaseDatabaseReport";

export const dynamic = "force-dynamic";

type InwardSlipRow = {
  amount: number;
  bags: number;
  id: string;
  material_name: string;
  net_weight_qtl: number;
  net_wt: number;
  rate: number;
  slip_no: number;
  supplier_name: string;
  truck_no: string | null;
  wgt_bag: number;
};

type GradingSessionRow = {
  graded_bags: number;
  inward_slip_id: string | null;
  supplier_name: string;
  total_graded: number;
  undersize: number;
  variety: string;
};

type PackingSessionRow = {
  grading_session_id: string | null;
  inward_slip_id: string | null;
  no_of_bags: number;
  supplier_name: string;
  total_packed: number;
  variety: string;
};

function reportKey(materialName: string, supplierName: string) {
  return `${materialName.trim().toLowerCase()}::${supplierName.trim().toLowerCase()}`;
}

function inwardReportKey(inwardSlipId: string | null | undefined, materialName: string, supplierName: string) {
  return inwardSlipId ? `inward::${inwardSlipId}` : reportKey(materialName, supplierName);
}

function emptyReportRow(reportId: string, materialName: string, supplierName: string, slipNo: number | null): PurchaseDatabaseReportRow {
  return {
    gradedBags: 0,
    inwardBags: 0,
    materialName,
    packedBags: 0,
    packedQty: 0,
    remainingGrading: 0,
    remainingPacking: 0,
    reportId,
    slipNo,
    supplierName,
    totalGradedQt: 0,
    undersize: 0,
    wgtBags: 0
  };
}

function buildDatabaseReportRows(
  inwardRows: InwardSlipRow[],
  gradingRows: GradingSessionRow[],
  packingRows: PackingSessionRow[]
) {
  const rows = new Map<string, PurchaseDatabaseReportRow>();

  for (const row of inwardRows) {
    const materialName = row.material_name ?? "";
    const supplierName = row.supplier_name ?? "";
    const key = inwardReportKey(row.id, materialName, supplierName);
    const current = rows.get(key) ?? emptyReportRow(key, materialName, supplierName, row.slip_no ?? null);
    current.inwardBags += Number(row.bags ?? 0);
    current.wgtBags += Number(row.wgt_bag ?? 0);
    rows.set(key, current);
  }

  for (const row of gradingRows) {
    const materialName = row.variety ?? "";
    const supplierName = row.supplier_name ?? "";
    const key = inwardReportKey(row.inward_slip_id, materialName, supplierName);
    const current = rows.get(key);

    if (!current) {
      continue;
    }

    current.gradedBags += Number(row.graded_bags ?? 0);
    current.totalGradedQt += Number(row.total_graded ?? 0);
    current.undersize += Number(row.undersize ?? 0);
  }

  for (const row of packingRows) {
    const materialName = row.variety ?? "";
    const supplierName = row.supplier_name ?? "";
    const key = inwardReportKey(row.inward_slip_id, materialName, supplierName);
    const current = rows.get(key);

    if (!current) {
      continue;
    }

    current.packedBags += Number(row.no_of_bags ?? 0);
    current.packedQty += Number(row.total_packed ?? 0);
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      remainingGrading: row.wgtBags - row.totalGradedQt - row.undersize,
      remainingPacking: row.totalGradedQt - row.packedQty
    }))
    .sort((a, b) => a.materialName.localeCompare(b.materialName) || a.supplierName.localeCompare(b.supplierName));
}

export default async function PurchasesPage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: inwardRows }, { data: gradingRows }, { data: packingRows }] = (await Promise.all([
    supabase
      .from("inward_slips")
      .select("id,slip_no,truck_no,material_name,supplier_name,bags,wgt_bag,net_wt,net_weight_qtl,rate,amount")
      .eq("company_id", demoSession.company.id)
      .order("slip_no", { ascending: false }),
    supabase
      .from("grading_sessions")
      .select("inward_slip_id,variety,supplier_name,graded_bags,total_graded,undersize")
      .eq("company_id", demoSession.company.id),
    supabase
      .from("packing_sessions")
      .select("inward_slip_id,grading_session_id,variety,supplier_name,no_of_bags,total_packed")
      .eq("company_id", demoSession.company.id)
  ])) as [
    { data: InwardSlipRow[] | null },
    { data: GradingSessionRow[] | null },
    { data: PackingSessionRow[] | null }
  ];

  const inwardLedgerRows = inwardRows ?? [];
  const databaseRows = buildDatabaseReportRows(inwardRows ?? [], gradingRows ?? [], packingRows ?? []);
  const totalBags = inwardLedgerRows.reduce((total, row) => total + Number(row.bags ?? 0), 0);
  const totalQuantity = inwardLedgerRows.reduce((total, row) => total + Number(row.net_weight_qtl ?? 0), 0);
  const totalValue = inwardLedgerRows.reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return (
    <AppShell
      eyebrow="Purchases"
      title="Purchase / Stock Entry"
      subtitle="Entries received from inward processing."
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

      <PurchaseDatabaseReport rows={databaseRows} />

      <section>
        <article className="panel table-panel">
          <div className="panel-heading">
            <PackagePlus size={19} />
            <h3>Purchase from inward</h3>
          </div>
          <div className="stock-table-wrap">
            <table className="stock-table compact-table">
              <thead>
                <tr>
                  <th>SLIPNO</th>
                  <th>Truck No</th>
                  <th>Material Name</th>
                  <th>Supplier Name</th>
                  <th>Net Wt</th>
                  <th>NET WEIGHT</th>
                  <th>RATE</th>
                  <th>AMOUNT</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inwardLedgerRows.length > 0 ? inwardLedgerRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.slip_no}</td>
                      <td>{row.truck_no}</td>
                      <td>{row.material_name}</td>
                      <td>{row.supplier_name}</td>
                      <td>{formatNumber(Number(row.net_wt ?? 0))}</td>
                      <td>{formatNumber(Number(row.net_weight_qtl ?? 0))}</td>
                      <td>{formatCurrency(Number(row.rate ?? 0))}</td>
                      <td>{formatCurrency(Number(row.amount ?? 0))}</td>
                      <td>
                        <DeletePurchaseButton inwardSlipId={row.id} />
                      </td>
                    </tr>
                )) : (
                  <tr>
                    <td colSpan={9}>No inward slips saved yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
