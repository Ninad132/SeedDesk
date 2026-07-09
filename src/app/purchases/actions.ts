"use server";

import { revalidatePath } from "next/cache";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

export type SavePurchaseInput = {
  bags: number;
  column3: string;
  lotNo: string;
  purchaseDate: string;
  rate: number;
  seedType: "TL" | "VS";
  sourceState: string;
  supplierName: string;
  variety: string;
  weight: number;
};

export async function savePurchase(input: SavePurchaseInput) {
  const bags = Number(input.bags) || 0;
  const weight = Number(input.weight) || 0;
  const rate = Number(input.rate) || 0;
  const column3 = input.column3.trim();
  const lotNo = input.lotNo.trim();
  const seedType = input.seedType === "TL" ? "TL" : "VS";
  const variety = input.variety.trim() || [column3, lotNo].filter(Boolean).join(" ");

  if (!column3 || !lotNo || !variety || bags <= 0 || weight <= 0) {
    return { error: "Column3, Lot No, Variety, Bags, and Weight are required." };
  }

  const supabase = createServerAnonSupabaseClient();
  const db = supabase as any;

  const { data: existingProduct, error: productReadError } = await db
    .from("products")
    .select("id")
    .eq("company_id", demoSession.company.id)
    .eq("display_name", column3)
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
        crop: column3,
        default_packing_kg: weight,
        default_rate: rate,
        display_name: column3,
        variety_name: column3
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
    .eq("packing_kg", weight)
    .maybeSingle();

  if (lotReadError) {
    return { error: `Could not check lot: ${lotReadError.message}` };
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
        source_state: input.sourceState.trim() || null
      })
      .eq("id", seedLotId);

    if (lotUpdateError) {
      return { error: `Could not update lot stock: ${lotUpdateError.message}` };
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
        packing_kg: weight,
        product_id: productId,
        rate,
        received_at: input.purchaseDate,
        seed_class: seedType,
        source_state: input.sourceState.trim() || null
      })
      .select("id")
      .single();

    if (lotError) {
      return { error: `Could not save lot: ${lotError.message}` };
    }

    seedLotId = lot.id;
  }

  const { data: purchase, error: purchaseError } = await db
    .from("purchases")
    .insert({
      company_id: demoSession.company.id,
      purchase_date: input.purchaseDate,
      supplier_name: input.supplierName.trim() || null
    })
    .select("id")
    .single();

  if (purchaseError) {
    return { error: `Could not save purchase: ${purchaseError.message}` };
  }

  const { error: itemError } = await db.from("purchase_items").insert({
    bags,
    company_id: demoSession.company.id,
    packing_kg: weight,
    purchase_id: purchase.id,
    rate,
    seed_lot_id: seedLotId
  });

  if (itemError) {
    return { error: `Could not save purchase item: ${itemError.message}` };
  }

  revalidatePath("/");
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/reports");

  return { purchaseId: purchase.id };
}

export async function deletePurchaseItem(purchaseItemId: string) {
  if (!purchaseItemId) {
    return { error: "Purchase item is required." };
  }

  const supabase = createServerAnonSupabaseClient();
  const db = supabase as any;

  const { data: item, error: itemReadError } = await db
    .from("purchase_items")
    .select("id,purchase_id,seed_lot_id,bags")
    .eq("id", purchaseItemId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (itemReadError) {
    return { error: `Could not read purchase item: ${itemReadError.message}` };
  }

  const { data: lot, error: lotReadError } = await db
    .from("seed_lots")
    .select("current_bags,opening_bags")
    .eq("id", item.seed_lot_id)
    .eq("company_id", demoSession.company.id)
    .single();

  if (lotReadError) {
    return { error: `Could not read stock: ${lotReadError.message}` };
  }

  const bags = Number(item.bags ?? 0);
  const currentBags = Number(lot.current_bags ?? 0);
  const openingBags = Number(lot.opening_bags ?? 0);

  if (bags > currentBags) {
    return { error: "Cannot delete this purchase because some of this stock has already been sold or removed." };
  }

  const { error: stockError } = await db
    .from("seed_lots")
    .update({
      current_bags: currentBags - bags,
      opening_bags: Math.max(openingBags - bags, 0)
    })
    .eq("id", item.seed_lot_id);

  if (stockError) {
    return { error: `Could not reverse stock: ${stockError.message}` };
  }

  const { error: deleteItemError } = await db
    .from("purchase_items")
    .delete()
    .eq("id", item.id)
    .eq("company_id", demoSession.company.id);

  if (deleteItemError) {
    return { error: `Stock reversed, but purchase row delete failed: ${deleteItemError.message}` };
  }

  const { data: remainingItems, error: remainingError } = await db
    .from("purchase_items")
    .select("id")
    .eq("purchase_id", item.purchase_id)
    .limit(1);

  if (!remainingError && (!remainingItems || remainingItems.length === 0)) {
    await db
      .from("purchases")
      .delete()
      .eq("id", item.purchase_id)
      .eq("company_id", demoSession.company.id);
  }

  revalidatePath("/");
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/reports");

  return { deleted: true };
}

export async function deleteInwardSlip(inwardSlipId: string) {
  if (!inwardSlipId) {
    return { error: "Inward slip is required." };
  }

  const supabase = createServerAnonSupabaseClient();
  const db = supabase as any;

  const { data: inward, error: inwardReadError } = await db
    .from("inward_slips")
    .select("id,purchase_id,seed_lot_id,bags,material_name,supplier_name")
    .eq("id", inwardSlipId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (inwardReadError) {
    return { error: `Could not read inward slip: ${inwardReadError.message}` };
  }

  const { data: packingRows, error: packingReadError } = await db
    .from("packing_sessions")
    .select("id,seed_lot_id")
    .eq("company_id", demoSession.company.id)
    .eq("inward_slip_id", inward.id);

  if (packingReadError) {
    return { error: `Could not read linked packing rows: ${packingReadError.message}` };
  }

  const packedSeedLotIds = Array.from(
    new Set((packingRows ?? []).map((row: { seed_lot_id: string | null }) => row.seed_lot_id).filter(Boolean))
  ) as string[];
  const affectedSeedLotIds = Array.from(new Set([inward.seed_lot_id, ...packedSeedLotIds].filter(Boolean))) as string[];

  if (affectedSeedLotIds.length > 0) {
    const { data: invoiceItems, error: invoiceItemsReadError } = await db
      .from("invoice_items")
      .select("invoice_id")
      .eq("company_id", demoSession.company.id)
      .in("seed_lot_id", affectedSeedLotIds);

    if (invoiceItemsReadError) {
      return { error: `Could not read linked invoice rows: ${invoiceItemsReadError.message}` };
    }

    const invoiceIds = Array.from(
      new Set((invoiceItems ?? []).map((item: { invoice_id: string }) => item.invoice_id).filter(Boolean))
    ) as string[];

    if (invoiceIds.length > 0) {
      const { error: paymentDeleteError } = await db
        .from("payments")
        .delete()
        .eq("company_id", demoSession.company.id)
        .in("invoice_id", invoiceIds);

      if (paymentDeleteError) {
        return { error: `Could not delete linked invoice payments: ${paymentDeleteError.message}` };
      }

      const { error: itemDeleteError } = await db
        .from("invoice_items")
        .delete()
        .eq("company_id", demoSession.company.id)
        .in("invoice_id", invoiceIds);

      if (itemDeleteError) {
        return { error: `Could not delete linked invoice items: ${itemDeleteError.message}` };
      }

      const { error: invoiceDeleteError } = await db
        .from("invoices")
        .delete()
        .eq("company_id", demoSession.company.id)
        .in("id", invoiceIds);

      if (invoiceDeleteError) {
        return { error: `Could not delete linked invoices: ${invoiceDeleteError.message}` };
      }
    }

    const { error: adjustmentDeleteError } = await db
      .from("stock_adjustments")
      .delete()
      .eq("company_id", demoSession.company.id)
      .in("seed_lot_id", affectedSeedLotIds);

    if (adjustmentDeleteError) {
      return { error: `Could not delete linked stock adjustments: ${adjustmentDeleteError.message}` };
    }
  }

  const { error: packingDeleteError } = await db
    .from("packing_sessions")
    .delete()
    .eq("company_id", demoSession.company.id)
    .eq("inward_slip_id", inward.id);

  if (packingDeleteError) {
    return { error: `Could not delete linked packing rows: ${packingDeleteError.message}` };
  }

  const { error: gradingDeleteError } = await db
    .from("grading_sessions")
    .delete()
    .eq("company_id", demoSession.company.id)
    .eq("inward_slip_id", inward.id);

  if (gradingDeleteError) {
    return { error: `Could not delete linked grading rows: ${gradingDeleteError.message}` };
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
        return { error: "Cannot delete this inward slip because linked stock has already been consumed." };
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
        return { error: `Stock reversed, but linked purchase item delete failed: ${itemDeleteError.message}` };
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
    return { error: `Could not delete inward slip: ${inwardDeleteError.message}` };
  }

  if (affectedSeedLotIds.length > 0) {
    const { error: lotDeleteError } = await db
      .from("seed_lots")
      .delete()
      .eq("company_id", demoSession.company.id)
      .in("id", affectedSeedLotIds);

    if (lotDeleteError) {
      return { error: `Source rows deleted, but linked inventory delete failed: ${lotDeleteError.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/processing");
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/invoices");
  revalidatePath("/ledger");
  revalidatePath("/reports");

  return { deleted: true };
}
