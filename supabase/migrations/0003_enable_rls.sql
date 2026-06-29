-- Lock down the public API surface.
--
-- This app NEVER queries Supabase with the anon key from the browser — every read
-- and write goes through server actions using the service_role key (see src/lib/
-- supabase.ts `supabaseAdmin`). service_role bypasses RLS, so enabling RLS with NO
-- policies means: the server keeps full access, while the public anon/PostgREST API
-- is denied on every table. Without this, anyone holding the (public) anon key could
-- hit the REST API directly and read or delete candidate data.
--
-- Idempotent: enabling RLS twice is a no-op.

alter table job_descriptions  enable row level security;
alter table candidates        enable row level security;
alter table applications      enable row level security;
alter table scrape_runs       enable row level security;
alter table screening_results enable row level security;
alter table interviews        enable row level security;

-- Deliberately NO policies: anon/authenticated get zero rows; service_role bypasses
-- RLS entirely. If a public client surface is added later, add explicit policies then.
