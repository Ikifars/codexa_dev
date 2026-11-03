alter table public.support_messages add column if not exists author_name text;
update public.support_messages set author_name = coalesce(author_name, actor_name, 'Equipe Codexa') where author_name is null;
alter table public.support_messages alter column author_name set default 'Equipe Codexa';
alter table public.support_messages alter column author_name set not null;
