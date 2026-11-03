create policy support_tickets_delete_by_responsible on public.support_tickets
for delete using (
  technical_responsible_id = auth.uid()
  or public.has_workspace_permission('support', 'delete')
);

create policy support_messages_delete_by_author_or_responsible on public.support_messages
for delete using (
  created_by = auth.uid()
  or exists (
    select 1 from public.support_tickets ticket
    where ticket.id = support_messages.ticket_id
      and ticket.technical_responsible_id = auth.uid()
  )
  or public.has_workspace_permission('support', 'delete')
);

create policy accounts_receivable_delete_with_permission on public.accounts_receivable
for delete using (public.has_workspace_permission('accounts_receivable', 'delete'));

create policy accounts_payable_delete_with_permission on public.accounts_payable
for delete using (public.has_workspace_permission('accounts_payable', 'delete'));
