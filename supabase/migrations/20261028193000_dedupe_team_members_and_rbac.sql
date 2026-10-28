-- Remove registros órfãos quando já existe um membro vinculado à mesma conta/e-mail.
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(trim(email))
      order by (user_id is not null) desc, created_at nulls last, id
    ) as position
  from public.team_members
  where email is not null and trim(email) <> ''
)
delete from public.team_members member
using ranked duplicate
where member.id = duplicate.id
  and duplicate.position > 1;

create unique index if not exists team_members_email_unique_idx
  on public.team_members (lower(trim(email)))
  where email is not null and trim(email) <> '';

create unique index if not exists team_members_user_id_unique_idx
  on public.team_members (user_id)
  where user_id is not null;

create or replace function public.has_workspace_permission(p_module text, p_action text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.team_members member
    where member.user_id = (select auth.uid())
      and lower(trim(both '"' from trim(both '''' from btrim(member.status)))) in ('active','ativo','enabled','habilitado')
      and (
        lower(btrim(member.role_name)) = 'admin'
        or public.effective_workspace_permission(member.id, p_module, p_action)
      )
  );
$$;

create or replace function public.save_workspace_member_permission_override(
  p_actor_id uuid,
  p_member_id uuid,
  p_module text,
  p_action text,
  p_effect text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_permission uuid;
  v_actor_member_id uuid;
begin
  if p_actor_id is distinct from (select auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select member.id
  into v_actor_member_id
  from public.team_members member
  where member.user_id = (select auth.uid())
    and lower(trim(both '"' from trim(both '''' from btrim(member.status)))) in ('active','ativo','enabled','habilitado')
  order by (lower(btrim(member.role_name)) = 'admin') desc, member.updated_at desc nulls last
  limit 1;

  if v_actor_member_id is null or not public.has_workspace_permission('roles', 'manage_roles') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.team_members member
    where member.id = p_member_id
  ) then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  select permission.id into v_permission
  from public.access_permissions permission
  where permission.module_name = p_module and permission.action_name = p_action;

  if v_permission is null or p_effect not in ('inherit','allow','deny') then
    raise exception 'invalid permission' using errcode = '22023';
  end if;

  if p_effect = 'inherit' then
    delete from public.workspace_member_permission_overrides
    where member_id = p_member_id and permission_id = v_permission;
  else
    insert into public.workspace_member_permission_overrides(member_id, permission_id, effect)
    values (p_member_id, v_permission, p_effect)
    on conflict (member_id, permission_id)
    do update set effect = excluded.effect, updated_at = now();
  end if;

  return jsonb_build_object(
    'member_id', p_member_id,
    'module_name', p_module,
    'action_name', p_action,
    'effect', p_effect
  );
end;
$$;

revoke all on function public.has_workspace_permission(text, text) from public;
grant execute on function public.has_workspace_permission(text, text) to authenticated;
revoke all on function public.save_workspace_member_permission_override(uuid, uuid, text, text, text) from public;
grant execute on function public.save_workspace_member_permission_override(uuid, uuid, text, text, text) to authenticated;
