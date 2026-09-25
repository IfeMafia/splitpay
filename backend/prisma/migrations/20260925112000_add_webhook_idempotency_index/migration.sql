CREATE UNIQUE INDEX IF NOT EXISTS "audit_log_webhook_entity_idempotency_key"
ON "audit_log"("entity_type", "entity_id")
WHERE "entity_type" = 'WEBHOOK';
