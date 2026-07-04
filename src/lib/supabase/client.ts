import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

function normalizeSupabaseUrl(value: string) {
  return new URL(value.replace(/^['"]|['"]$/g, "")).origin;
}

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient<Database>(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey);
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
