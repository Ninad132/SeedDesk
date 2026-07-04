"use client";

import { FileCheck2, Plus, Printer, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { AppShell } from "@/components/AppShell";
import { formatCurrency, formatNumber } from "@/lib/format";
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
  lotNo: string;
  packingKg: number;
  rate: number;
};

type InvoiceItem = {
  id: string;
  lotNo: string;
  bags: number;
  seedLotId: string;
  weight: number;
  quantity: number;
  rate: number;
  amount: number;
};

const MAX_INVOICE_ITEMS = 5;

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
  const [cashTaken, setCashTaken] = useState("0");
  const [paymentCalculated, setPaymentCalculated] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, startSaving] = useTransition();
  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? firstCustomer;
  const selectedLot = lots.find((lot) => lot.id === lotId);
  const invoiceColumn1 = selectedLot?.column1 ?? "VS";
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
  const draftBags = Number(bags) || 0;
  const draftQuantity = draftBags > 0 && selectedLot ? quantityQuintal(draftBags, selectedLot.packingKg) : 0;
  const draftAmount = selectedLot ? draftQuantity * selectedLot.rate : 0;
  const totalBags = useMemo(() => items.reduce((total, item) => total + item.bags, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const discountAmount = Number(discount) || 0;
  const calculatedGrandTotal = Math.max(subtotal - discountAmount, 0);
  const calculatedReceived = (Number(cardPay) || 0) + (Number(cashTaken) || 0);
  const calculatedDifference = calculatedGrandTotal - calculatedReceived;
  const grandTotal = paymentCalculated ? calculatedGrandTotal : subtotal;
  const received = paymentCalculated ? calculatedReceived : 0;
  const difference = paymentCalculated ? calculatedDifference : subtotal;
  const canAddMoreItems = items.length < MAX_INVOICE_ITEMS;
  const printRows = Array.from({ length: MAX_INVOICE_ITEMS }, (_, index) => items[index] ?? null);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bagCount = Number(bags) || 0;

    if (!canAddMoreItems) {
      return;
    }

    if (!selectedLot || bagCount <= 0 || bagCount > selectedLot.availableBags) {
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

  function saveCurrentInvoice() {
    if (!paymentCalculated || items.length === 0) {
      return;
    }

    startSaving(async () => {
      const result = await saveInvoice({
        cardPay: Number(cardPay) || 0,
        cashTaken: Number(cashTaken) || 0,
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
      setCashTaken("0");
      setSaveMessage("Invoice saved successfully.");
      router.refresh();
    });
  }

  return (
    <AppShell
      action={
        <button className="secondary-inline" onClick={() => window.print()} type="button">
          <Printer size={17} />
          Print invoice
        </button>
      }
      eyebrow="Invoice"
      title="New Invoice"
    >
      <section className="invoice-workspace">
        <article className="panel">
          <div className="panel-heading">
            <FileCheck2 size={19} />
            <h3>Invoice details</h3>
          </div>
          <form className="lot-form" onSubmit={addItem}>
            <label>
              <span>Invoice no</span>
              <input readOnly value={nextInvoiceNo} />
            </label>
            <label>
              <span>Column 1</span>
              <input readOnly value={invoiceColumn1} />
            </label>
            <label className="span-2">
              <span>Customer source</span>
              <select value={customerMode} onChange={(event) => setCustomerMode(event.target.value as "master" | "manual")}>
                <option value="master">Master customer list</option>
                <option value="manual">Manual new customer</option>
              </select>
            </label>
            {customerMode === "master" ? (
              <label className="span-2">
                <span>Customer name</span>
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
                <span>Customer name</span>
                <input
                  required
                  value={manualCustomerName}
                  onChange={(event) => setManualCustomerName(event.target.value)}
                />
              </label>
            )}
            <label>
              <span>Village</span>
              <input
                readOnly={customerMode === "master"}
                value={invoiceCustomer.village}
                onChange={(event) => setManualVillage(event.target.value)}
              />
            </label>
            <label>
              <span>Mobile No</span>
              <input
                readOnly={customerMode === "master"}
                value={invoiceCustomer.mobileNo}
                onChange={(event) => setManualMobileNo(event.target.value)}
              />
            </label>
            <label>
              <span>remark</span>
              <input
                readOnly={customerMode === "master"}
                value={invoiceCustomer.remark}
                onChange={(event) => setManualRemark(event.target.value)}
              />
            </label>
            <label>
              <span>RATE</span>
              <input readOnly value={selectedLot ? formatCurrency(selectedLot.rate) : ""} />
            </label>
            <label className="span-2">
              <span>Items</span>
              <select value={lotId} onChange={(event) => setLotId(event.target.value)}>
                <option value="">Select item</option>
                {lots.map((lot) => (
                  <option disabled={lot.availableBags <= 0} key={lot.id} value={lot.id}>
                    {lot.lotNo} | In Stock: {formatNumber(lot.availableBags)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Bags</span>
              <input min="1" type="number" value={bags} onChange={(event) => setBags(event.target.value)} />
            </label>
            <label>
              <span>Weight</span>
              <input readOnly value={formatNumber(selectedLot?.packingKg ?? 0)} />
            </label>
            <button className="form-submit span-2" disabled={!selectedLot || !canAddMoreItems} type="submit">
              <Plus size={18} />
              Add item ({items.length}/{MAX_INVOICE_ITEMS})
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <FileCheck2 size={19} />
            <h3>Payment</h3>
          </div>
          <div className="lot-form single-field">
            <label>
              <span>Discoumt</span>
              <input
                min="0"
                type="number"
                value={discount}
                onChange={(event) => {
                  setDiscount(event.target.value);
                  setPaymentCalculated(false);
                }}
              />
            </label>
            <label>
              <span>Card Pay</span>
              <input
                min="0"
                type="number"
                value={cardPay}
                onChange={(event) => {
                  setCardPay(event.target.value);
                  setPaymentCalculated(false);
                }}
              />
            </label>
            <label>
              <span>CASH TAKEN</span>
              <input
                min="0"
                type="number"
                value={cashTaken}
                onChange={(event) => {
                  setCashTaken(event.target.value);
                  setPaymentCalculated(false);
                }}
              />
            </label>
            <button className="form-submit" disabled={items.length === 0} onClick={calculatePayment} type="button">
              Calculate payment
            </button>
            <dl className="payment-result-list">
              <div>
                <dt>GRAND TOTAL</dt>
                <dd>{paymentCalculated ? formatCurrency(grandTotal) : "Not calculated"}</dd>
              </div>
              <div>
                <dt>Difference</dt>
                <dd>{paymentCalculated ? formatCurrency(difference) : "Not calculated"}</dd>
              </div>
            </dl>
            {saveMessage ? <p className="success-note">{saveMessage}</p> : null}
          </div>
        </article>

        <article className="panel invoice-items-panel">
          <div className="panel-heading table-heading">
            <div>
              <h3>Invoice items</h3>
              <p>Up to 5 items can be added. Removing an item updates TOTAL BILL AMOUT, GRAND TOTAL, and Difference.</p>
            </div>
          </div>
          <div className="stock-table-wrap">
            <table className="stock-table compact-table">
              <thead>
                <tr>
                  <th>Particular</th>
                  <th>Bags</th>
                  <th>Weight</th>
                  <th>Quantity</th>
                  <th>RATE</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.lotNo}</td>
                      <td>{formatNumber(item.bags)}</td>
                      <td>{formatNumber(item.weight)}</td>
                      <td>{formatNumber(item.quantity)}</td>
                      <td>{formatCurrency(item.rate)}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>
                        <button className="icon-action danger-action" onClick={() => removeItem(item.id)} type="button">
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>No items added.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel invoice-preview-panel">
          <div className="panel-heading table-heading">
            <div>
              <h3>Invoice print preview</h3>
              <p>Uses the same rows that become Sale rows.</p>
            </div>
          </div>
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
            <div className="invoice-print-subtitle">GST EXEMPTED WHEAT SEED</div>
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
              <div><span>Card Pay</span><strong>{formatCurrency(Number(cardPay) || 0)}</strong></div>
              <div><span>CASH TAKEN</span><strong>{formatCurrency(Number(cashTaken) || 0)}</strong></div>
            </section>
          </section>
        </article>

        <section className="invoice-finalize-bar">
          <button
            className="form-submit"
            disabled={!paymentCalculated || items.length === 0 || isSaving}
            onClick={saveCurrentInvoice}
            type="button"
          >
            {isSaving ? "Saving..." : "Save invoice"}
          </button>
        </section>
      </section>
    </AppShell>
  );
}
