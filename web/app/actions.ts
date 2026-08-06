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

export async function decideIdea(formData: FormData) {
  if (!(await hasValidSession())) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

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
  redirect("/ideas");
}
