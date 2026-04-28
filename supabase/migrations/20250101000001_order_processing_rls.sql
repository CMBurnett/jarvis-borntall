-- Order Processing Agent — RLS policies
-- Isolates data by org_id using the same pattern as the main Jarvis schema.
-- Service role bypasses all policies for server-side operations.

alter table op_orders      enable row level security;
alter table op_line_items  enable row level security;
alter table op_sku_catalog enable row level security;
alter table op_audit_log   enable row level security;

-- ── Helper: get current user's org_id ────────────────────────────────────────

-- op_orders: users can only see orders for their own org
create policy "op_orders: org isolation"
  on op_orders for all
  using (
    org_id = (
      select org_id from profiles
      where id = auth.uid()
      limit 1
    )
  );

-- op_line_items: accessible if the parent order is accessible
create policy "op_line_items: via order org isolation"
  on op_line_items for all
  using (
    order_id in (
      select id from op_orders
      where org_id = (
        select org_id from profiles
        where id = auth.uid()
        limit 1
      )
    )
  );

-- op_sku_catalog: readable by all authenticated users (shared catalog)
-- Writes only via service role (seed script + correction writes)
create policy "op_sku_catalog: authenticated read"
  on op_sku_catalog for select
  using (auth.role() = 'authenticated');

-- op_audit_log: read-only for authenticated users of the same org
create policy "op_audit_log: via order org isolation"
  on op_audit_log for select
  using (
    order_id in (
      select id from op_orders
      where org_id = (
        select org_id from profiles
        where id = auth.uid()
        limit 1
      )
    )
  );
