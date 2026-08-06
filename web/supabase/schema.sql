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
