alter table public.profile_badges add column if not exists is_temporary boolean not null default false;
alter table public.profile_badges add column if not exists duration_days integer;
alter table public.profile_badges add column if not exists expires_at timestamptz;
alter table public.profile_badges add column if not exists assignment_expires_at timestamptz;
alter table public.profile_badges add column if not exists source_badge_id uuid references public.profile_badges(id) on delete set null;
alter table public.profile_badges drop constraint if exists profile_badges_duration_days_check;
alter table public.profile_badges add constraint profile_badges_duration_days_check check (duration_days is null or duration_days between 1 and 3650);
create index if not exists profile_badges_source_idx on public.profile_badges(source_badge_id);
create index if not exists profile_badges_active_member_idx on public.profile_badges(member_id, expires_at);
