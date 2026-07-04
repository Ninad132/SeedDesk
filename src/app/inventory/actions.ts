"use server";

import { revalidatePath } from "next/cache";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

export type StockAdjustmentType = "add" | "remove" | "hold" | "release";

export type SaveStockAdjustmentInput = {
  adjustmentDate: string;
  adjustmentType: StockAdjustmentType;
  bags: number;
  notes: string;
  reason: string;
  seedLotId: string;
};

export async function saveStockAdjustment(input: SaveStockAdjustmentInput) {
  const bags = Number(input.bags) || 0;
  const reason = input.reason.trim();

  if (!input.seedLotId || !input.adjustmentDate || !input.adjustmentType || bags <= 0 || !reason) {
    return { error: "Lot, adjustment type, bags, date, and reason are required." };
  }

  const supabase = createServerAnonSupabaseClient();
  const db = supabase as any;

  const { data: lot, error: lotError } = await db
    .from("seed_lots")
    .select("current_bags,hold_bags")
    .eq("id", input.seedLotId)
    .eq("company_id", demoSession.company.id)
    .single();

  if (lotError) {
    return { error: `Could not read stock: ${lotError.message}` };
  }

  const currentBags = Number(lot.current_bags ?? 0);
  const holdBags = Number(lot.hold_bags ?? 0);
  let nextCurrentBags = currentBags;
  let nextHoldBags = holdBags;

  if (input.adjustmentType === "add") {
    nextCurrentBags = currentBags + bags;
  }

  if (input.adjustmentType === "remove") {
    if (bags > currentBags - holdBags) {
      return { error: "Cannot remove more than available stock." };
    }
    nextCurrentBags = currentBags - bags;
  }

  if (input.adjustmentType === "hold") {
    if (bags > currentBags - holdBags) {
      return { error: "Cannot hold more than available stock." };
    }
    nextHoldBags = holdBags + bags;
  }

  if (input.adjustmentType === "release") {
    if (bags > holdBags) {
      return { error: "Cannot release more than HOLD stock." };
    }
    nextHoldBags = holdBags - bags;
  }

  const { error: stockError } = await db
    .from("seed_lots")
    .update({
      current_bags: nextCurrentBags,
      hold_bags: nextHoldBags
    })
    .eq("id", input.seedLotId);

  if (stockError) {
    return { error: `Could not update stock: ${stockError.message}` };
  }

  const { data: adjustment, error: adjustmentError } = await db
    .from("stock_adjustments")
    .insert({
      adjustment_date: input.adjustmentDate,
      adjustment_type: input.adjustmentType,
      bags,
      company_id: demoSession.company.id,
      notes: input.notes.trim() || null,
      reason,
      seed_lot_id: input.seedLotId
    })
    .select("id")
    .single();

  if (adjustmentError) {
    return { error: `Stock changed, but adjustment log failed: ${adjustmentError.message}` };
  }

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/invoice");
  revalidatePath("/reports");

  return { adjustmentId: adjustment.id };
}
