-- Allow anonymous suggestions with contact info; authenticated users may omit contact columns.

alter table public.suggestions
  alter column submitted_by drop not null;

alter table public.suggestions
  add column if not exists submitter_name text,
  add column if not exists submitter_email text;

alter table public.suggestions
  drop constraint if exists suggestions_submitter_check;

alter table public.suggestions
  add constraint suggestions_submitter_check
  check (
    submitted_by is not null
    or (submitter_name is not null and submitter_email is not null)
  );
