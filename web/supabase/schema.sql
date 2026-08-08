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
