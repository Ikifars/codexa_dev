alter table public.profile_badges alter column member_id drop not null;
alter table public.profile_badges add column if not exists image_path text;
alter table public.team_members add column if not exists xp integer not null default 0 check (xp >= 0);
alter table public.team_members add column if not exists level integer not null default 1 check (level >= 1);

insert into public.access_permissions (id, module_name, action_name)
select gen_random_uuid(), 'badges', action_name
from (values ('view'), ('manage'), ('create'), ('update'), ('delete'), ('assign'), ('upload')) actions(action_name)
on conflict (module_name, action_name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.access_roles roles
cross join public.access_permissions permissions
where lower(roles.name) = 'admin' and permissions.module_name = 'badges'
on conflict (role_id, permission_id) do nothing;

