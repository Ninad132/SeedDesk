"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/format";

export type SaleSheetReportRow = {
  amount: number;
  bags: number;
  customerName: string;
  date: string;
  invoiceNo: number;
  lotNo: string;
  mobileNo: string;
  quantity: number;
  rate: number;
  remark: string;
  village: string;
  weight: number;
};

type ReportSearchTableProps = {
  rows: SaleSheetReportRow[];
};

export function ReportSearchTable({ rows }: ReportSearchTableProps) {
  const [query, setQuery] = useState("");
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.invoiceNo,
        row.customerName,
        row.village,
        row.mobileNo,
        row.remark,
        row.lotNo,
        row.date
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, rows]);

  return (
    <article className="panel table-panel">
      <div className="panel-heading table-heading">
        <div>
          <h3>Invoice search</h3>
        </div>
        <label className="search-box report-search">
          <Search size={17} />
          <input
            placeholder="Search invoice, customer, village, mobile, Lot No"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Invoice no</th>
              <th>Customer name</th>
              <th>Village</th>
              <th>Mobile No</th>
              <th>remark</th>
              <th>Lot No</th>
              <th>Bags</th>
              <th>Weight</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={`${row.invoiceNo}-${row.lotNo}-${index}`}>
                <td>{row.invoiceNo}</td>
                <td>{row.customerName}</td>
                <td>{row.village}</td>
                <td>{row.mobileNo}</td>
                <td>{row.remark}</td>
                <td>{row.lotNo}</td>
                <td>{formatNumber(row.bags)}</td>
                <td>{formatNumber(row.weight)}</td>
                <td>{formatNumber(row.quantity)}</td>
                <td>{formatCurrency(row.rate)}</td>
                <td>{formatCurrency(row.amount)}</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
