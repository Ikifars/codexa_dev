insert into public.xp_action_settings (action_key, label, xp_amount, is_active) values
('create_task', 'Criar tarefas', 10, true),
('complete_task_on_time', 'Concluir tarefa no prazo', 40, true),
('resolve_support_ticket', 'Resolver chamado de suporte', 60, true),
('approve_change_request', 'Aprovar solicitação de alteração', 35, true),
('deliver_project_milestone', 'Entregar marco de projeto', 100, true),
('create_document', 'Publicar documento interno', 15, true),
('assign_badge', 'Receber emblema', 25, true),
('receive_positive_feedback', 'Receber feedback positivo', 30, true),
('achieve_goal', 'Atingir meta', 120, true),
('close_contract', 'Fechar contrato', 180, true),
('win_lead', 'Converter lead', 150, true)
on conflict (action_key) do nothing;
