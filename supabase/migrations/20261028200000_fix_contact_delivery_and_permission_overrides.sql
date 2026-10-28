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
set search_path = public, pg_temp
as $$
declare
  v_permission uuid;
  v_actor_member_id uuid;
  v_actor_role text;
begin
  select member.id, lower(btrim(member.role_name))
  into v_actor_member_id, v_actor_role
  from public.team_members member
  where member.user_id = p_actor_id
    and lower(trim(both '"' from trim(both '''' from btrim(member.status)))) in ('active','ativo','enabled','habilitado')
  order by (lower(btrim(member.role_name)) in ('admin','administrador')) desc, member.updated_at desc nulls last
  limit 1;

  if v_actor_member_id is null then raise exception 'not authorized' using errcode = '42501'; end if;
  if v_actor_role not in ('admin','administrador') and not public.effective_workspace_permission(v_actor_member_id, 'roles', 'manage_roles') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.team_members member where member.id = p_member_id) then raise exception 'member not found' using errcode = 'P0002'; end if;

  select permission.id into v_permission
  from public.access_permissions permission
  where permission.module_name = p_module and permission.action_name = p_action;
  if v_permission is null or p_effect not in ('inherit','allow','deny') then raise exception 'invalid permission' using errcode = '22023'; end if;

  if p_effect = 'inherit' then
    delete from public.workspace_member_permission_overrides where member_id = p_member_id and permission_id = v_permission;
  else
    insert into public.workspace_member_permission_overrides(member_id, permission_id, effect)
    values (p_member_id, v_permission, p_effect)
    on conflict (member_id, permission_id) do update set effect = excluded.effect, updated_at = now();
  end if;

  return jsonb_build_object('member_id', p_member_id, 'module_name', p_module, 'action_name', p_action, 'effect', p_effect);
end;
$$;
