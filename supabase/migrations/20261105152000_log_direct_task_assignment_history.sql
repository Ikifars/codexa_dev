create or replace function public.log_project_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.append_project_activity(new.project_id, new.id, auth.uid(), 'task.created', 'Tarefa criada', jsonb_build_object('title', new.title, 'status', new.status));
    return new;
  end if;
  if tg_op = 'DELETE' then
    perform public.append_project_activity(old.project_id, null, auth.uid(), 'task.deleted', 'Tarefa removida', jsonb_build_object('title', old.title));
    return old;
  end if;
  if old.status is distinct from new.status then
    perform public.append_project_activity(new.project_id, new.id, auth.uid(), 'task.status_changed', 'Tarefa movida para ' || new.status, jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if old.responsible_id is distinct from new.responsible_id then
    perform public.append_project_activity(new.project_id, new.id, auth.uid(), 'task.responsible_changed', 'Responsável da tarefa alterado', jsonb_build_object('from', old.responsible_id, 'to', new.responsible_id));
    insert into public.task_assignment_history (task_id, actor_id, from_responsible_id, to_responsible_id, action_type)
    values (new.id, auth.uid(), old.responsible_id, new.responsible_id, 'transfer');
  end if;
  if old.priority is distinct from new.priority then
    perform public.append_project_activity(new.project_id, new.id, auth.uid(), 'task.priority_changed', 'Prioridade da tarefa alterada', jsonb_build_object('from', old.priority, 'to', new.priority));
  end if;
  if old.due_date is distinct from new.due_date then
    perform public.append_project_activity(new.project_id, new.id, auth.uid(), 'task.due_date_changed', 'Prazo da tarefa alterado', jsonb_build_object('from', old.due_date, 'to', new.due_date));
  end if;
  return new;
end;
$$;
