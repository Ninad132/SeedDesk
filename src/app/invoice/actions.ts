"use server";

import { revalidatePath } from "next/cache";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

type SaveInvoiceItem = {
  amount: number;
  bags: number;
  itemName: string;
  packingKg: number;
  quantity: number;
  rate: number;
  seedLotId: string;
};

export type SaveInvoiceInput = {
  cardPay: number;
  cashTaken: number;
  customer: {
    customerName: string;
    customerId: string | null;
    mobileNo: string;
    remark: string;
    village: string;
  };
  discountAmount: number;
  dueAmount: number;
  grandTotal: number;
  invoiceDate: string;
  invoiceNumber: number;
  invoicePrefix: string;
  items: SaveInvoiceItem[];
  paidAmount: number;
  subtotal: number;
};

export async function saveInvoice(input: SaveInvoiceInput) {
  if (input.items.length === 0) {
    return { error: "Add at least one item before saving." };
  }

  const supabase = createServerAnonSupabaseClient();
  const db = supabase as any;
  let customerId = input.customer.customerId;

  if (!customerId) {
    const { data: customer, error } = await db
      .from("customers")
      .insert({
        company_id: demoSession.company.id,
        mobile: input.customer.mobileNo || null,
        name: input.customer.customerName,
        notes: input.customer.remark || null,
        village: input.customer.village || null
      })
      .select("id")
      .single();

    if (error) {
      return { error: `Could not save customer: ${error.message}` };
    }

    customerId = customer.id;
  }

  const { data: invoice, error: invoiceError } = await db
    .from("invoices")
    .insert({
      company_id: demoSession.company.id,
      customer_id: customerId,
      customer_name: input.customer.customerName,
      discount_amount: input.discountAmount,
      due_amount: input.dueAmount,
      grand_total: input.grandTotal,
      invoice_date: input.invoiceDate,
      invoice_number: input.invoiceNumber,
      invoice_prefix: input.invoicePrefix,
      mobile: input.customer.mobileNo || null,
      notes: input.customer.remark || null,
      paid_amount: input.paidAmount,
      status: "final",
      subtotal: input.subtotal,
      village: input.customer.village || null
    })
    .select("id")
    .single();

  if (invoiceError) {
    return { error: `Could not save invoice: ${invoiceError.message}` };
  }

  const { error: itemError } = await db.from("invoice_items").insert(
    input.items.map((item) => ({
      bags: item.bags,
      company_id: demoSession.company.id,
      invoice_id: invoice.id,
      item_name: item.itemName,
      packing_kg: item.packingKg,
      rate: item.rate,
      seed_lot_id: item.seedLotId
    }))
  );

  if (itemError) {
    return { error: `Could not save invoice items: ${itemError.message}` };
  }

  for (const item of input.items) {
    const { data: lot, error: lotError } = await db
      .from("seed_lots")
      .select("current_bags")
      .eq("id", item.seedLotId)
      .single();

    if (lotError) {
      return { error: `Could not read stock for ${item.itemName}: ${lotError.message}` };
    }

    const nextBags = Number(lot.current_bags ?? 0) - item.bags;
    const { error: stockError } = await db
      .from("seed_lots")
      .update({ current_bags: nextBags })
      .eq("id", item.seedLotId);

    if (stockError) {
      return { error: `Could not update stock for ${item.itemName}: ${stockError.message}` };
    }
  }

  const payments = [
    input.cardPay > 0
      ? {
          amount: input.cardPay,
          company_id: demoSession.company.id,
          customer_id: customerId,
          invoice_id: invoice.id,
          mode: "card" as const,
          payment_date: input.invoiceDate
        }
      : null,
    input.cashTaken > 0
      ? {
          amount: input.cashTaken,
          company_id: demoSession.company.id,
          customer_id: customerId,
          invoice_id: invoice.id,
          mode: "cash" as const,
          payment_date: input.invoiceDate
        }
      : null
  ].filter(Boolean);

  if (payments.length > 0) {
    const { error: paymentError } = await db.from("payments").insert(payments);

    if (paymentError) {
      return { error: `Could not save payments: ${paymentError.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/invoice");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  revalidatePath("/ledger");
  revalidatePath("/invoices");

  return { invoiceId: invoice.id };
}
