"use client";

import { RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { formatNumber } from "@/lib/format";
import { saveStockAdjustment, type StockAdjustmentType } from "../actions";

export type AdjustmentLotOption = {
  availableBags: number;
  currentBags: number;
  holdBags: number;
  id: string;
  label: string;
};

type StockAdjustmentFormProps = {
  lots: AdjustmentLotOption[];
};

const adjustmentLabels: Record<StockAdjustmentType, string> = {
  add: "Add",
  hold: "Hold",
  release: "Release",
  remove: "Remove"
};

export default function StockAdjustmentForm({ lots }: StockAdjustmentFormProps) {
  const router = useRouter();
  const firstLot = lots[0];
  const [seedLotId, setSeedLotId] = useState(firstLot?.id ?? "");
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>("hold");
  const [bags, setBags] = useState("1");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [isSaving, startSaving] = useTransition();
  const selectedLot = useMemo(() => lots.find((lot) => lot.id === seedLotId) ?? firstLot, [firstLot, lots, seedLotId]);

  function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startSaving(async () => {
      const result = await saveStockAdjustment({
        adjustmentDate,
        adjustmentType,
        bags: Number(bags) || 0,
        notes,
        reason,
        seedLotId
      });

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      setBags("1");
      setReason("");
      setNotes("");
      setMessage("Stock adjustment saved.");
      router.refresh();
    });
  }

  return (
    <article className="panel">
      <div className="panel-heading">
        <RotateCcw size={19} />
        <h3>Stock adjustment</h3>
      </div>
      <form className="lot-form" onSubmit={submitAdjustment}>
        <label className="span-2">
          <span>Lot No</span>
          <select required value={seedLotId} onChange={(event) => setSeedLotId(event.target.value)}>
            {lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select value={adjustmentType} onChange={(event) => setAdjustmentType(event.target.value as StockAdjustmentType)}>
            {(Object.keys(adjustmentLabels) as StockAdjustmentType[]).map((type) => (
              <option key={type} value={type}>
                {adjustmentLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Date</span>
          <input required type="date" value={adjustmentDate} onChange={(event) => setAdjustmentDate(event.target.value)} />
        </label>
        <label>
          <span>Bags</span>
          <input min="0.01" required step="0.01" type="number" value={bags} onChange={(event) => setBags(event.target.value)} />
        </label>
        <label>
          <span>Available</span>
          <input readOnly value={formatNumber(selectedLot?.availableBags ?? 0)} />
        </label>
        <label>
          <span>Current bags</span>
          <input readOnly value={formatNumber(selectedLot?.currentBags ?? 0)} />
        </label>
        <label>
          <span>HOLD</span>
          <input readOnly value={formatNumber(selectedLot?.holdBags ?? 0)} />
        </label>
        <label className="span-2">
          <span>Reason</span>
          <input required value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <label className="span-2">
          <span>Notes</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="form-submit span-2" disabled={isSaving || lots.length === 0} type="submit">
          <Save size={18} />
          {isSaving ? "Saving adjustment..." : "Save adjustment"}
        </button>
      </form>
      {message ? <p className="success-note">{message}</p> : null}
    </article>
  );
}
