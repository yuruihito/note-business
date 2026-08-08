"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSession,
  destroySession,
  hasValidSession,
  checkPassword,
} from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export type FormState = { error?: string } | undefined;

export async function login(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!password || !checkPassword(password)) {
    return { error: "パスワードが違います" };
  }
  await createSession();
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function submitRequest(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await hasValidSession())) redirect("/login");

  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { error: "内容を入力してください" };
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("requests").insert({ text });
  if (error) {
    return { error: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/requests");
  revalidatePath("/");
  redirect("/requests");
}

export type OfficeRequestState = { error?: string; ok?: boolean } | undefined;

export async function submitOfficeRequest(
  _prevState: OfficeRequestState,
  formData: FormData
): Promise<OfficeRequestState> {
  if (!(await hasValidSession())) redirect("/login");

  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { error: "内容を入力してください" };
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("requests").insert({ text });
  if (error) {
    return { error: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/requests");
  revalidatePath("/");
  revalidatePath("/office");
  return { ok: true };
}

export async function updateOfficeNames(
  _prevState: OfficeRequestState,
  formData: FormData
): Promise<OfficeRequestState> {
  if (!(await hasValidSession())) redirect("/login");

  const supabase = getSupabase();
  const depts = ["cmo", "cfo", "ceo", "secretary"] as const;

  for (const dept of depts) {
    const name = String(formData.get(dept) ?? "").trim();
    if (!name) continue;

    const { error } = await supabase.from("office_profiles").upsert(
      { dept, display_name: name, updated_at: new Date().toISOString() },
      { onConflict: "dept" }
    );
    if (error) return { error: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/office");
  return { ok: true };
}

export async function decideIdea(formData: FormData) {
  if (!(await hasValidSession())) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const returnTo = String(formData.get("returnTo") ?? "/ideas");

  if (!id || (decision !== "approved" && decision !== "rejected")) {
    throw new Error("invalid decision payload");
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("content_ideas")
    .update({
      status: decision,
      decision_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/");
  revalidatePath("/office");
  redirect(returnTo);
}
