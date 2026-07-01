-- Add per-axis sub-attribute breakdown (FM-style "attributes") to screening results.
--
-- Why: the 3 axis scores (skills/exp/culture) explain WHAT the fit is but not WHY a
-- candidate landed at e.g. 9 rather than 7. Each axis now also carries 3 named
-- sub-attributes (0-10 each), scored independently of the axis total — they explain
-- the number, they don't derive it. See src/modules/screener/types.ts and AI_LOG.md.
--
-- Idempotent: only adds the column if missing. Default '{}' keeps old rows valid
-- (older screenings simply render with no sub-attribute breakdown).

alter table screening_results
  add column if not exists sub_attributes jsonb not null default '{}';
