-- AI-CEO dashboard schema
-- Run this once in the Supabase project's SQL Editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'done', 'failed')),
  result text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  market_notes text,
  body text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table requests enable row level security;
alter table content_ideas enable row level security;

-- This is a private single-operator tool (no public sign-up), and access to the
-- dashboard itself is gated by a shared passphrase at the app layer. The anon
-- key is scoped to select/insert/update only (no delete) as defense in depth.

create policy "anon can read requests" on requests for select using (true);
create policy "anon can insert requests" on requests for insert with check (true);
create policy "anon can update requests" on requests for update using (true);

create policy "anon can read content_ideas" on content_ideas for select using (true);
create policy "anon can insert content_ideas" on content_ideas for insert with check (true);
create policy "anon can update content_ideas" on content_ideas for update using (true);

-- Display names for the virtual office avatars (CMO / CFO / CEO / secretary).
create table if not exists office_profiles (
  dept text primary key check (dept in ('cmo', 'cfo', 'ceo', 'secretary')),
  display_name text not null,
  updated_at timestamptz not null default now()
);

alter table office_profiles enable row level security;

create policy "anon can read office_profiles" on office_profiles for select using (true);
create policy "anon can insert office_profiles" on office_profiles for insert with check (true);
create policy "anon can update office_profiles" on office_profiles for update using (true);

insert into office_profiles (dept, display_name) values
  ('cmo', 'CMO'), ('cfo', 'CFO'), ('ceo', '社長'), ('secretary', '秘書')
on conflict (dept) do nothing;

-- Migration: run this block if office_profiles already exists from an earlier
-- version of this schema (adds the 'secretary' dept).
alter table office_profiles drop constraint if exists office_profiles_dept_check;
alter table office_profiles add constraint office_profiles_dept_check
  check (dept in ('cmo', 'cfo', 'ceo', 'secretary'));
insert into office_profiles (dept, display_name) values ('secretary', '秘書')
on conflict (dept) do nothing;

-- Timeline of what the AI actually did on each run (market research steps,
-- drafting notes, etc.) so the CEO can see more than just "in_progress".
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null check (actor in ('orchestrator', 'cmo', 'cfo', 'secretary')),
  message text not null,
  request_id uuid references requests(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

create policy "anon can read activity_log" on activity_log for select using (true);
create policy "anon can insert activity_log" on activity_log for insert with check (true);

-- Free-form key/value settings, editable from the office page. Used first for
-- the editorial guidelines that content-writing sub-agents must follow.
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;

create policy "anon can read settings" on settings for select using (true);
create policy "anon can insert settings" on settings for insert with check (true);
create policy "anon can update settings" on settings for update using (true);

insert into settings (key, value) values (
  'editorial_guidelines',
  '1. 無料部分は「読者を強く惹きつける導入」にする。要約で終わらせず、続きが気になる具体的な書き出し・数字・実例を冒頭に置く。
2. テーマ選定は「ネット上にまとまった情報が少ない/検索しても断片的にしか出てこない」ものを優先する。すでに他の記事で書き尽くされているテーマは避ける。
3. 有料部分には「他では読めない実務的な価値」を厚く含める。手順・テンプレート・実例・具体的な数値など。無料部分の続きを薄く引き伸ばすだけの水増しは禁止。
4. 内容に関連する画像を、無料・有料それぞれに最低1枚程度入れる。出典・ライセンスが明確なもの(Unsplash/Pexels/Wikimedia Commons等の再配布可能な画像)に限る。'
) on conflict (key) do nothing;

-- Alternates which content type the periodic auto-generation (routine step 3)
-- produces next: 'general' (a normal note article per editorial_guidelines)
-- or 'ai_papers' (a roundup of recent AI research papers). The orchestrator
-- flips this after each auto-generated idea.
insert into settings (key, value) values (
  'next_content_type', 'general'
) on conflict (key) do nothing;

-- Thumbnail image (generated only once CEO approves an idea — see decideIdea
-- in web/app/actions.ts), stored in the "thumbnails" Storage bucket below.
alter table content_ideas add column if not exists thumbnail_url text;

-- Public bucket for generated thumbnails. Images are non-sensitive marketing
-- assets, so public read is fine; writes still require the anon key used by
-- this app's server-side code.
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy "anon can read thumbnails" on storage.objects
  for select using (bucket_id = 'thumbnails');
create policy "anon can upload thumbnails" on storage.objects
  for insert with check (bucket_id = 'thumbnails');
create policy "anon can update thumbnails" on storage.objects
  for update using (bucket_id = 'thumbnails');
