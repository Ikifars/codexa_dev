create table if not exists public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  message_id uuid references public.support_messages(id) on delete set null,
  pathname text not null unique,
  filename text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists support_attachments_ticket_idx on public.support_attachments(ticket_id, created_at desc);
alter table public.support_attachments enable row level security;

drop policy if exists support_attachments_select on public.support_attachments;
create policy support_attachments_select on public.support_attachments for select using (
  exists (select 1 from public.support_tickets ticket where ticket.id = support_attachments.ticket_id and public.has_workspace_permission('support', 'view'))
);
drop policy if exists support_attachments_insert on public.support_attachments;
create policy support_attachments_insert on public.support_attachments for insert with check (
  uploaded_by = auth.uid() and exists (select 1 from public.support_tickets ticket where ticket.id = support_attachments.ticket_id and public.has_workspace_permission('support', 'update'))
);
drop policy if exists support_attachments_delete on public.support_attachments;
create policy support_attachments_delete on public.support_attachments for delete using (
  public.has_workspace_permission('support', 'delete') or uploaded_by = auth.uid()
);
