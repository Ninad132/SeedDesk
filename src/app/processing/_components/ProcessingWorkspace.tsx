"use client";

import { Factory, PackageCheck, RotateCcw, Save, Scale } from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/format";
import { saveGradingSession, saveInwardSlip, savePackingSession, undoLastProcessingAction } from "../actions";

export type InwardSlipRow = {
  amount: number;
  bag_size: number;
  bag_wt: number;
  bags: number;
  bouncing: number;
  datetime_in: string | null;
  first_wt: number;
  id: string;
  material_name: string;
  net_weight_qtl: number;
  net_wt: number;
  rate: number;
  second_wt: number;
  slip_no: number;
  supplier_name: string;
  truck_no: string | null;
  wgt_bag: number;
};

export type GradingSessionRow = {
  difference: number;
  final_graded: number;
  graded_bags: number;
  graded_quantity: number;
  grading_date: string;
  id: string;
  inward_slip_id: string | null;
  location: string | null;
  supplier_name: string;
  total_graded: number;
  undersize: number;
  variety: string;
  weight_receipt: number;
};

export type PackingSessionRow = {
  difference: number;
  grading_session_id: string | null;
  id: string;
  inward_slip_id: string | null;
  location: string | null;
  lot_no: string | null;
  no_of_bags: number;
  packing_date: string;
  packing_quantity: number;
  supplier_name: string;
  total_packed: number;
  variety: string;
};

type ProcessingWorkspaceProps = {
  gradingRows: GradingSessionRow[];
  inwardRows: InwardSlipRow[];
  packingRows: PackingSessionRow[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowLocal() {
  return new Date().toISOString().slice(0, 16);
}

function numberValue(value: string) {
  return Number(value) || 0;
}

function nullableNumber(value: string) {
  return value === "" ? null : Number(value);
}

function roundup(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

function qtlFromBags(bags: number, bagSize: number) {
  return (bags * bagSize) / 100;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export default function ProcessingWorkspace({ gradingRows, inwardRows, packingRows }: ProcessingWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [message, setMessage] = useState("");
  const supplierOptions = useMemo(
    () => unique([...inwardRows.map((row) => row.supplier_name), ...gradingRows.map((row) => row.supplier_name)]),
    [gradingRows, inwardRows]
  );
  const varietyOptions = useMemo(
    () => unique([...inwardRows.map((row) => row.material_name), ...gradingRows.map((row) => row.variety)]),
    [gradingRows, inwardRows]
  );

  const [slipNo, setSlipNo] = useState(String((inwardRows[0]?.slip_no ?? 1300) + 1));
  const [truckNo, setTruckNo] = useState("");
  const [datetimeIn, setDatetimeIn] = useState(nowLocal());
  const [datetimeOut, setDatetimeOut] = useState(nowLocal());
  const [firstWt, setFirstWt] = useState("");
  const [secondWt, setSecondWt] = useState("");
  const [materialName, setMaterialName] = useState(varietyOptions[0] ?? "");
  const [supplierName, setSupplierName] = useState(supplierOptions[0] ?? "");
  const [bags, setBags] = useState("0");
  const [bagSize, setBagSize] = useState("0");
  const [moisture, setMoisture] = useState("");
  const [germination, setGermination] = useState("");
  const [rate, setRate] = useState("");
  const [chequeAmount, setChequeAmount] = useState("0");
  const [cashAmount, setCashAmount] = useState("0");
  const [remark, setRemark] = useState("");
  const [inwardSeedType, setInwardSeedType] = useState<"VS" | "TL">("VS");
  const [shift, setShift] = useState("A");

  const inwardCalc = useMemo(() => {
    const netWt = Math.max(numberValue(firstWt) - numberValue(secondWt), 0);
    const bagWt = roundup(numberValue(bags) * numberValue(bagSize), 0);
    const wgtBag = (netWt - bagWt) / 100;
    const bouncing = roundup((netWt / 90) * 0.003, 2);
    const netWeight = wgtBag - bouncing;
    return {
      amount: netWeight * numberValue(rate),
      bagWt,
      bouncing,
      netWeight,
      netWt,
      wgtBag
    };
  }, [bagSize, bags, firstWt, rate, secondWt]);

  const [gradingDate, setGradingDate] = useState(today());
  const [selectedInwardId, setSelectedInwardId] = useState(inwardRows[0]?.id ?? "");
  const selectedInward = inwardRows.find((row) => row.id === selectedInwardId) ?? inwardRows[0];
  const gradingSupplier = selectedInward?.supplier_name ?? "";
  const gradingVariety = selectedInward?.material_name ?? "";
  const [gradedBags, setGradedBags] = useState("");
  const [gradedBagSize, setGradedBagSize] = useState("40");
  const [gradedLoose, setGradedLoose] = useState("0");
  const [undersize, setUndersize] = useState("0");
  const [usBags, setUsBags] = useState("0");
  const [gradingLocation, setGradingLocation] = useState("");
  const [gradingMoisture, setGradingMoisture] = useState("");
  const [gradingGermination, setGradingGermination] = useState("");
  const [gradingRemark, setGradingRemark] = useState("");

  const selectedInwardQuantity = useMemo(
    () =>
      selectedInward ? Number(selectedInward.wgt_bag ?? 0) : 0,
    [selectedInward]
  );
  const alreadyGradedQuantity = useMemo(
    () =>
      gradingRows
        .filter((row) => row.inward_slip_id === selectedInward?.id)
        .reduce((total, row) => {
          const finalGraded = Number(row.final_graded ?? 0);
          const totalGraded = Number(row.total_graded ?? 0);
          const undersizeValue = Number(row.undersize ?? 0);
          return total + (finalGraded > 0 ? finalGraded : totalGraded + undersizeValue);
        }, 0),
    [gradingRows, selectedInward]
  );
  const remainingGradingQuantity = Math.max(selectedInwardQuantity - alreadyGradedQuantity, 0);
  const gradingWeightReceipt = remainingGradingQuantity;
  const gradingCalc = useMemo(() => {
    const gradedQuantity = qtlFromBags(numberValue(gradedBags), numberValue(gradedBagSize));
    const totalGraded = gradedQuantity + numberValue(gradedLoose);
    const undersizeValue = numberValue(undersize);
    const finalGraded = totalGraded + undersizeValue;
    return {
      difference: gradingWeightReceipt - finalGraded,
      finalGraded,
      gradedQuantity,
      totalGraded,
      undersizePercent: gradingWeightReceipt > 0 ? (undersizeValue / gradingWeightReceipt) * 100 : 0
    };
  }, [gradedBagSize, gradedBags, gradedLoose, gradingWeightReceipt, undersize]);
  const gradingExceedsAvailable = gradingCalc.finalGraded > remainingGradingQuantity + 0.0001;

  const [packingDate, setPackingDate] = useState(today());
  const [selectedGradingId, setSelectedGradingId] = useState(gradingRows[0]?.id ?? "");
  const selectedGrading = gradingRows.find((row) => row.id === selectedGradingId) ?? gradingRows[0];
  const packingSupplier = selectedGrading?.supplier_name ?? "";
  const packingVariety = selectedGrading?.variety ?? "";
  const [noOfBags, setNoOfBags] = useState("");
  const [packingBagSize, setPackingBagSize] = useState("40");
  const [packingLoose, setPackingLoose] = useState("0");
  const [ghamsi, setGhamsi] = useState("0");
  const [lotNo, setLotNo] = useState("");
  const [packingSeedType, setPackingSeedType] = useState<"VS" | "TL">("VS");
  const [packingRate, setPackingRate] = useState("");
  const [packingLocation, setPackingLocation] = useState("");
  const [packingMoisture, setPackingMoisture] = useState("");
  const [packingGermination, setPackingGermination] = useState("");
  const [packingRemark, setPackingRemark] = useState("");
  const totalGradedQuantity = useMemo(
    () =>
      selectedGrading ? Number(selectedGrading.total_graded ?? 0) : 0,
    [selectedGrading]
  );
  const alreadyPackedQuantity = useMemo(
    () =>
      packingRows
        .filter((row) => row.grading_session_id === selectedGrading?.id)
        .reduce((total, row) => total + Number(row.total_packed ?? 0), 0),
    [packingRows, selectedGrading]
  );
  const availableGradedQuantity = totalGradedQuantity - alreadyPackedQuantity;
  const packingCalc = useMemo(() => {
    const packingQuantity = qtlFromBags(numberValue(noOfBags), numberValue(packingBagSize));
    const totalPacked = packingQuantity + numberValue(packingLoose) + numberValue(ghamsi);
    return {
      difference: availableGradedQuantity - totalPacked,
      packingQuantity,
      remainingQuantity: availableGradedQuantity,
      totalPacked
    };
  }, [availableGradedQuantity, ghamsi, noOfBags, packingBagSize, packingLoose]);
  const packingExceedsAvailable = packingCalc.totalPacked > availableGradedQuantity + 0.0001;

  const stats = [
    { label: "Inward slips", value: formatNumber(inwardRows.length) },
    { label: "Net Weight", value: `${formatNumber(inwardRows.reduce((total, row) => total + Number(row.net_weight_qtl ?? 0), 0))} qtl` },
    { label: "Total Graded", value: `${formatNumber(gradingRows.reduce((total, row) => total + Number(row.total_graded ?? 0), 0))} qtl` },
    { label: "Total Packed", value: `${formatNumber(packingRows.reduce((total, row) => total + Number(row.total_packed ?? 0), 0))} qtl` }
  ];

  function submitInward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startSaving(async () => {
      const result = await saveInwardSlip({
        bagSize: numberValue(bagSize),
        bags: numberValue(bags),
        cashAmount: numberValue(cashAmount),
        chequeAmount: numberValue(chequeAmount),
        datetimeIn,
        datetimeOut,
        firstWt: numberValue(firstWt),
        germination: nullableNumber(germination),
        materialName,
        moisture: nullableNumber(moisture),
        rate: numberValue(rate),
        remark,
        secondWt: numberValue(secondWt),
        seedType: inwardSeedType,
        shift,
        slipNo: numberValue(slipNo),
        supplierName,
        truckNo
      });
      setMessage("error" in result && result.error ? result.error : "Inward slip saved to Purchases as raw received stock.");
      if (!("error" in result)) router.refresh();
    });
  }

  function submitGrading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (gradingCalc.finalGraded <= 0) {
      setMessage("Enter graded bags, graded loose, or undersize before saving grading.");
      return;
    }

    if (gradingExceedsAvailable) {
      setMessage(
        `Cannot save grading. Final graded quantity ${formatNumber(gradingCalc.finalGraded)} qtl exceeds remaining slip balance ${formatNumber(remainingGradingQuantity)} qtl.`
      );
      return;
    }

    startSaving(async () => {
      const result = await saveGradingSession({
        germination: nullableNumber(gradingGermination),
        gradedBagSize: numberValue(gradedBagSize),
        gradedBags: numberValue(gradedBags),
        gradedLoose: numberValue(gradedLoose),
        gradingDate,
        inwardSlipId: selectedInwardId,
        location: gradingLocation,
        moisture: nullableNumber(gradingMoisture),
        remark: gradingRemark,
        supplierName: gradingSupplier,
        undersize: numberValue(undersize),
        usBags: numberValue(usBags),
        variety: gradingVariety,
        weightReceipt: gradingWeightReceipt
      });
      setMessage("error" in result && result.error ? result.error : "Grading session saved.");
      if (!("error" in result)) router.refresh();
    });
  }

  function undoLastAction() {
    const confirmed = window.confirm("Undo the latest processing action?");

    if (!confirmed) {
      return;
    }

    setMessage("");
    startSaving(async () => {
      const result = await undoLastProcessingAction();
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      if ("undone" in result) {
        setMessage(`Undone: ${result.undone} ${result.label}`.trim());
      }
      router.refresh();
    });
  }

  function submitPacking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (packingCalc.totalPacked <= 0) {
      setMessage("Enter no of bags, packing loose, or ghamsi before saving packing.");
      return;
    }

    if (packingExceedsAvailable) {
      setMessage(
        `Cannot save packing. Total packed quantity ${formatNumber(packingCalc.totalPacked)} qtl exceeds available graded quantity ${formatNumber(availableGradedQuantity)} qtl.`
      );
      return;
    }

    startSaving(async () => {
      const result = await savePackingSession({
        germination: nullableNumber(packingGermination),
        gradingSessionId: selectedGradingId,
        ghamsi: numberValue(ghamsi),
        gradedInput: totalGradedQuantity,
        location: packingLocation,
        lotNo,
        moisture: nullableNumber(packingMoisture),
        noOfBags: numberValue(noOfBags),
        packedQuantityBefore: alreadyPackedQuantity,
        packingBagSize: numberValue(packingBagSize),
        packingDate,
        packingLoose: numberValue(packingLoose),
        rate: numberValue(packingRate),
        remark: packingRemark,
        seedType: packingSeedType,
        supplierName: packingSupplier,
        variety: packingVariety
      });
      setMessage("error" in result && result.error ? result.error : "Packing session saved and sent to saleable inventory.");
      if (!("error" in result)) router.refresh();
    });
  }

  return (
    <>
      <section className="workspace-action-bar">
        <button className="form-submit" disabled={isSaving || (inwardRows.length === 0 && gradingRows.length === 0 && packingRows.length === 0)} onClick={undoLastAction} type="button">
          <RotateCcw size={18} />
          Undo last action
        </button>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-icon">
              <Factory size={20} />
            </div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="processing-grid">
        <article className="panel">
          <div className="panel-heading">
            <Scale size={19} />
            <h3>Inward slip</h3>
          </div>
          <form className="lot-form" onSubmit={submitInward}>
            <label><span>SLIPNO</span><input required type="number" value={slipNo} onChange={(e) => setSlipNo(e.target.value)} /></label>
            <label><span>Shift</span><select value={shift} onChange={(e) => setShift(e.target.value)}><option>A</option><option>B</option></select></label>
            <label><span>DateTime In</span><input type="datetime-local" value={datetimeIn} onChange={(e) => setDatetimeIn(e.target.value)} /></label>
            <label><span>DateTime Out</span><input type="datetime-local" value={datetimeOut} onChange={(e) => setDatetimeOut(e.target.value)} /></label>
            <label className="span-2"><span>Truck No</span><input value={truckNo} onChange={(e) => setTruckNo(e.target.value)} /></label>
            <label><span>First Wt</span><input type="number" value={firstWt} onChange={(e) => setFirstWt(e.target.value)} /></label>
            <label><span>Second Wt</span><input type="number" value={secondWt} onChange={(e) => setSecondWt(e.target.value)} /></label>
            <label><span>Material Name</span><input list="processing-varieties" required value={materialName} onChange={(e) => setMaterialName(e.target.value)} /></label>
            <label><span>Supplier Name</span><input list="processing-suppliers" required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} /></label>
            <label className="span-2"><span>Seed type</span><select value={inwardSeedType} onChange={(e) => setInwardSeedType(e.target.value as "VS" | "TL")}><option value="VS">VS - government certified</option><option value="TL">TL - unregistered</option></select></label>
            <label><span>Bags</span><input type="number" value={bags} onChange={(e) => setBags(e.target.value)} /></label>
            <label><span>Size</span><input type="number" value={bagSize} onChange={(e) => setBagSize(e.target.value)} /></label>
            <label><span>RATE</span><input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></label>
            <label><span>NET WEIGHT</span><input readOnly value={formatNumber(inwardCalc.netWeight)} /></label>
            <label><span>MOISTURE</span><input type="number" value={moisture} onChange={(e) => setMoisture(e.target.value)} /></label>
            <label><span>GERMINATION</span><input type="number" value={germination} onChange={(e) => setGermination(e.target.value)} /></label>
            <label><span>CHEQUE</span><input type="number" value={chequeAmount} onChange={(e) => setChequeAmount(e.target.value)} /></label>
            <label><span>CASH</span><input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} /></label>
            <label className="span-2"><span>REMARK</span><input value={remark} onChange={(e) => setRemark(e.target.value)} /></label>
            <div className="calculation-strip span-2">
              <span>Net Wt {formatNumber(inwardCalc.netWt)} kg</span>
              <span>Bag Wt {formatNumber(inwardCalc.bagWt)}</span>
              <span>Bouncing {formatNumber(inwardCalc.bouncing)}</span>
              <strong>{formatCurrency(inwardCalc.amount)}</strong>
            </div>
            <button className="form-submit span-2" disabled={isSaving} type="submit"><Save size={18} />Save inward</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <Factory size={19} />
            <h3>Grading</h3>
          </div>
          <form className="lot-form" onSubmit={submitGrading}>
            <label><span>GRADING DATE</span><input type="date" value={gradingDate} onChange={(e) => setGradingDate(e.target.value)} /></label>
            <label className="span-2"><span>INWARD SLIP</span><select required value={selectedInwardId} onChange={(e) => setSelectedInwardId(e.target.value)}>{inwardRows.map((row) => <option key={row.id} value={row.id}>SLIP-{row.slip_no} | {row.material_name} | {row.supplier_name}</option>)}</select></label>
            <label><span>Supplier Name</span><input readOnly value={gradingSupplier} /></label>
            <label><span>VARIETY</span><input readOnly value={gradingVariety} /></label>
            <label><span>WEIGHT RECPT</span><input readOnly value={formatNumber(selectedInwardQuantity)} /></label>
            <label><span>Already graded quantity</span><input readOnly value={formatNumber(alreadyGradedQuantity)} /></label>
            <label><span>Remaining grading quantity</span><input readOnly value={formatNumber(remainingGradingQuantity)} /></label>
            <label><span>GRADED BAGS</span><input min="0" type="number" value={gradedBags} onChange={(e) => setGradedBags(e.target.value)} /></label>
            <label><span>GRADED BAG SIZE</span><input min="0" type="number" value={gradedBagSize} onChange={(e) => setGradedBagSize(e.target.value)} /></label>
            <label><span>GRADED LOOSE</span><input min="0" type="number" value={gradedLoose} onChange={(e) => setGradedLoose(e.target.value)} /></label>
            <label><span>UNDERSIZE</span><input min="0" type="number" value={undersize} onChange={(e) => setUndersize(e.target.value)} /></label>
            <label><span>U/S BAG</span><input min="0" type="number" value={usBags} onChange={(e) => setUsBags(e.target.value)} /></label>
            <label><span>LOCATION</span><input value={gradingLocation} onChange={(e) => setGradingLocation(e.target.value)} /></label>
            <label><span>MOISTURE</span><input type="number" value={gradingMoisture} onChange={(e) => setGradingMoisture(e.target.value)} /></label>
            <label><span>GERMINATION</span><input type="number" value={gradingGermination} onChange={(e) => setGradingGermination(e.target.value)} /></label>
            <label className="span-2"><span>REMARK</span><input value={gradingRemark} onChange={(e) => setGradingRemark(e.target.value)} /></label>
            <div className="calculation-strip span-2">
              <span>Receipt balance {formatNumber(gradingWeightReceipt)}</span>
              <span>Total {formatNumber(gradingCalc.totalGraded)}</span>
              <span>U/S {formatNumber(gradingCalc.undersizePercent)}%</span>
              <span>Final {formatNumber(gradingCalc.finalGraded)}</span>
              <strong>Diff {formatNumber(gradingCalc.difference)}</strong>
            </div>
            {gradingExceedsAvailable ? (
              <p className="row-error span-2">
                Final graded quantity cannot exceed remaining grading quantity for this slip.
              </p>
            ) : null}
            <button className="form-submit span-2" disabled={isSaving || !selectedInwardId || remainingGradingQuantity <= 0 || gradingCalc.finalGraded <= 0 || gradingExceedsAvailable} type="submit"><Save size={18} />Save grading</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <PackageCheck size={19} />
            <h3>Packing</h3>
          </div>
          <form className="lot-form" onSubmit={submitPacking}>
            <label><span>PACKING DATE</span><input type="date" value={packingDate} onChange={(e) => setPackingDate(e.target.value)} /></label>
            <label className="span-2"><span>GRADING SESSION</span><select required value={selectedGradingId} onChange={(e) => setSelectedGradingId(e.target.value)}>{gradingRows.map((row) => <option key={row.id} value={row.id}>{row.grading_date} | {row.variety} | {row.supplier_name} | {formatNumber(Number(row.total_graded ?? 0))} qtl</option>)}</select></label>
            <label><span>Supplier Name</span><input readOnly value={packingSupplier} /></label>
            <label><span>VARIETY</span><input readOnly value={packingVariety} /></label>
            <label><span>Total graded quantity</span><input readOnly value={formatNumber(totalGradedQuantity)} /></label>
            <label><span>Already packed quantity</span><input readOnly value={formatNumber(alreadyPackedQuantity)} /></label>
            <label className="span-2"><span>Available graded quantity</span><input readOnly value={formatNumber(availableGradedQuantity)} /></label>
            <label><span>NO OF BAGS</span><input min="0" type="number" value={noOfBags} onChange={(e) => setNoOfBags(e.target.value)} /></label>
            <label><span>PACKING BAG SIZE</span><input min="0" type="number" value={packingBagSize} onChange={(e) => setPackingBagSize(e.target.value)} /></label>
            <label><span>PACKING LOOSE</span><input min="0" type="number" value={packingLoose} onChange={(e) => setPackingLoose(e.target.value)} /></label>
            <label><span>GHAMSI</span><input min="0" type="number" value={ghamsi} onChange={(e) => setGhamsi(e.target.value)} /></label>
            <label><span>LOT NO</span><input value={lotNo} onChange={(e) => setLotNo(e.target.value)} /></label>
            <label><span>Seed type</span><select value={packingSeedType} onChange={(e) => setPackingSeedType(e.target.value as "VS" | "TL")}><option value="VS">VS - government certified</option><option value="TL">TL - unregistered</option></select></label>
            <label><span>RATE</span><input type="number" value={packingRate} onChange={(e) => setPackingRate(e.target.value)} /></label>
            <label><span>LOCATION</span><input value={packingLocation} onChange={(e) => setPackingLocation(e.target.value)} /></label>
            <label><span>MOISTURE</span><input type="number" value={packingMoisture} onChange={(e) => setPackingMoisture(e.target.value)} /></label>
            <label><span>GERMINATION</span><input type="number" value={packingGermination} onChange={(e) => setPackingGermination(e.target.value)} /></label>
            <label className="span-2"><span>REMARK / LOCATOIN</span><input value={packingRemark} onChange={(e) => setPackingRemark(e.target.value)} /></label>
            <div className="calculation-strip span-2">
              <span>Available {formatNumber(packingCalc.remainingQuantity)}</span>
              <span>Packing Qty {formatNumber(packingCalc.packingQuantity)}</span>
              <span>Total {formatNumber(packingCalc.totalPacked)}</span>
              <strong>Remaining {formatNumber(packingCalc.difference)}</strong>
            </div>
            {packingExceedsAvailable ? (
              <p className="row-error span-2">
                Total packed quantity cannot exceed available graded quantity.
              </p>
            ) : null}
            <button className="form-submit span-2" disabled={isSaving || !selectedGradingId || availableGradedQuantity <= 0 || packingCalc.totalPacked <= 0 || packingExceedsAvailable} type="submit"><Save size={18} />Save packing</button>
          </form>
        </article>

        <datalist id="processing-suppliers">
          {supplierOptions.map((supplier) => <option key={supplier} value={supplier} />)}
        </datalist>
        <datalist id="processing-varieties">
          {varietyOptions.map((variety) => <option key={variety} value={variety} />)}
        </datalist>
      </section>

      {message ? <p className="success-note">{message}</p> : null}

      <section className="panel table-panel">
        <div className="panel-heading">
          <Factory size={19} />
          <h3>Recent INWARDDATA rows</h3>
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
              </tr>
            </thead>
            <tbody>
              {inwardRows.length > 0 ? inwardRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.slip_no}</td>
                  <td>{row.truck_no}</td>
                  <td>{row.material_name}</td>
                  <td>{row.supplier_name}</td>
                  <td>{formatNumber(Number(row.net_wt ?? 0))}</td>
                  <td>{formatNumber(Number(row.net_weight_qtl ?? 0))}</td>
                  <td>{formatCurrency(Number(row.rate ?? 0))}</td>
                  <td>{formatCurrency(Number(row.amount ?? 0))}</td>
                </tr>
              )) : (
                <tr><td colSpan={8}>No inward slips saved yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
