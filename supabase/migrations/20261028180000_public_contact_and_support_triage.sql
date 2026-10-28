create table if not exists public.public_contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null check (char_length(sender_name) between 2 and 120),
  sender_email text not null check (char_length(sender_email) <= 180),
  company text,
  sector text not null check (sector in ('Suporte Técnico', 'Financeiro', 'Comercial', 'Operações')),
  employee_id uuid references public.team_members(id) on delete set null,
  subject text not null check (char_length(subject) between 2 and 180),
  body text not null check (char_length(body) between 10 and 5000),
  source text not null default 'landing_page',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.public_support_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (char_length(requester_name) between 2 and 120),
  requester_email text not null check (char_length(requester_email) <= 180),
  company text,
  category text not null,
  subject text not null check (char_length(subject) between 2 and 180),
  description text not null check (char_length(description) between 10 and 5000),
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'critical')),
  status text not null default 'pending_review' check (status in ('pending_review', 'under_review', 'awaiting_customer', 'approved', 'rejected', 'processing_error')),
  triaged_by uuid references public.team_members(id) on delete set null,
  rejection_reason text,
  approved_by uuid references public.team_members(id) on delete set null,
  approved_at timestamptz,
  support_ticket_id uuid references public.support_tickets(id) on delete set null,
  source text not null default 'landing_page',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_contact_messages_employee_idx on public.public_contact_messages(employee_id, created_at desc);
create index if not exists public_support_requests_triage_idx on public.public_support_requests(status, created_at desc);

alter table public.public_contact_messages enable row level security;
alter table public.public_support_requests enable row level security;

revoke all on public.public_contact_messages from anon, authenticated;
revoke all on public.public_support_requests from anon, authenticated;
grant insert on public.public_contact_messages to anon, authenticated;
grant insert on public.public_support_requests to anon, authenticated;

create policy "public can submit contact messages"
on public.public_contact_messages for insert to anon, authenticated
with check (source = 'landing_page');

create policy "public can submit support requests"
on public.public_support_requests for insert to anon, authenticated
with check (source = 'landing_page' and status = 'pending_review');
