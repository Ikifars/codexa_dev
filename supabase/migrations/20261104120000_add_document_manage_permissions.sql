insert into public.access_permissions (id, module_name, action_name, is_active)
values
  (gen_random_uuid(), 'documents', 'update', true),
  (gen_random_uuid(), 'documents', 'delete', true)
on conflict (module_name, action_name) do update set is_active = true;
