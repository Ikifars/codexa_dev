create or replace function public.list_project_member_directory(p_project_id uuid)
returns table(user_id uuid, member_id uuid, full_name text, email text, status text, avatar_url text)
language sql security definer stable
set search_path = public, auth, pg_temp
as $$
  select member.user_id, member.id, member.full_name, member.email, member.status, null::text
  from public.team_members member
  where public.has_workspace_permission('projects', 'view')
    and public.has_project_access(p_project_id, 'viewer')
    and lower(trim(both '"' from trim(both '''' from btrim(coalesce(member.status, ''))))) in ('active', 'ativo', 'enabled', 'habilitado')
    and member.user_id is not null
  order by lower(coalesce(member.full_name, member.email, ''));
$$;
revoke all on function public.list_project_member_directory(uuid) from public, anon;
grant execute on function public.list_project_member_directory(uuid) to authenticated;
