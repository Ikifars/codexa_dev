create table if not exists public.xp_action_settings (
  action_key text primary key,
  label text not null,
  xp_amount integer not null default 0 check (xp_amount >= 0 and xp_amount <= 10000),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.xp_action_settings (action_key, label, xp_amount)
values ('resolve_ticket', 'Resolver chamados', 50), ('complete_task', 'Concluir tarefas', 30), ('deliver_project', 'Entregar projetos', 150), ('close_sale', 'Fechar vendas', 200)
on conflict (action_key) do nothing;

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.team_members(id) on delete cascade,
  action_key text not null references public.xp_action_settings(action_key),
  entity_type text not null,
  entity_id uuid,
  xp_amount integer not null check (xp_amount > 0),
  created_at timestamptz not null default now(),
  unique (member_id, action_key, entity_type, entity_id)
);

alter table public.xp_action_settings enable row level security;
alter table public.xp_events enable row level security;
revoke all on public.xp_action_settings, public.xp_events from anon, authenticated;
alter table public.team_members add column if not exists xp integer not null default 0 check (xp >= 0);
alter table public.team_members add column if not exists level integer not null default 1 check (level >= 1);

create or replace function public.award_xp(p_member_id uuid, p_action_key text, p_entity_type text, p_entity_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_amount integer; v_inserted boolean := false; v_xp integer;
begin
  select xp_amount into v_amount from public.xp_action_settings where action_key = p_action_key and is_active;
  if coalesce(v_amount, 0) <= 0 then return 0; end if;
  insert into public.xp_events(member_id, action_key, entity_type, entity_id, xp_amount) values (p_member_id, p_action_key, p_entity_type, p_entity_id, v_amount) on conflict do nothing;
  v_inserted := found;
  if v_inserted then
    update public.team_members set xp = coalesce(xp, 0) + v_amount, level = greatest(1, floor(sqrt((coalesce(xp, 0) + v_amount) / 100.0))::integer + 1) where id = p_member_id returning xp into v_xp;
    return v_amount;
  end if;
  return 0;
end; $$;
revoke all on function public.award_xp(uuid, text, text, uuid) from public;
grant execute on function public.award_xp(uuid, text, text, uuid) to service_role;
