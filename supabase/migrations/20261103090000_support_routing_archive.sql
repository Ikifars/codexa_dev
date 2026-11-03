alter table public.support_tickets
  add column if not exists archived_at timestamptz;

create index if not exists support_tickets_archived_at_idx
  on public.support_tickets (archived_at);

create or replace function public.assign_support_ticket_responsible(p_sector text)
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_role_name text;
  v_responsible_id uuid;
begin
  v_role_name := case p_sector
    when 'Suporte Técnico' then 'suporte'
    when 'Financeiro' then 'financeiro'
    when 'Comercial' then 'comercial'
    when 'Operações' then 'operacional'
    else null
  end;

  if v_role_name is null then
    return null;
  end if;

  select member.user_id
  into v_responsible_id
  from public.team_members member
  left join lateral (
    select count(*) as active_ticket_count
    from public.support_tickets ticket
    where ticket.technical_responsible_id = member.user_id
      and lower(btrim(ticket.status)) not in ('resolvido', 'fechado', 'cancelado')
      and ticket.archived_at is null
  ) workload on true
  where member.user_id is not null
    and lower(btrim(member.role_name)) = v_role_name
    and lower(trim(both '"' from trim(both '''' from btrim(member.status)))) in ('active', 'ativo', 'enabled', 'habilitado')
  order by workload.active_ticket_count, member.user_id
  limit 1;

  return v_responsible_id;
end;
$$;

create or replace function public.route_support_ticket()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_assignee_role text;
  v_assignee_active boolean;
begin
  if tg_op = 'INSERT' then
    new.technical_responsible_id := coalesce(new.technical_responsible_id, public.assign_support_ticket_responsible(new.sector));
    return new;
  end if;

  if new.sector is distinct from old.sector then
    if not public.has_workspace_permission('support', 'assign') then
      raise exception 'Permissão para alterar o setor do chamado necessária.' using errcode = '42501';
    end if;
    new.technical_responsible_id := public.assign_support_ticket_responsible(new.sector);
  elsif new.technical_responsible_id is distinct from old.technical_responsible_id then
    if not public.has_workspace_permission('support', 'assign') then
      raise exception 'Permissão para reatribuir o chamado necessária.' using errcode = '42501';
    end if;

    if new.technical_responsible_id is not null then
      select lower(btrim(member.role_name)), lower(trim(both '"' from trim(both '''' from btrim(member.status)))) in ('active', 'ativo', 'enabled', 'habilitado')
      into v_assignee_role, v_assignee_active
      from public.team_members member
      where member.user_id = new.technical_responsible_id;

      if not coalesce(v_assignee_active, false) or v_assignee_role is distinct from (case new.sector
        when 'Suporte Técnico' then 'suporte'
        when 'Financeiro' then 'financeiro'
        when 'Comercial' then 'comercial'
        when 'Operações' then 'operacional'
        else null
      end) then
        raise exception 'O responsável deve ser um usuário ativo do setor selecionado.' using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.assign_support_ticket_responsible(text) from public, anon, authenticated;
grant execute on function public.assign_support_ticket_responsible(text) to service_role;
revoke all on function public.route_support_ticket() from public, anon, authenticated;
