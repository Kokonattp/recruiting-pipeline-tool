-- Add the recommendation band + confidence signal to screening results.
--
-- Why: a single 0-100/0-10 score is a fragile gate (the same CV can score very
-- differently across runs). We now also store a coarse recommendation band (a sort
-- hint, not an auto-gate) and how confident the model was given the CV's detail.
-- See src/modules/screener/types.ts and AI_LOG.md.
--
-- Idempotent: only adds the columns if missing. Defaults keep old rows valid.

alter table screening_results
  add column if not exists confidence text not null default 'MEDIUM'
    check (confidence in ('HIGH', 'MEDIUM', 'LOW'));

alter table screening_results
  add column if not exists recommendation text not null default 'CONSIDER'
    check (recommendation in ('STRONG', 'CONSIDER', 'WEAK'));
