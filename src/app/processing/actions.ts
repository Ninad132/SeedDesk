"use server";

import { revalidatePath } from "next/cache";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

export type SaveInwardSlipInput = {
  bagSize: number;
  bags: number;
  cashAmount: number;
  chequeAmount: number;
  datetimeIn: string;
  datetimeOut: string;
  firstWt: number;
  germination: number | null;
  materialName: string;
  moisture: number | null;
  rate: number;
  remark: string;
  secondWt: number;
  seedType: "VS" | "TL";
  shift: string;
  slipNo: number;
  supplierName: string;
  truckNo: string;
};

export type SaveGradingSessionInput = {
  germination: number | null;
  gradedBagSize: number;
  gradedBags: number;
  gradedLoose: number;
  gradingDate: string;
  inwardSlipId: string;
  location: string;
  moisture: number | null;
  remark: string;
  supplierName: string;
  undersize: number;
  usBags: number;
  variety: string;
  weightReceipt: number;
};

export type SavePackingSessionInput = {
  germination: number | null;
  gradingSessionId: string;
  ghamsi: number;
  gradedInput: number;
  location: string;
  lotNo: string;
  moisture: number | null;
  noOfBags: number;
  packedQuantityBefore: number;
  packingBagSize: number;
  packingDate: string;
  packingLoose: number;
  rate: number;
  remark: string;
  seedType: "VS" | "TL";
  supplierName: string;
  variety: string;
};

function numberValue(value: number | null | undefined) {
  return Number(value ?? 0);
}

function roundup(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

function qtlFromBags(bags: number, bagSize: number) {
  return (bags * bagSize) / 100;
}

export async function saveInwardSlip(input: SaveInwardSlipInput) {
  const slipNo = Number(input.slipNo) || 0;
  const materialName = input.materialName.trim();
  const supplierName = input.supplierName.trim();
  const seedType = input.seedType === "TL" ? "TL" : "VS";

  if (!slipNo || !materialName || !supplierName) {
    return { error: "Slip No, Material Name, and Supplier Name are required." };
  }

  const firstWt = numberValue(input.firstWt);
  const secondWt = numberValue(input.secondWt);
  const bags = numberValue(input.bags);
  const bagSize = numberValue(input.bagSize);
  const rate = numberValue(input.rate);
  const netWt = Math.max(firstWt - secondWt, 0);
  const bagWt = roundup(bags * bagSize, 0);
  const wgtBag = (netWt - bagWt) / 100;
  const bouncing = roundup((netWt / 90) * 0.003, 2);
  const netWeightQtl = wgtBag - bouncing;
  const amount = rate * netWeightQtl;
  const lotNo = `SLIP-${slipNo}`;
  const db = createServerAnonSupabaseClient() as any;

  const { data: existingProduct, error: productReadError } = await db
    .from("products")
    .select("id")
    .eq("company_id", demoSession.company.id)
    .eq("display_name", materialName)
    .maybeSingle();

  if (productReadError) {
    return { error: `Could not check product: ${productReadError.message}` };
  }

  let productId = existingProduct?.id;

  if (!productId) {
    const { data: product, error: productError } = await db
      .from("products")
      .insert({
        company_id: demoSession.company.id,
        crop: "Wheat",
        default_packing_kg: bagSize,
        default_rate: rate,
        display_name: materialName,
        variety_name: materialName
      })
      .select("id")
      .single();

    if (productError) {
      return { error: `Could not save product: ${productError.message}` };
    }

    productId = product.id;
  }

  const { data: existingLot, error: lotReadError } = await db
    .from("seed_lots")
    .select("id,opening_bags,current_bags")
    .eq("company_id", demoSession.company.id)
    .eq("product_id", productId)
    .eq("lot_number", lotNo)
    .eq("packing_kg", bagSize)
    .maybeSingle();

  if (lotReadError) {
    return { error: `Could not check stock lot: ${lotReadError.message}` };
  }

  let seedLotId = existingLot?.id;

  if (seedLotId) {
    const { error: lotUpdateError } = await db
      .from("seed_lots")
      .update({
        current_bags: Number(existingLot.current_bags ?? 0) + bags,
        opening_bags: Number(existingLot.opening_bags ?? 0) + bags,
        rate,
        seed_class: seedType,
        source_state: "INWARD"
      })
      .eq("id", seedLotId);

    if (lotUpdateError) {
      return { error: `Could not update inventory lot: ${lotUpdateError.message}` };
    }
  } else {
    const { data: lot, error: lotError } = await db
      .from("seed_lots")
      .insert({
        company_id: demoSession.company.id,
        current_bags: bags,
        hold_bags: 0,
        lot_number: lotNo,
        opening_bags: bags,
        packing_kg: bagSize,
        product_id: productId,
        rate,
        received_at: input.datetimeIn ? input.datetimeIn.slice(0, 10) : new Date().toISOString().slice(0, 10),
        seed_class: seedType,
        source_state: "INWARD"
      })
      .select("id")
      .single();

    if (lotError) {
      return { error: `Could not save inventory lot: ${lotError.message}` };
    }

    seedLotId = lot.id;
  }

  const { data: purchase, error: purchaseError } = await db
    .from("purchases")
    .insert({
      company_id: demoSession.company.id,
      notes: `Inward slip ${slipNo}`,
      purchase_date: input.datetimeIn ? input.datetimeIn.slice(0, 10) : new Date().toISOString().slice(0, 10),
      supplier_name: supplierName
    })
    .select("id")
    .single();

  if (purchaseError) {
    return { error: `Inventory lot saved, but purchase row failed: ${purchaseError.message}` };
  }

  const { error: purchaseItemError } = await db.from("purchase_items").insert({
    bags,
    company_id: demoSession.company.id,
    packing_kg: bagSize,
    purchase_id: purchase.id,
    rate,
    seed_lot_id: seedLotId
  });

  if (purchaseItemError) {
    return { error: `Inventory lot saved, but purchase item failed: ${purchaseItemError.message}` };
  }

  const { data, error } = await db
    .from("inward_slips")
    .insert({
      amount,
      bag_size: bagSize,
      bag_wt: bagWt,
      bags,
      bouncing,
      cash_amount: numberValue(input.cashAmount),
      cheque_amount: numberValue(input.chequeAmount),
      company_id: demoSession.company.id,
      datetime_in: input.datetimeIn || null,
      datetime_out: input.datetimeOut || null,
      first_wt: firstWt,
      germination: input.germination,
      material_name: materialName,
      moisture: input.moisture,
      net_weight_qtl: netWeightQtl,
      net_wt: netWt,
      rate,
      remark: input.remark.trim() || null,
      second_wt: secondWt,
      purchase_id: purchase.id,
      seed_lot_id: seedLotId,
      seed_type: seedType,
      shift: input.shift.trim() || null,
      slip_no: slipNo,
      supplier_name: supplierName,
      truck_no: input.truckNo.trim() || null,
      wgt_bag: wgtBag
    })
    .select("id")
    .single();

  if (error) {
    return { error: `Could not save inward slip: ${error.message}` };
  }

  const { error: rawLotLineageError } = await db
    .from("seed_lots")
    .update({ inward_slip_id: data.id })
    .eq("id", seedLotId)
    .eq("company_id", demoSession.company.id);

  if (rawLotLineageError) {
    return { error: `Inward saved, but raw stock lineage update failed: ${rawLotLineageError.message}` };
  }

  revalidatePath("/processing");
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/reports");
  revalidatePath("/");
  return { id: data.id };
}

export async function saveGradingSession(input: SaveGradingSessionInput) {
  const inwardSlipId = input.inwardSlipId.trim();
  const supplierName = input.supplierName.trim();
  const variety = input.variety.trim();

  if (!input.gradingDate || !inwardSlipId || !supplierName || !variety) {
    return { error: "Date, Inward slip, Supplier Name, and Variety are required." };
  }

  const gradedBags = numberValue(input.gradedBags);
  const gradedBagSize = numberValue(input.gradedBagSize);
  const gradedLoose = numberValue(input.gradedLoose);
  const undersize = numberValue(input.undersize);
  const gradedQuantity = qtlFromBags(gradedBags, gradedBagSize);
  const totalGraded = gradedQuantity + gradedLoose;
  const finalGraded = totalGraded + undersize;
  const db = createServerAnonSupabaseClient() as any;

  if (gradedBags < 0 || gradedBagSize < 0 || gradedLoose < 0 || undersize < 0 || finalGraded <= 0) {
    return { error: "Grading quantity must be greater than zero and cannot contain negative values." };
  }

  const { data: inwardSlip, error: inwardReadError } = await db
    .from("inward_slips")
    .select("id,wgt_bag")
    .eq("id", inwardSlipId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (inwardReadError) {
    return { error: `Could not read inward slip balance: ${inwardReadError.message}` };
  }

  const { data: existingGradingRows, error: gradingReadError } = await db
    .from("grading_sessions")
    .select("final_graded,total_graded,undersize")
    .eq("company_id", demoSession.company.id)
    .eq("inward_slip_id", inwardSlipId);

  if (gradingReadError) {
    return { error: `Could not read existing grading balance: ${gradingReadError.message}` };
  }

  const alreadyGraded = (existingGradingRows ?? []).reduce((total: number, row: any) => {
    const rowFinalGraded = Number(row.final_graded ?? 0);
    const rowTotalGraded = Number(row.total_graded ?? 0);
    const rowUndersize = Number(row.undersize ?? 0);
    return total + (rowFinalGraded > 0 ? rowFinalGraded : rowTotalGraded + rowUndersize);
  }, 0);
  const remainingBeforeSave = Math.max(Number(inwardSlip.wgt_bag ?? 0) - alreadyGraded, 0);

  if (finalGraded > remainingBeforeSave + 0.0001) {
    return {
      error: `Cannot save grading. Final graded quantity ${finalGraded.toFixed(2)} qtl exceeds remaining slip balance ${remainingBeforeSave.toFixed(2)} qtl.`
    };
  }

  const undersizePercent = remainingBeforeSave > 0 ? (undersize / remainingBeforeSave) * 100 : 0;
  const difference = remainingBeforeSave - finalGraded;

  const { data, error } = await db
    .from("grading_sessions")
    .insert({
      company_id: demoSession.company.id,
      difference,
      final_graded: finalGraded,
      germination: input.germination,
      graded_bag_size: gradedBagSize,
      graded_bags: gradedBags,
      graded_loose: gradedLoose,
      graded_quantity: gradedQuantity,
      grading_date: input.gradingDate,
      inward_slip_id: inwardSlipId,
      location: input.location.trim() || null,
      moisture: input.moisture,
      remark: input.remark.trim() || null,
      supplier_name: supplierName,
      total_graded: totalGraded,
      undersize,
      undersize_percent: undersizePercent,
      us_bags: numberValue(input.usBags),
      variety,
      weight_receipt: remainingBeforeSave
    })
    .select("id")
    .single();

  if (error) {
    return { error: `Could not save grading session: ${error.message}` };
  }

  revalidatePath("/processing");
  revalidatePath("/purchases");
  revalidatePath("/reports");
  return { id: data.id };
}

export async function deleteGradingSession(gradingSessionId: string) {
  const id = gradingSessionId.trim();

  if (!id) {
    return { error: "Grading session is required." };
  }

  const db = createServerAnonSupabaseClient() as any;

  const { data: gradingSession, error: gradingReadError } = await db
    .from("grading_sessions")
    .select("id")
    .eq("id", id)
    .eq("company_id", demoSession.company.id)
    .single();

  if (gradingReadError) {
    return { error: `Could not read grading session: ${gradingReadError.message}` };
  }

  const { data: linkedPackingRows, error: packingReadError } = await db
    .from("packing_sessions")
    .select("id")
    .eq("company_id", demoSession.company.id)
    .eq("grading_session_id", gradingSession.id)
    .limit(1);

  if (packingReadError) {
    return { error: `Could not check linked packing rows: ${packingReadError.message}` };
  }

  if ((linkedPackingRows ?? []).length > 0) {
    return { error: "Cannot undo this grading session because it has already been used in packing." };
  }

  const { error: deleteError } = await db
    .from("grading_sessions")
    .delete()
    .eq("id", gradingSession.id)
    .eq("company_id", demoSession.company.id);

  if (deleteError) {
    return { error: `Could not undo grading session: ${deleteError.message}` };
  }

  revalidatePath("/processing");
  revalidatePath("/purchases");
  revalidatePath("/reports");
  return { deleted: true };
}

async function undoPackingSession(db: any, packingSessionId: string) {
  const { data: packingSession, error: packingReadError } = await db
    .from("packing_sessions")
    .select("id,seed_lot_id,no_of_bags,lot_no,variety")
    .eq("id", packingSessionId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (packingReadError) {
    return { error: `Could not read packing session: ${packingReadError.message}` };
  }

  if (packingSession.seed_lot_id) {
    const { data: invoiceItems, error: invoiceReadError } = await db
      .from("invoice_items")
      .select("id")
      .eq("company_id", demoSession.company.id)
      .eq("seed_lot_id", packingSession.seed_lot_id)
      .limit(1);

    if (invoiceReadError) {
      return { error: `Could not check invoice usage: ${invoiceReadError.message}` };
    }

    if ((invoiceItems ?? []).length > 0) {
      return { error: "Cannot undo this packing session because the packed lot has already been used in an invoice." };
    }

    const { data: stockAdjustments, error: adjustmentReadError } = await db
      .from("stock_adjustments")
      .select("id")
      .eq("company_id", demoSession.company.id)
      .eq("seed_lot_id", packingSession.seed_lot_id)
      .limit(1);

    if (adjustmentReadError) {
      return { error: `Could not check stock adjustments: ${adjustmentReadError.message}` };
    }

    if ((stockAdjustments ?? []).length > 0) {
      return { error: "Cannot undo this packing session because the packed lot has stock adjustments." };
    }

    const { data: lot, error: lotReadError } = await db
      .from("seed_lots")
      .select("current_bags,opening_bags")
      .eq("id", packingSession.seed_lot_id)
      .eq("company_id", demoSession.company.id)
      .single();

    if (lotReadError) {
      return { error: `Could not read packed inventory lot: ${lotReadError.message}` };
    }

    const bags = Number(packingSession.no_of_bags ?? 0);
    const currentBags = Number(lot.current_bags ?? 0);
    const openingBags = Number(lot.opening_bags ?? 0);

    if (bags > currentBags) {
      return { error: "Cannot undo this packing session because some packed stock has already been consumed." };
    }

    const nextCurrentBags = currentBags - bags;
    const nextOpeningBags = Math.max(openingBags - bags, 0);

    const { error: lotUpdateError } = await db
      .from("seed_lots")
      .update({
        current_bags: nextCurrentBags,
        opening_bags: nextOpeningBags
      })
      .eq("id", packingSession.seed_lot_id)
      .eq("company_id", demoSession.company.id);

    if (lotUpdateError) {
      return { error: `Could not reverse packed inventory: ${lotUpdateError.message}` };
    }
  }

  const { error: deleteError } = await db
    .from("packing_sessions")
    .delete()
    .eq("id", packingSession.id)
    .eq("company_id", demoSession.company.id);

  if (deleteError) {
    return { error: `Could not undo packing session: ${deleteError.message}` };
  }

  return { undone: "Packing", label: `${packingSession.variety ?? "Packing"} ${packingSession.lot_no ?? ""}`.trim() };
}

async function undoInwardSlip(db: any, inwardSlipId: string) {
  const { data: inward, error: inwardReadError } = await db
    .from("inward_slips")
    .select("id,purchase_id,seed_lot_id,bags,slip_no")
    .eq("id", inwardSlipId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (inwardReadError) {
    return { error: `Could not read inward slip: ${inwardReadError.message}` };
  }

  const [{ data: gradingRows, error: gradingReadError }, { data: packingRows, error: packingReadError }] = await Promise.all([
    db
      .from("grading_sessions")
      .select("id")
      .eq("company_id", demoSession.company.id)
      .eq("inward_slip_id", inward.id)
      .limit(1),
    db
      .from("packing_sessions")
      .select("id")
      .eq("company_id", demoSession.company.id)
      .eq("inward_slip_id", inward.id)
      .limit(1)
  ]);

  if (gradingReadError) {
    return { error: `Could not check grading usage: ${gradingReadError.message}` };
  }

  if (packingReadError) {
    return { error: `Could not check packing usage: ${packingReadError.message}` };
  }

  if ((gradingRows ?? []).length > 0 || (packingRows ?? []).length > 0) {
    return { error: "Cannot undo this inward slip because it has already moved to grading or packing." };
  }

  if (inward.purchase_id && inward.seed_lot_id) {
    const { data: item, error: itemReadError } = await db
      .from("purchase_items")
      .select("id,bags")
      .eq("purchase_id", inward.purchase_id)
      .eq("seed_lot_id", inward.seed_lot_id)
      .eq("company_id", demoSession.company.id)
      .maybeSingle();

    if (itemReadError) {
      return { error: `Could not read linked purchase item: ${itemReadError.message}` };
    }

    if (item) {
      const { data: lot, error: lotReadError } = await db
        .from("seed_lots")
        .select("current_bags,opening_bags")
        .eq("id", inward.seed_lot_id)
        .eq("company_id", demoSession.company.id)
        .single();

      if (lotReadError) {
        return { error: `Could not read linked stock: ${lotReadError.message}` };
      }

      const bags = Number(item.bags ?? inward.bags ?? 0);
      const currentBags = Number(lot.current_bags ?? 0);
      const openingBags = Number(lot.opening_bags ?? 0);

      if (bags > currentBags) {
        return { error: "Cannot undo this inward slip because linked stock has already been consumed." };
      }

      const { error: lotUpdateError } = await db
        .from("seed_lots")
        .update({
          current_bags: currentBags - bags,
          opening_bags: Math.max(openingBags - bags, 0)
        })
        .eq("id", inward.seed_lot_id)
        .eq("company_id", demoSession.company.id);

      if (lotUpdateError) {
        return { error: `Could not reverse linked stock: ${lotUpdateError.message}` };
      }

      const { error: itemDeleteError } = await db
        .from("purchase_items")
        .delete()
        .eq("id", item.id)
        .eq("company_id", demoSession.company.id);

      if (itemDeleteError) {
        return { error: `Stock reversed, but purchase item delete failed: ${itemDeleteError.message}` };
      }
    }

    await db
      .from("purchases")
      .delete()
      .eq("id", inward.purchase_id)
      .eq("company_id", demoSession.company.id);
  }

  const { error: inwardDeleteError } = await db
    .from("inward_slips")
    .delete()
    .eq("id", inward.id)
    .eq("company_id", demoSession.company.id);

  if (inwardDeleteError) {
    return { error: `Could not undo inward slip: ${inwardDeleteError.message}` };
  }

  if (inward.seed_lot_id) {
    await db
      .from("seed_lots")
      .delete()
      .eq("id", inward.seed_lot_id)
      .eq("company_id", demoSession.company.id)
      .eq("current_bags", 0);
  }

  return { undone: "Inward", label: `SLIP-${inward.slip_no}` };
}

export async function undoLastProcessingAction() {
  const db = createServerAnonSupabaseClient() as any;
  const [{ data: inwardRows, error: inwardError }, { data: gradingRows, error: gradingError }, { data: packingRows, error: packingError }] =
    await Promise.all([
      db
        .from("inward_slips")
        .select("id,created_at,slip_no")
        .eq("company_id", demoSession.company.id)
        .order("created_at", { ascending: false })
        .limit(1),
      db
        .from("grading_sessions")
        .select("id,created_at,variety")
        .eq("company_id", demoSession.company.id)
        .order("created_at", { ascending: false })
        .limit(1),
      db
        .from("packing_sessions")
        .select("id,created_at,variety,lot_no")
        .eq("company_id", demoSession.company.id)
        .order("created_at", { ascending: false })
        .limit(1)
    ]);

  if (inwardError) {
    return { error: `Could not read latest inward action: ${inwardError.message}` };
  }

  if (gradingError) {
    return { error: `Could not read latest grading action: ${gradingError.message}` };
  }

  if (packingError) {
    return { error: `Could not read latest packing action: ${packingError.message}` };
  }

  const latestActions = [
    (inwardRows ?? [])[0] ? { kind: "Inward", row: (inwardRows ?? [])[0] } : null,
    (gradingRows ?? [])[0] ? { kind: "Grading", row: (gradingRows ?? [])[0] } : null,
    (packingRows ?? [])[0] ? { kind: "Packing", row: (packingRows ?? [])[0] } : null
  ]
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());

  const latestAction = latestActions[0] as { kind: "Inward" | "Grading" | "Packing"; row: any } | undefined;

  if (!latestAction) {
    return { error: "There is no processing action to undo." };
  }

  let result:
    | { error: string }
    | { undone: string; label: string }
    | { deleted: boolean };

  if (latestAction.kind === "Packing") {
    result = await undoPackingSession(db, latestAction.row.id);
  } else if (latestAction.kind === "Grading") {
    result = await deleteGradingSession(latestAction.row.id);
    if (!("error" in result)) {
      result = { undone: "Grading", label: latestAction.row.variety ?? "Grading session" };
    }
  } else {
    result = await undoInwardSlip(db, latestAction.row.id);
  }

  if ("error" in result) {
    return result;
  }

  revalidatePath("/");
  revalidatePath("/processing");
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/invoices");
  revalidatePath("/ledger");
  revalidatePath("/reports");

  return result;
}

export async function savePackingSession(input: SavePackingSessionInput) {
  const gradingSessionId = input.gradingSessionId.trim();
  const supplierName = input.supplierName.trim();
  const variety = input.variety.trim();
  const lotNo = input.lotNo.trim();
  const seedType = input.seedType === "TL" ? "TL" : "VS";

  if (!input.packingDate || !gradingSessionId || !supplierName || !variety || !lotNo) {
    return { error: "Date, Grading session, Supplier Name, Variety, and Lot No are required." };
  }

  const gradedInput = numberValue(input.gradedInput);
  const packedQuantityBefore = numberValue(input.packedQuantityBefore);
  const remainingQuantity = gradedInput - packedQuantityBefore;
  const noOfBags = numberValue(input.noOfBags);
  const packingBagSize = numberValue(input.packingBagSize);
  const packingQuantity = qtlFromBags(noOfBags, packingBagSize);
  const totalPacked = packingQuantity + numberValue(input.packingLoose) + numberValue(input.ghamsi);
  const difference = remainingQuantity - totalPacked;
  const db = createServerAnonSupabaseClient() as any;

  if (noOfBags < 0 || packingBagSize < 0 || numberValue(input.packingLoose) < 0 || numberValue(input.ghamsi) < 0 || totalPacked <= 0) {
    return { error: "Packing quantity must be greater than zero and cannot contain negative values." };
  }

  if (totalPacked > remainingQuantity + 0.0001) {
    return {
      error: `Cannot save packing. Total packed quantity ${totalPacked.toFixed(2)} qtl exceeds available graded quantity ${remainingQuantity.toFixed(2)} qtl.`
    };
  }

  const { data: gradingSession, error: gradingReadError } = await db
    .from("grading_sessions")
    .select("id,inward_slip_id")
    .eq("id", gradingSessionId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (gradingReadError) {
    return { error: `Could not read grading session: ${gradingReadError.message}` };
  }

  const inwardSlipId = gradingSession.inward_slip_id;

  const { data: existingProduct, error: productReadError } = await db
    .from("products")
    .select("id,default_rate")
    .eq("company_id", demoSession.company.id)
    .eq("display_name", variety)
    .maybeSingle();

  if (productReadError) {
    return { error: `Could not check product: ${productReadError.message}` };
  }

  let productId = existingProduct?.id;
  const rate = numberValue(input.rate) || Number(existingProduct?.default_rate ?? 0);

  if (!productId) {
    const { data: product, error: productError } = await db
      .from("products")
      .insert({
        company_id: demoSession.company.id,
        crop: "Wheat",
        default_packing_kg: packingBagSize,
        default_rate: rate,
        display_name: variety,
        variety_name: variety
      })
      .select("id")
      .single();

    if (productError) {
      return { error: `Could not save product: ${productError.message}` };
    }

    productId = product.id;
  }

  const { data: existingLot, error: lotReadError } = await db
    .from("seed_lots")
    .select("id,opening_bags,current_bags")
    .eq("company_id", demoSession.company.id)
    .eq("product_id", productId)
    .eq("lot_number", lotNo)
    .eq("packing_kg", packingBagSize)
    .maybeSingle();

  if (lotReadError) {
    return { error: `Could not check packed stock lot: ${lotReadError.message}` };
  }

  let seedLotId = existingLot?.id;

  if (seedLotId) {
    const { error: lotUpdateError } = await db
      .from("seed_lots")
      .update({
        current_bags: Number(existingLot.current_bags ?? 0) + noOfBags,
        grading_session_id: gradingSessionId,
        opening_bags: Number(existingLot.opening_bags ?? 0) + noOfBags,
        inward_slip_id: inwardSlipId,
        packing_session_id: null,
        rate,
        seed_class: seedType,
        source_state: "PACKED"
      })
      .eq("id", seedLotId);

    if (lotUpdateError) {
      return { error: `Could not update packed inventory lot: ${lotUpdateError.message}` };
    }
  } else {
    const { data: lot, error: lotError } = await db
      .from("seed_lots")
      .insert({
        company_id: demoSession.company.id,
        current_bags: noOfBags,
        grading_session_id: gradingSessionId,
        hold_bags: 0,
        inward_slip_id: inwardSlipId,
        lot_number: lotNo,
        opening_bags: noOfBags,
        packing_kg: packingBagSize,
        packing_session_id: null,
        product_id: productId,
        rate,
        received_at: input.packingDate,
        seed_class: seedType,
        source_state: "PACKED"
      })
      .select("id")
      .single();

    if (lotError) {
      return { error: `Could not save packed inventory lot: ${lotError.message}` };
    }

    seedLotId = lot.id;
  }

  const { data, error } = await db
    .from("packing_sessions")
    .insert({
      company_id: demoSession.company.id,
      difference,
      germination: input.germination,
      ghamsi: numberValue(input.ghamsi),
      graded_input: gradedInput,
      grading_session_id: gradingSessionId,
      inward_slip_id: inwardSlipId,
      location: input.location.trim() || null,
      lot_no: lotNo,
      moisture: input.moisture,
      no_of_bags: noOfBags,
      packed_quantity_before: packedQuantityBefore,
      packing_bag_size: packingBagSize,
      packing_date: input.packingDate,
      packing_loose: numberValue(input.packingLoose),
      packing_quantity: packingQuantity,
      rate,
      remaining_quantity: remainingQuantity,
      remark: input.remark.trim() || null,
      seed_lot_id: seedLotId,
      seed_type: seedType,
      supplier_name: supplierName,
      total_packed: totalPacked,
      variety
    })
    .select("id")
    .single();

  if (error) {
    return { error: `Could not save packing session: ${error.message}` };
  }

  const { error: lotLinkError } = await db
    .from("seed_lots")
    .update({ packing_session_id: data.id })
    .eq("id", seedLotId)
    .eq("company_id", demoSession.company.id);

  if (lotLinkError) {
    return { error: `Packing saved, but inventory lineage update failed: ${lotLinkError.message}` };
  }

  revalidatePath("/processing");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/reports");
  revalidatePath("/");
  return { id: data.id };
}
