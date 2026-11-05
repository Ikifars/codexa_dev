create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('codexa-financial-recurring-cycles', '15 3 * * *', $$select public.generate_financial_recurring_cycles(current_date + 90);$$)
where not exists (select 1 from cron.job where jobname = 'codexa-financial-recurring-cycles');
