create or replace function public.prune_audit_logs()
returns void
language sql
security definer
as $$
  delete from public.audit_logs
  where created_at < now() - interval '30 days';
$$;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      create extension if not exists pg_cron with schema extensions;
    exception
      when insufficient_privilege then
        null;
    end;
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'prune_audit_logs_daily') then
      perform cron.schedule(
        'prune_audit_logs_daily',
        '0 3 * * *',
        $job$select public.prune_audit_logs();$job$
      );
    end if;
  end if;
end $$;
