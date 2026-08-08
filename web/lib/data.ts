import "server-only";
import { getSupabase } from "./supabase";
import type {
  ActivityLogEntry,
  CeoRequest,
  ContentIdea,
  OfficeDept,
  OfficeProfile,
} from "./types";

export const EDITORIAL_GUIDELINES_KEY = "editorial_guidelines";

export async function listRequests(): Promise<CeoRequest[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listIdeas(): Promise<ContentIdea[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getIdea(id: string): Promise<ContentIdea | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("content_ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listActivityLog(limit = 12): Promise<ActivityLogEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const DEFAULT_OFFICE_NAMES: Record<OfficeDept, string> = {
  cmo: "CMO",
  cfo: "CFO",
  ceo: "社長",
  secretary: "秘書",
};

export async function getOfficeNames(): Promise<Record<OfficeDept, string>> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("office_profiles").select("*");
  if (error) throw new Error(error.message);

  const names = { ...DEFAULT_OFFICE_NAMES };
  for (const row of (data ?? []) as OfficeProfile[]) {
    names[row.dept] = row.display_name;
  }
  return names;
}

export async function getSetting(key: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}
