import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY is not set. Copy .env.example to .env.local and fill it in."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
