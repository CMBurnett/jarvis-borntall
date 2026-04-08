-- Per-field confidence scores from LLM extraction
alter table op_orders
  add column if not exists field_confidence jsonb not null default '{}'::jsonb;
