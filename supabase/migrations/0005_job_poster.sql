-- Add poster_base64 column to job_descriptions
-- รันใน Supabase: Dashboard → SQL Editor → วางทั้งไฟล์ → Run
alter table job_descriptions
  add column if not exists poster_base64 text;
