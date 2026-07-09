import { formatCurrency, formatNumber } from "@/lib/format";

export type DownloadInvoiceItem = {
  amount: number;
  bags: number;
  itemName: string;
  packingKg: number;
  quantity: number;
  rate: number;
};

export type DownloadInvoiceData = {
  customerName: string;
  discountAmount: number;
  grandTotal: number;
  invoiceDate: string;
  invoiceNumber: number;
  invoicePrefix: string;
  items: DownloadInvoiceItem[];
  mobileNo: string;
  paidAmount: number;
  remark: string;
  subtotal: number;
  village: string;
};

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function invoiceFileName(invoice: DownloadInvoiceData) {
  return `invoice-${invoice.invoicePrefix}-${invoice.invoiceNumber}.html`;
}

export function buildInvoiceHtml(invoice: DownloadInvoiceData) {
  const rows = Array.from({ length: 5 }, (_, index) => invoice.items[index] ?? null)
    .map((item, index) =>
      item
        ? `<tr><td>${index + 1}</td><td>${escapeHtml(item.itemName)}</td><td>${formatNumber(item.bags)}</td><td>${formatNumber(item.packingKg)}</td><td>${formatNumber(item.quantity)}</td><td>${formatCurrency(item.rate)}</td><td>${formatCurrency(item.amount)}</td></tr>`
        : `<tr><td>${index + 1}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(invoice.invoicePrefix)}-${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    body { background: #f5f6f1; color: #18201a; font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; }
    .invoice { background: #fff; border: 1px solid #111; margin: 0 auto; max-width: 860px; padding: 28px; }
    header { display: flex; justify-content: space-between; gap: 18px; border-bottom: 2px solid #111; padding-bottom: 14px; }
    h1 { font-size: 26px; margin: 0 0 6px; }
    p { margin: 3px 0; }
    .meta { border: 1px solid #111; display: grid; grid-template-columns: auto auto; min-width: 180px; }
    .meta strong, .meta span { border-bottom: 1px solid #111; padding: 7px 9px; }
    .meta strong:nth-last-child(-n+2), .meta span:nth-last-child(-n+2) { border-bottom: 0; }
    .subtitle { font-weight: 800; letter-spacing: 0; padding: 12px 0; text-align: center; }
    .customer { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #111; margin-bottom: 14px; }
    .customer div { border-right: 1px solid #111; padding: 9px; min-height: 72px; }
    .customer div:last-child { border-right: 0; }
    .customer span, .customer strong { display: block; font-size: 11px; text-transform: uppercase; }
    .customer p { font-size: 15px; font-weight: 700; margin-top: 8px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #111; font-size: 13px; padding: 8px; text-align: left; }
    th { background: #eef4ea; }
    th:last-child, td:last-child { text-align: right; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 14px; border: 1px solid #111; }
    .summary div { border-right: 1px solid #111; padding: 10px; }
    .summary div:last-child { border-right: 0; }
    .summary span, .summary strong { display: block; }
    .summary span { color: #657063; font-size: 11px; text-transform: uppercase; }
    .summary strong { margin-top: 6px; }
    @media print { body { background: #fff; padding: 0; } .invoice { border: 1px solid #111; max-width: none; } }
  </style>
</head>
<body>
  <section class="invoice">
    <header>
      <div>
        <h1>Vasundhara Seeds</h1>
        <p>52, Rajaswa Colony, Tanki Path, Freeganj, Ujjain, MP</p>
        <p>PH 0734-2530547, 9425332517</p>
        <p>SEED LIC NO- 1178</p>
      </div>
      <div class="meta">
        <strong>Invoice no</strong><span>${escapeHtml(invoice.invoicePrefix)}-${escapeHtml(invoice.invoiceNumber)}</span>
        <strong>Date</strong><span>${escapeHtml(invoice.invoiceDate)}</span>
      </div>
    </header>
    <div class="subtitle">GST EXEMPTED WHEAT SEED</div>
    <section class="customer">
      <div><span>नाम</span><strong>Customer name</strong><p>${escapeHtml(invoice.customerName)}</p></div>
      <div><span>ग्राम</span><strong>Village</strong><p>${escapeHtml(invoice.village)}</p></div>
      <div><span>मोबाईल</span><strong>Phone no</strong><p>${escapeHtml(invoice.mobileNo)}</p></div>
      <div><span>remark</span><strong>remark</strong><p>${escapeHtml(invoice.remark)}</p></div>
    </section>
    <table>
      <thead><tr><th>Sno</th><th>Particular</th><th>Bags</th><th>Weight</th><th>Quantity</th><th>RATE</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <section class="summary">
      <div><span>Total bill amount</span><strong>${formatCurrency(invoice.subtotal)}</strong></div>
      <div><span>Discount</span><strong>${formatCurrency(invoice.discountAmount)}</strong></div>
      <div><span>Grand total</span><strong>${formatCurrency(invoice.grandTotal)}</strong></div>
      <div><span>Advance</span><strong>${formatCurrency(invoice.paidAmount)}</strong></div>
      <div><span>Account Pay</span><strong>${formatCurrency(invoice.paidAmount)}</strong></div>
      <div><span>Balance</span><strong>${formatCurrency(invoice.grandTotal - invoice.paidAmount)}</strong></div>
    </section>
  </section>
</body>
</html>`;
}

export function downloadInvoiceHtml(invoice: DownloadInvoiceData) {
  const blob = new Blob([buildInvoiceHtml(invoice)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = invoiceFileName(invoice);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
