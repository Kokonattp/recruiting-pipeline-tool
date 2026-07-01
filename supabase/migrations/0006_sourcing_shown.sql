-- Tracks every candidate ever SURFACED by a sourcing search, not just the ones HR
-- approved into `candidates`. Without this, re-running the same/similar JD search
-- keeps showing the exact same people, because GitHub/web search are deterministic
-- for a given query and the existing dedup only pre-seeds from approved candidates.
--
-- Best-effort table: the app inserts into this on every search round and pre-seeds
-- the in-request dedup Set from it, but wraps both in try/catch so a missing table
-- (e.g. before this migration is run) degrades to "no cross-run dedup" rather than
-- failing the search.

create table if not exists sourcing_shown (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  name text,
  shown_at timestamptz not null default now()
);

create index if not exists sourcing_shown_source_url_idx on sourcing_shown (source_url);
create index if not exists sourcing_shown_name_idx on sourcing_shown (name);

alter table sourcing_shown enable row level security;
-- Deliberately NO policies — same reasoning as 0003_enable_rls.sql: server uses
-- service_role (bypasses RLS), public anon/PostgREST API gets zero rows.
