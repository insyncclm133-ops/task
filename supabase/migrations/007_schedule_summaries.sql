-- ============================================================
-- Schedule weekly and monthly summary notifications via pg_cron
-- Weekly:  Every Monday at 8:00 AM IST (02:30 UTC)
-- Monthly: 1st of each month at 8:00 AM IST (02:30 UTC)
-- ============================================================

SELECT cron.schedule(
  'weekly-summary',
  '30 2 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'
    ),
    body := '{"period":"weekly"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'monthly-summary',
  '30 2 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'
    ),
    body := '{"period":"monthly"}'::jsonb
  );
  $$
);
