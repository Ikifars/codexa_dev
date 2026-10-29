create table if not exists public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.team_members(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  color text not null default 'cyan' check (color in ('cyan','violet','amber','emerald','rose')),
  granted_by uuid references public.team_members(id) on delete set null,
  granted_at timestamptz not null default now()
);
create index if not exists profile_badges_member_idx on public.profile_badges(member_id, granted_at desc);
alter table public.profile_badges enable row level security;
revoke all on public.profile_badges from anon, authenticated;
