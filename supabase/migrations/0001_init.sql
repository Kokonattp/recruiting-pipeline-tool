-- Recruiting Pipeline Tool — initial schema
-- รันใน Supabase: Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- (idempotent: รันซ้ำได้ ไม่พัง)

-- ── enums ─────────────────────────────────────────────────────────────
do $$ begin
  create type stage as enum
    ('APPLIED','SCREENING','PRESCREEN_CALL','FIRST_INTERVIEW','OFFER','HIRED','REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type source as enum
    ('LINKEDIN','JOBSDB','JOBBKK','JOBTHAI','FACEBOOK','WEB','REFERRAL','MANUAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('PENDING','APPROVED','REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scrape_status as enum ('RUNNING','COMPLETED','FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type interview_status as enum ('SCHEDULED','RESCHEDULED','CANCELLED','COMPLETED');
exception when duplicate_object then null; end $$;

-- ── tables ────────────────────────────────────────────────────────────
create table if not exists job_descriptions (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  department      text,
  seniority       text,
  raw_text        text not null,
  required_skills text[] not null default '{}',
  nice_to_have    text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists candidates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text,
  phone          text,
  source         source not null default 'MANUAL',
  source_url     text,
  headline       text,
  raw_profile    jsonb,
  normalized     jsonb,
  review_status  review_status not null default 'APPROVED',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists applications (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references candidates(id) on delete cascade,
  job_id        uuid not null references job_descriptions(id) on delete cascade,
  stage         stage not null default 'APPLIED',
  applied_at    timestamptz not null default now(),
  source_tag    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (candidate_id, job_id)
);
create index if not exists applications_stage_idx on applications(stage);

create table if not exists scrape_runs (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references job_descriptions(id) on delete cascade,
  query        text not null,
  source       source not null,
  status       scrape_status not null default 'RUNNING',
  found_count  int not null default 0,
  error        text,
  created_at   timestamptz not null default now()
);

create table if not exists screening_results (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null unique references applications(id) on delete cascade,
  skills_fit          int not null check (skills_fit between 0 and 10),
  exp_fit             int not null check (exp_fit between 0 and 10),
  culture_fit         int not null check (culture_fit between 0 and 10),
  reasoning           jsonb not null,
  strengths           text[] not null default '{}',
  prescreen_questions text[] not null default '{}',
  summary             text not null,
  model               text not null,
  created_at          timestamptz not null default now()
);

create table if not exists interviews (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  scheduled_at    timestamptz not null,
  duration_min    int not null default 30,
  google_event_id text,
  meet_link       text,
  status          interview_status not null default 'SCHEDULED',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists interviews_scheduled_idx on interviews(scheduled_at);

-- keep updated_at fresh
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['job_descriptions','candidates','applications','interviews'] loop
    execute format('drop trigger if exists trg_touch on %I', t);
    execute format('create trigger trg_touch before update on %I for each row execute function touch_updated_at()', t);
  end loop;
end $$;
