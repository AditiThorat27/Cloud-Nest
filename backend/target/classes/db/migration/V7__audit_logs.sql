-- =============================================
-- V7: Audit Logs Table & Trigger Function
-- Captures INSERT/UPDATE/DELETE events on key
-- tables with full old/new data snapshots.
-- =============================================

-- 1. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    table_name VARCHAR(100),
    operation VARCHAR(10) CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by TEXT
);


-- 2. Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Capture old/new data based on operation type
    IF TG_OP = 'DELETE' THEN
        v_old_data := row_to_json(OLD)::JSONB;
        v_new_data := NULL;
        -- Attempt to extract tenant_id from OLD row
        v_tenant_id := (row_to_json(OLD)::JSONB ->> 'tenant_id')::UUID;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_data := NULL;
        v_new_data := row_to_json(NEW)::JSONB;
        v_tenant_id := (row_to_json(NEW)::JSONB ->> 'tenant_id')::UUID;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := row_to_json(OLD)::JSONB;
        v_new_data := row_to_json(NEW)::JSONB;
        v_tenant_id := (row_to_json(NEW)::JSONB ->> 'tenant_id')::UUID;
    END IF;

    INSERT INTO audit_logs (tenant_id, table_name, operation, old_data, new_data, performed_by)
    VALUES (
        v_tenant_id,
        TG_TABLE_NAME,
        TG_OP,
        v_old_data,
        v_new_data,
        COALESCE(current_setting('app.current_user', TRUE), 'system')
    );

    -- Return appropriate row to allow the operation to proceed
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


-- 3. Attach Triggers to Key Tables

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_interventions
    AFTER INSERT OR UPDATE OR DELETE ON interventions
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_tenant_forecasts
    AFTER INSERT OR UPDATE OR DELETE ON tenant_forecasts
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();
