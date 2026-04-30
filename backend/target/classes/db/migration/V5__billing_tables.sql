-- =============================================
-- V5: Billing Tables (Plans, Invoices, Usage Snapshots)
-- Adds SaaS billing infrastructure with
-- tenant-scoped Row-Level Security.
-- =============================================

-- 1. Billing Plans (shared across all tenants, no RLS needed)
CREATE TABLE billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price_monthly NUMERIC(10, 2),
    api_call_limit INT,
    storage_limit_gb INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    plan_id UUID REFERENCES billing_plans(id),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    due_date DATE NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_invoices
    ON invoices
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);


-- 3. Usage Snapshots
CREATE TABLE usage_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    api_calls_count INT DEFAULT 0,
    storage_used_gb NUMERIC(8, 2) DEFAULT 0,
    active_users INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_snapshot UNIQUE (tenant_id, snapshot_date)
);

ALTER TABLE usage_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_usage_snapshots
    ON usage_snapshots
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
