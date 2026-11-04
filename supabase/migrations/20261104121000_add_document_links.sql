create table if not exists public.document_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.internal_documents(id) on delete cascade,
  entity_type text not null check (entity_type in ('project', 'task', 'contract', 'support_ticket', 'financial')),
  entity_id uuid not null,
  linked_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (document_id, entity_type, entity_id)
);

alter table public.document_links enable row level security;
create index if not exists document_links_entity_idx on public.document_links(entity_type, entity_id);
create index if not exists document_links_document_idx on public.document_links(document_id);

create policy document_links_select_workspace on public.document_links for select using (public.has_workspace_permission('documents', 'view'));
create policy document_links_insert_workspace on public.document_links for insert with check (public.has_workspace_permission('documents', 'upload') and auth.uid() = linked_by);
create policy document_links_delete_workspace on public.document_links for delete using (public.has_workspace_permission('documents', 'upload'));
