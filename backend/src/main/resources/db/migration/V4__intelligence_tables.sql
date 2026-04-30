-- =============================================
-- V4: Intelligence Tables (Forecasts, Anomalies, Interventions)
-- Adds predictive analytics and anomaly detection
-- support with full Row-Level Security isolation.
-- =============================================

-- 1. Tenant Forecasts
CREATE TABLE tenant_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    health_score NUMERIC(5, 2),
    forecast_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tenant_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_forecasts
    ON tenant_forecasts
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);


-- 2. Anomalies
CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    signal_type VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    description TEXT,
    resolved BOOLEAN DEFAULT FALSE
);

ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_anomalies
    ON anomalies
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);


-- 3. Interventions
CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    anomaly_id UUID REFERENCES anomalies(id),
    action_taken TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_interventions
    ON interventions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
