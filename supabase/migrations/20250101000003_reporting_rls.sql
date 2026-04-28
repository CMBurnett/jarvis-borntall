-- RLS for reporting agent tables
-- Follows the same pattern as 002_order_processing_rls.sql

alter table rp_dashboards enable row level security;

-- Users can only see dashboards belonging to their org
create policy "rp_dashboards: org isolation"
  on rp_dashboards for all
  using (
    org_id = (select org_id from profiles where id = auth.uid() limit 1)
  );
