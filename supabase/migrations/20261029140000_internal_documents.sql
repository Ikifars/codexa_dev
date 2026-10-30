create table if not exists public.internal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  category text not null default 'geral' check (category in ('geral','contratos','avisos','metas','processos','financeiro')),
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.internal_documents enable row level security;
insert into public.access_permissions (id, module_name, action_name)
select gen_random_uuid(), 'documents', action_name from (values ('view'), ('manage'), ('upload'), ('delete')) actions(action_name)
on conflict (module_name, action_name) do nothing;
insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id from public.access_roles roles cross join public.access_permissions permissions
where lower(roles.name) in ('admin', 'administrador') and permissions.module_name = 'documents'
on conflict (role_id, permission_id) do nothing;
create policy internal_documents_select on public.internal_documents for select to authenticated using (public.has_workspace_permission('documents', 'view'));
create policy internal_documents_insert on public.internal_documents for insert to authenticated with check (public.has_workspace_permission('documents', 'upload') and created_by = (select auth.uid()));
create policy internal_documents_delete on public.internal_documents for delete to authenticated using (public.has_workspace_permission('documents', 'delete'));
