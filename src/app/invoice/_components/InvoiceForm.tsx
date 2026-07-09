"use client";

import { Download, Plus, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
import { downloadInvoiceHtml } from "@/lib/invoice-download";
import { quantityQuintal } from "@/lib/inventory";
import { getNextInvoiceNo } from "@/lib/reports";
import { saveInvoice } from "../actions";

export type InvoiceCustomerOption = {
  customerName: string;
  id: string;
  mobileNo: string;
  remark: string;
  village: string;
};

export type InvoiceLotOption = {
  availableBags: number;
  column1: string;
  id: string;
  inwardSlipNo: number | null;
  lotNo: string;
  packingKg: number;
  rate: number;
  supplierName: string;
};

type InvoiceItem = {
  id: string;
  lotNo: string;
  bags: number;
  seedLotId: string;
  seedType: string;
  weight: number;
  quantity: number;
  rate: number;
  amount: number;
};

const MAX_INVOICE_ITEMS = 5;
const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10] as const;

type InvoiceFormProps = {
  customers: InvoiceCustomerOption[];
  existingInvoices: Array<{ column1: string; invoiceNo: number }>;
  lots: InvoiceLotOption[];
};

export default function InvoiceForm({ customers, existingInvoices, lots }: InvoiceFormProps) {
  const router = useRouter();
  const firstCustomer = customers[0];
  const [customerMode, setCustomerMode] = useState<"master" | "manual">("master");
  const [customerId, setCustomerId] = useState(firstCustomer?.id ?? "");
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualVillage, setManualVillage] = useState("");
  const [manualMobileNo, setManualMobileNo] = useState("");
  const [manualRemark, setManualRemark] = useState("VS");
  const [lotId, setLotId] = useState("");
  const [bags, setBags] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [cardPay, setCardPay] = useState("0");
  const [denominations, setDenominations] = useState<Record<number, string>>({});
  const [paymentCalculated, setPaymentCalculated] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, startSaving] = useTransition();
  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? firstCustomer;
  const selectedLot = lots.find((lot) => lot.id === lotId);
  const selectedSeedType = selectedLot?.column1 ?? "";
  const invoiceColumn1 = (items[0]?.seedType ?? selectedSeedType) || "VS";
  const nextInvoiceNo = getNextInvoiceNo(
    existingInvoices.map((invoice) => ({
      column1: invoice.column1,
      invoiceNo: invoice.invoiceNo
    })),
    invoiceColumn1
  );
  const invoiceCustomer = {
    customerName: customerMode === "manual" ? manualCustomerName || "Manual Customer" : selectedCustomer?.customerName ?? "",
    mobileNo: customerMode === "manual" ? manualMobileNo : selectedCustomer?.mobileNo ?? "",
    remark: customerMode === "manual" ? manualRemark : selectedCustomer?.remark ?? "",
    village: customerMode === "manual" ? manualVillage : selectedCustomer?.village ?? ""
  };
  const subtotal = useMemo(() => items.reduce((total, item) => total + item.amount, 0), [items]);
  const totalBags = useMemo(() => items.reduce((total, item) => total + item.bags, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const cashTaken = useMemo(
    () => DENOMINATIONS.reduce((total, denomination) => total + denomination * (Number(denominations[denomination]) || 0), 0),
    [denominations]
  );
  const discountAmount = Number(discount) || 0;
  const calculatedGrandTotal = Math.max(subtotal - discountAmount, 0);
  const calculatedReceived = (Number(cardPay) || 0) + cashTaken;
  const calculatedDifference = calculatedGrandTotal - calculatedReceived;
  const grandTotal = paymentCalculated ? calculatedGrandTotal : subtotal;
  const received = paymentCalculated ? calculatedReceived : 0;
  const difference = paymentCalculated ? calculatedDifference : subtotal;
  const canAddMoreItems = items.length < MAX_INVOICE_ITEMS;
  const hasSeedTypeMismatch = Boolean(selectedLot && items[0]?.seedType && selectedLot.column1 !== items[0].seedType);
  const printRows = Array.from({ length: MAX_INVOICE_ITEMS }, (_, index) => items[index] ?? null);
  const invoiceDownloadData = {
    customerName: invoiceCustomer.customerName,
    discountAmount,
    grandTotal,
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: nextInvoiceNo,
    invoicePrefix: invoiceColumn1,
    items: items.map((item) => ({
      amount: item.amount,
      bags: item.bags,
      itemName: item.lotNo,
      packingKg: item.weight,
      quantity: item.quantity,
      rate: item.rate
    })),
    mobileNo: invoiceCustomer.mobileNo,
    paidAmount: received,
    remark: invoiceCustomer.remark,
    subtotal,
    village: invoiceCustomer.village
  };

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bagCount = Number(bags) || 0;

    if (!canAddMoreItems) {
      return;
    }

    if (!selectedLot || hasSeedTypeMismatch || bagCount <= 0 || bagCount > selectedLot.availableBags) {
      return;
    }

    if (customerMode === "manual" && !manualCustomerName.trim()) {
      return;
    }

    const quantity = quantityQuintal(bagCount, selectedLot.packingKg);
    setItems((current) => [
      ...current,
      {
        id: `item-${Date.now()}`,
        amount: quantity * selectedLot.rate,
        bags: bagCount,
        lotNo: selectedLot.lotNo,
        quantity,
        rate: selectedLot.rate,
        seedLotId: selectedLot.id,
        seedType: selectedLot.column1,
        weight: selectedLot.packingKg
      }
    ]);
    setBags("1");
    setPaymentCalculated(false);
    setSaveMessage("");
  }

  function removeItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setPaymentCalculated(false);
    setSaveMessage("");
  }

  function calculatePayment() {
    setPaymentCalculated(true);
    setSaveMessage("");
  }

  function updateDenomination(denomination: number, value: string) {
    setDenominations((current) => ({
      ...current,
      [denomination]: value
    }));
    setPaymentCalculated(false);
    setSaveMessage("");
  }

  function saveCurrentInvoice() {
    if (!paymentCalculated || items.length === 0) {
      return;
    }

    startSaving(async () => {
      const result = await saveInvoice({
        cardPay: Number(cardPay) || 0,
        cashTaken,
        customer: {
          customerId: customerMode === "master" ? customerId : null,
          customerName: invoiceCustomer.customerName,
          mobileNo: invoiceCustomer.mobileNo,
          remark: invoiceCustomer.remark,
          village: invoiceCustomer.village
        },
        discountAmount,
        dueAmount: difference,
        grandTotal,
        invoiceDate: new Date().toISOString().slice(0, 10),
        invoiceNumber: nextInvoiceNo,
        invoicePrefix: invoiceColumn1,
        items: items.map((item) => ({
          amount: item.amount,
          bags: item.bags,
          itemName: item.lotNo,
          packingKg: item.weight,
          quantity: item.quantity,
          rate: item.rate,
          seedLotId: item.seedLotId
        })),
        paidAmount: received,
        subtotal
      });

      if ("error" in result && result.error) {
        setSaveMessage(result.error);
        return;
      }

      setItems([]);
      setPaymentCalculated(false);
      setDiscount("0");
      setCardPay("0");
      setDenominations({});
      setSaveMessage("Invoice saved successfully.");
      router.refresh();
    });
  }

  return (
    <AppShell
      action={
        <>
          <button className="secondary-inline" disabled={items.length === 0} onClick={() => downloadInvoiceHtml(invoiceDownloadData)} type="button">
            <Download size={17} />
            Download invoice
          </button>
          <button className="secondary-inline" onClick={() => window.print()} type="button">
            <Printer size={17} />
            Print invoice
          </button>
        </>
      }
      eyebrow="Invoice"
      title="New Invoice"
    >
      <section className="vas-bill-page">
        <div className="vas-invoice-sub">
          Invoice #{invoiceColumn1}-{nextInvoiceNo} · {new Date().toISOString().slice(0, 10)}
        </div>

        <article className="vas-card vas-customer-card">
          <div className="vas-card-title">Customer</div>
          <div className="lot-form vas-form">
            <label className="span-2">
              <span>Customer source</span>
              <select value={customerMode} onChange={(event) => setCustomerMode(event.target.value as "master" | "manual")}>
                <option value="master">Master customer list</option>
                <option value="manual">Manual new customer</option>
              </select>
            </label>
            {customerMode === "master" ? (
              <label className="span-2">
                <span>नाम / Customer Name</span>
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName} - {customer.village}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="span-2">
                <span>नाम / Customer Name</span>
                <input required value={manualCustomerName} onChange={(event) => setManualCustomerName(event.target.value)} />
              </label>
            )}
            <label>
              <span>ग्राम / Village</span>
              <input readOnly={customerMode === "master"} value={invoiceCustomer.village} onChange={(event) => setManualVillage(event.target.value)} />
            </label>
            <label>
              <span>मोबाईल</span>
              <input readOnly={customerMode === "master"} value={invoiceCustomer.mobileNo} onChange={(event) => setManualMobileNo(event.target.value)} />
            </label>
            <label className="span-2">
              <span>remark</span>
              <input readOnly={customerMode === "master"} value={invoiceCustomer.remark} onChange={(event) => setManualRemark(event.target.value)} />
            </label>
          </div>
        </article>

        <article className="vas-card vas-items-card">
          <div className="vas-card-title">Items (Lot x Bags)</div>
          <form className="lot-form vas-form" onSubmit={addItem}>
            <label className="span-2">
              <span>Items</span>
              <select value={lotId} onChange={(event) => setLotId(event.target.value)}>
                <option value="">Select item</option>
                {lots.map((lot) => (
                  <option disabled={lot.availableBags <= 0} key={lot.id} value={lot.id}>
                    {lot.lotNo} | Slip {lot.inwardSlipNo ?? "-"} | {lot.supplierName || "Supplier -"} | {lot.column1} | In Stock: {formatNumber(lot.availableBags)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Seed type</span>
              <input readOnly value={selectedSeedType} />
            </label>
            <label>
              <span>RATE</span>
              <input readOnly value={selectedLot ? formatCurrency(selectedLot.rate) : ""} />
            </label>
            <label>
              <span>Inward Slip No</span>
              <input readOnly value={selectedLot?.inwardSlipNo ? `SLIP-${selectedLot.inwardSlipNo}` : ""} />
            </label>
            <label>
              <span>Supplier</span>
              <input readOnly value={selectedLot?.supplierName ?? ""} />
            </label>
            <label>
              <span>Bags</span>
              <input min="1" type="number" value={bags} onChange={(event) => setBags(event.target.value)} />
            </label>
            <label>
              <span>Weight</span>
              <input readOnly value={formatNumber(selectedLot?.packingKg ?? 0)} />
            </label>
            {hasSeedTypeMismatch ? <p className="vas-inline-warning span-2">Use one seed type per invoice. Current invoice is {items[0]?.seedType}.</p> : null}
            <button className="form-submit span-2" disabled={!selectedLot || hasSeedTypeMismatch || !canAddMoreItems} type="submit">
              <Plus size={18} />
              Add item ({items.length}/{MAX_INVOICE_ITEMS})
            </button>
          </form>

          <div className="vas-item-list">
            {items.length > 0 ? items.map((item, index) => (
              <div className="vas-item-row" key={item.id}>
                <div>
                  <strong><span>{index + 1}</span>{item.lotNo}</strong>
                  <small>{item.seedType} · {formatNumber(item.bags)} bags · {formatNumber(item.quantity)} qtl · {formatCurrency(item.amount)}</small>
                </div>
                <button className="item-del" onClick={() => removeItem(item.id)} type="button">x</button>
              </div>
            )) : <div className="vas-empty">No items added.</div>}
          </div>

          {items.length > 0 ? (
            <div className="vas-totals-strip">
              <div><span>Bags</span><strong>{formatNumber(totalBags)}</strong></div>
              <div><span>Qty (Qtl)</span><strong>{formatNumber(totalQuantity)}</strong></div>
              <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            </div>
          ) : null}
        </article>

        <article className="vas-card vas-payment-card">
          <div className="vas-card-title">Payment</div>
          <div className="lot-form vas-form">
            <label>
              <span>Total</span>
              <input readOnly value={formatCurrency(subtotal)} />
            </label>
            <label>
              <span>Discount</span>
              <input min="0" type="number" value={discount} onChange={(event) => { setDiscount(event.target.value); setPaymentCalculated(false); }} />
            </label>
            <label>
              <span>Bill Amount</span>
              <input readOnly value={paymentCalculated ? formatCurrency(grandTotal) : ""} />
            </label>
            <label>
              <span>Account Pay</span>
              <input min="0" type="number" value={cardPay} onChange={(event) => { setCardPay(event.target.value); setPaymentCalculated(false); }} />
            </label>
            <label>
              <span>Cash Taken</span>
              <input readOnly value={formatCurrency(cashTaken)} />
            </label>
            <label>
              <span>Difference</span>
              <input readOnly value={paymentCalculated ? formatCurrency(difference) : ""} />
            </label>
            <button className="form-submit span-2" disabled={items.length === 0} onClick={calculatePayment} type="button">
              Calculate payment
            </button>
          </div>
        </article>

        <article className="vas-card vas-denom-card">
          <div className="vas-card-title">
            Cash Denominations
            <span className="vas-badge">{formatCurrency(cashTaken)}</span>
          </div>
          <div className="vas-denom-list">
            {DENOMINATIONS.map((denomination) => {
              const count = Number(denominations[denomination]) || 0;
              return (
                <label className="vas-denom-row" key={denomination}>
                  <strong>{formatCurrency(denomination)}</strong>
                  <span>x</span>
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={denominations[denomination] ?? ""}
                    onChange={(event) => updateDenomination(denomination, event.target.value)}
                  />
                  <em>{count > 0 ? formatCurrency(denomination * count) : "-"}</em>
                </label>
              );
            })}
          </div>
        </article>

        <article className="vas-card vas-preview-card">
          <div className="vas-card-title">Bill Preview (Live)</div>
          <section className="invoice-print print-area">
            <header className="invoice-print-header">
              <div>
                <h2>Vasundhara Seeds</h2>
                <p>52, Rajaswa Colony, Tanki Path, Freeganj, Ujjain, MP</p>
                <p>PH 0734-2530547, 9425332517</p>
                <p>SEED LIC NO- 1178</p>
              </div>
              <div className="invoice-print-meta">
                <strong>Invoice no</strong>
                <span>{invoiceColumn1}-{nextInvoiceNo}</span>
                <strong>Date</strong>
                <span>{new Date().toISOString().slice(0, 10)}</span>
              </div>
            </header>
            <div className="invoice-print-subtitle">Invoice</div>
            <section className="invoice-document-summary">
              <div><span>Bill amount</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div><span>Paid</span><strong>{formatCurrency(received)}</strong></div>
              <div><span>Balance</span><strong>{paymentCalculated ? formatCurrency(difference) : "Not calculated"}</strong></div>
            </section>
            <section className="invoice-customer-grid">
              <div><span>नाम</span><strong>Customer name</strong><p>{invoiceCustomer.customerName}</p></div>
              <div><span>ग्राम</span><strong>Village</strong><p>{invoiceCustomer.village}</p></div>
              <div><span>मोबाईल</span><strong>Phone no</strong><p>{invoiceCustomer.mobileNo}</p></div>
              <div><span>remark</span><strong>remark</strong><p>{invoiceCustomer.remark}</p></div>
            </section>
            <table className="invoice-print-table">
              <thead>
                <tr>
                  <th>Sno</th><th>Particular</th><th>Bags</th><th>Weight</th><th>Quantity</th><th>RATE</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {printRows.map((item, index) =>
                  item ? (
                    <tr key={item.id}>
                      <td>{index + 1}</td><td>{item.lotNo}</td><td>{formatNumber(item.bags)}</td><td>{formatNumber(item.weight)}</td><td>{formatNumber(item.quantity)}</td><td>{formatCurrency(item.rate)}</td><td>{formatCurrency(item.amount)}</td>
                    </tr>
                  ) : (
                    <tr key={`blank-${index}`}>
                      <td>{index + 1}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            <section className="invoice-summary-strip">
              <div><span>Invoice items</span><strong>{items.length}/{MAX_INVOICE_ITEMS}</strong></div>
              <div><span>Bags</span><strong>{formatNumber(totalBags)}</strong></div>
              <div><span>Quantity</span><strong>{formatNumber(totalQuantity)}</strong></div>
            </section>
            <section className="invoice-total-grid">
              <div><span>TOTAL BILL AMOUT</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div><span>Discoumt</span><strong>{paymentCalculated ? formatCurrency(discountAmount) : "Not calculated"}</strong></div>
              <div><span>GRAND TOTAL</span><strong>{paymentCalculated ? formatCurrency(grandTotal) : "Not calculated"}</strong></div>
              <div><span>Advance</span><strong>{formatCurrency(received)}</strong></div>
              <div><span>Account Pay</span><strong>{formatCurrency(Number(cardPay) || 0)}</strong></div>
              <div><span>CASH TAKEN</span><strong>{formatCurrency(cashTaken)}</strong></div>
            </section>
          </section>
        </article>

        <section className="vas-bill-actions">
          <button
            className="vas-save-button"
            disabled={!paymentCalculated || items.length === 0 || isSaving}
            onClick={saveCurrentInvoice}
            type="button"
          >
            {isSaving ? "Saving..." : "Save invoice"}
          </button>
          {saveMessage ? <p className="success-note">{saveMessage}</p> : null}
        </section>
      </section>
    </AppShell>
  );
}
