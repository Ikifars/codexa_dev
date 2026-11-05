alter table public.project_tasks
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select id, row_number() over (partition by project_id, status order by created_at asc, id asc) - 1 as position
  from public.project_tasks
)
update public.project_tasks as task
set sort_order = ranked.position
from ranked
where task.id = ranked.id;

create index if not exists project_tasks_kanban_order_idx
  on public.project_tasks(project_id, status, sort_order, created_at);
