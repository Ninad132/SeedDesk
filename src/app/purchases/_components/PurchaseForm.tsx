"use client";

import { PackagePlus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { quantityQuintal } from "@/lib/inventory";
import { savePurchase } from "../actions";

type PurchaseFormProps = {
  productNames: string[];
};

export default function PurchaseForm({ productNames }: PurchaseFormProps) {
  const router = useRouter();
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierName, setSupplierName] = useState("");
  const [column3, setColumn3] = useState(productNames[0] ?? "");
  const [lotNo, setLotNo] = useState("");
  const [bags, setBags] = useState("1");
  const [weight, setWeight] = useState("40");
  const [rate, setRate] = useState("0");
  const [seedType, setSeedType] = useState<"VS" | "TL">("VS");
  const [sourceState, setSourceState] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, startSaving] = useTransition();

  const variety = useMemo(() => [column3.trim(), lotNo.trim()].filter(Boolean).join(" "), [column3, lotNo]);
  const quantity = quantityQuintal(Number(bags) || 0, Number(weight) || 0);
  const amount = quantity * (Number(rate) || 0);

  function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startSaving(async () => {
      const result = await savePurchase({
        bags: Number(bags) || 0,
        column3,
        lotNo,
        purchaseDate,
        rate: Number(rate) || 0,
        seedType,
        sourceState,
        supplierName,
        variety,
        weight: Number(weight) || 0
      });

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      setLotNo("");
      setBags("1");
      setSourceState("");
      setMessage("Purchase saved and inventory updated.");
      router.refresh();
    });
  }

  return (
    <article className="panel">
      <div className="panel-heading">
        <PackagePlus size={19} />
        <h3>Add stock</h3>
      </div>
      <form className="lot-form" onSubmit={submitPurchase}>
        <label>
          <span>Date</span>
          <input required type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
        </label>
        <label>
          <span>Supplier</span>
          <input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
        </label>
        <label>
          <span>Column3</span>
          <input
            list="purchase-products"
            required
            value={column3}
            onChange={(event) => setColumn3(event.target.value)}
          />
          <datalist id="purchase-products">
            {productNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label>
          <span>Lot No</span>
          <input required value={lotNo} onChange={(event) => setLotNo(event.target.value)} />
        </label>
        <label className="span-2">
          <span>Variety</span>
          <input readOnly value={variety} />
        </label>
        <label>
          <span>Bags</span>
          <input min="0.01" required step="0.01" type="number" value={bags} onChange={(event) => setBags(event.target.value)} />
        </label>
        <label>
          <span>Weight</span>
          <input min="0.01" required step="0.01" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label>
          <span>Quantity</span>
          <input readOnly value={formatNumber(quantity)} />
        </label>
        <label>
          <span>Rate</span>
          <input min="0" step="0.01" type="number" value={rate} onChange={(event) => setRate(event.target.value)} />
        </label>
        <label>
          <span>xyz</span>
          <input placeholder="MP, GD, GJ" value={sourceState} onChange={(event) => setSourceState(event.target.value)} />
        </label>
        <label>
          <span>Seed type</span>
          <select value={seedType} onChange={(event) => setSeedType(event.target.value as "VS" | "TL")}>
            <option value="VS">VS - government certified</option>
            <option value="TL">TL - unregistered</option>
          </select>
        </label>
        <label>
          <span>Value</span>
          <input readOnly value={formatCurrency(amount)} />
        </label>
        <button className="form-submit span-2" disabled={isSaving} type="submit">
          <Save size={18} />
          {isSaving ? "Saving purchase..." : "Save purchase"}
        </button>
      </form>
      {message ? <p className="success-note">{message}</p> : null}
    </article>
  );
}
