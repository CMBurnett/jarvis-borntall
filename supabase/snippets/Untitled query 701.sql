-- Helper function that reads profiles without triggering RLS
create or replace function get_my_org_id()
returns uuid
language sql
security definer
stable
as $$
  select org_id from profiles where id = auth.uid() limit 1;
$$;

-- Recreate policies using the function instead of a direct subquery
drop policy "op_orders: org isolation" on op_orders;
create policy "op_orders: org isolation"
  on op_orders for all
  using (org_id = get_my_org_id());

drop policy "op_line_items: via order org isolation" on op_line_items;
create policy "op_line_items: via order org isolation"
  on op_line_items for all
  using (
    order_id in (select id from op_orders where org_id = get_my_org_id())
  );

drop policy "op_audit_log: via order org isolation" on op_audit_log;
create policy "op_audit_log: via order org isolation"
  on op_audit_log for select
  using (
    order_id in (select id from op_orders where org_id = get_my_org_id())
  );
