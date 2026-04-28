-- Add attachments metadata column to op_orders
-- Stores [{filename, path, content_type}] for files uploaded to op-attachments storage bucket
alter table op_orders
  add column if not exists attachments jsonb not null default '[]'::jsonb;
