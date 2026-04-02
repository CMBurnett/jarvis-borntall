-- Check your profile's org_id
select id, org_id from profiles limit 5;

-- Check what org_id the orders have
select id, org_id, customer_name, status from op_orders limit 5;
