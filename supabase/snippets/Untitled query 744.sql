UPDATE clause_assessments
SET evidence_checks = '{"approved_quality_policy_document":false,"quality_objectives_linked_to_quality_policy_framework":false,"strategic_planning_documentation":false,"quality_policy_commitment_statements":false,"management_review_records":false,"policy_integration_in_business_planning":false}'
WHERE clause_id = 'iso9001-5.2.1';

UPDATE clause_assessments
SET evidence_checks = '{"change_request_and_authorization_records":false,"amendment_log_or_revision_history":true,"updated_product_service_documentation":true,"distribution_list_or_change_notification_records":true,"acknowledgment_records":false,"traceability_records":false}'
WHERE clause_id = 'iso9001-8.2.4';
