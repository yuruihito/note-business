import "server-only";
import { getSupabase } from "./supabase";
import type { CeoRequest, ContentIdea } from "./types";

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
