create table if not exists public.financial_recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  description text not null,
  kind text not null check (kind in ('receita','despesa')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null default 'Operacional',
  beneficiary text,
  client_id uuid,
  account_id uuid,
  frequency text not null default 'monthly' check (frequency in ('monthly','weekly','yearly')),
  anchor_day integer not null check (anchor_day between 1 and 31),
  first_due_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active','paused','ended')),
  notes text,
  next_due_date date not null,
  last_generated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= first_due_date)
);

alter table public.accounts_receivable add column if not exists recurring_schedule_id uuid references public.financial_recurring_schedules(id) on delete set null;
alter table public.accounts_receivable add column if not exists recurring_cycle_key text;
alter table public.accounts_payable add column if not exists recurring_schedule_id uuid references public.financial_recurring_schedules(id) on delete set null;
alter table public.accounts_payable add column if not exists recurring_cycle_key text;
create unique index if not exists accounts_receivable_recurring_cycle_uidx on public.accounts_receivable(recurring_schedule_id, recurring_cycle_key) where recurring_schedule_id is not null;
create unique index if not exists accounts_payable_recurring_cycle_uidx on public.accounts_payable(recurring_schedule_id, recurring_cycle_key) where recurring_schedule_id is not null;

alter table public.financial_recurring_schedules enable row level security;
grant select, insert, update on public.financial_recurring_schedules to authenticated;
create policy financial_recurring_select on public.financial_recurring_schedules for select to authenticated using (public.has_workspace_permission('finance','view'));
create policy financial_recurring_insert on public.financial_recurring_schedules for insert to authenticated with check (created_by = (select auth.uid()) and public.has_workspace_permission('finance','create'));
create policy financial_recurring_update on public.financial_recurring_schedules for update to authenticated using (public.has_workspace_permission('finance','update')) with check (public.has_workspace_permission('finance','update'));

create or replace function public.generate_financial_recurring_cycles(p_until date default (current_date + 90))
returns integer language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare schedule record; cycle_date date; cycle_key text; generated integer := 0; target_date date;
begin
  for schedule in select * from public.financial_recurring_schedules where status = 'active' and next_due_date <= p_until order by next_due_date for update loop
    cycle_date := schedule.next_due_date;
    while cycle_date <= p_until and (schedule.end_date is null or cycle_date <= schedule.end_date) loop
      cycle_key := to_char(cycle_date, 'YYYY-MM');
      if schedule.frequency = 'yearly' then cycle_key := to_char(cycle_date, 'YYYY-MM-DD'); end if;
      if schedule.kind = 'receita' then
        insert into public.accounts_receivable (description, category, original_amount, final_amount, paid_amount, due_date, status, recurring_schedule_id, recurring_cycle_key)
        values (schedule.description, schedule.category, schedule.amount, schedule.amount, 0, cycle_date, 'Pendente', schedule.id, cycle_key)
        on conflict (recurring_schedule_id, recurring_cycle_key) where recurring_schedule_id is not null do nothing;
      else
        insert into public.accounts_payable (beneficiary, description, category, amount, paid_amount, due_date, status, recurring_schedule_id, recurring_cycle_key)
        values (coalesce(schedule.beneficiary, schedule.description), schedule.description, schedule.category, schedule.amount, 0, cycle_date, 'Pendente', schedule.id, cycle_key)
        on conflict (recurring_schedule_id, recurring_cycle_key) where recurring_schedule_id is not null do nothing;
      end if;
      generated := generated + 1;
      if schedule.frequency = 'weekly' then target_date := cycle_date + interval '7 days';
      elsif schedule.frequency = 'yearly' then target_date := make_date(extract(year from cycle_date)::integer + 1, extract(month from schedule.first_due_date)::integer, least(schedule.anchor_day, extract(day from (date_trunc('month', make_date(extract(year from cycle_date)::integer + 1, extract(month from schedule.first_due_date)::integer, 1)) + interval '1 month - 1 day'))::integer));
      else target_date := make_date(extract(year from cycle_date + interval '1 month')::integer, extract(month from cycle_date + interval '1 month')::integer, least(schedule.anchor_day, extract(day from (date_trunc('month', cycle_date + interval '1 month') + interval '1 month - 1 day'))::integer)); end if;
      cycle_date := target_date;
    end loop;
    update public.financial_recurring_schedules set next_due_date = cycle_date, last_generated_date = cycle_date - 1, updated_at = now() where id = schedule.id;
  end loop;
  return generated;
end; $$;
revoke all on function public.generate_financial_recurring_cycles(date) from public, anon;
grant execute on function public.generate_financial_recurring_cycles(date) to authenticated;
