"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";

export type PurchaseDatabaseReportRow = {
  gradedBags: number;
  inwardBags: number;
  materialName: string;
  packedBags: number;
  packedQty: number;
  remainingGrading: number;
  remainingPacking: number;
  reportId: string;
  slipNo: number | null;
  supplierName: string;
  totalGradedQt: number;
  undersize: number;
  wgtBags: number;
};

type PurchaseDatabaseReportProps = {
  rows: PurchaseDatabaseReportRow[];
};

function percent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export default function PurchaseDatabaseReport({ rows }: PurchaseDatabaseReportProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!normalizedQuery) return true;
        return [row.materialName, row.supplierName, row.slipNo ? `slip-${row.slipNo}` : ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, rows]
  );

  const totals = filteredRows.reduce(
    (sum, row) => ({
      graded: sum.graded + row.totalGradedQt,
      inward: sum.inward + row.wgtBags,
      packed: sum.packed + row.packedQty,
      remainingGrading: sum.remainingGrading + row.remainingGrading,
      remainingPacking: sum.remainingPacking + row.remainingPacking
    }),
    { graded: 0, inward: 0, packed: 0, remainingGrading: 0, remainingPacking: 0 }
  );

  const gradedPercent = percent(totals.graded, totals.inward);
  const packedPercent = percent(totals.packed, totals.inward);
  const donutStyle = {
    background: `conic-gradient(#236441 0 ${packedPercent}%, #c47f2c ${packedPercent}% ${gradedPercent}%, #dfe5dc ${gradedPercent}% 100%)`
  };

  return (
    <article className="panel table-panel purchase-report-panel">
      <div className="panel-heading table-heading purchase-report-heading">
        <div>
          <h3>Database report</h3>
        </div>
        <label className="search-box report-search">
          <Search size={17} />
          <input
            placeholder="Search slip, material, or supplier"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <section className="purchase-report-summary">
        <div className="donut-card">
          <div className="donut-chart" style={donutStyle}>
            <div>
              <strong>{formatNumber(totals.inward)}</strong>
              <span>qtl</span>
            </div>
          </div>
          <div className="donut-legend">
            <span><i className="legend-packed" />Packed {formatNumber(totals.packed)}</span>
            <span><i className="legend-graded" />Graded {formatNumber(totals.graded)}</span>
            <span><i className="legend-balance" />Balance {formatNumber(totals.remainingGrading)}</span>
          </div>
        </div>
        <div className="report-mini-stat">
          <span>Remaining grading</span>
          <strong>{formatNumber(totals.remainingGrading)}</strong>
        </div>
        <div className="report-mini-stat">
          <span>Remaining packing</span>
          <strong>{formatNumber(totals.remainingPacking)}</strong>
        </div>
      </section>

      <div className="stock-table-wrap">
        <table className="stock-table purchase-database-table">
          <thead>
            <tr>
              <th>SLIPNO</th>
              <th>Material Name</th>
              <th>Supplier Name</th>
              <th>INWARD BAGS</th>
              <th>Wgt-BagS</th>
              <th>GRADED BAG</th>
              <th>Total Graded QT</th>
              <th>U/s</th>
              <th>Remaining Gradings</th>
              <th>packed bags</th>
              <th>Packed Qty</th>
              <th>Remaining packings</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? filteredRows.map((row) => (
              <tr key={row.reportId}>
                <td>{row.slipNo ? `SLIP-${row.slipNo}` : "-"}</td>
                <td><strong>{row.materialName || "-"}</strong></td>
                <td>{row.supplierName || "-"}</td>
                <td>{formatNumber(row.inwardBags)}</td>
                <td>{formatNumber(row.wgtBags)}</td>
                <td>{formatNumber(row.gradedBags)}</td>
                <td>{formatNumber(row.totalGradedQt)}</td>
                <td>{formatNumber(row.undersize)}</td>
                <td>{formatNumber(row.remainingGrading)}</td>
                <td>{formatNumber(row.packedBags)}</td>
                <td>{formatNumber(row.packedQty)}</td>
                <td>{formatNumber(row.remainingPacking)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={12}>No matching purchase database rows.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
