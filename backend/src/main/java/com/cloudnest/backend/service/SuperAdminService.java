package com.cloudnest.backend.service;

import com.cloudnest.backend.dto.SuperAdminDashboardDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SuperAdminService {

    private final JdbcTemplate jdbcTemplate;

    public SuperAdminService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public SuperAdminDashboardDTO getDashboardData() {
        SuperAdminDashboardDTO dto = new SuperAdminDashboardDTO();

        // 1. Total Active Tenants
        Long totalTenants = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tenants", Long.class);
        dto.setTotalActiveTenants(totalTenants != null ? totalTenants : 0);

        // 2. Total MRR (Sum of paid invoices, or simply assume plan price based on plan_id)
        // Since we don't have a plan prices table easily available, we'll sum the paid invoices as MRR proxy
        Double mrr = jdbcTemplate.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'paid'", Double.class);
        dto.setMrr(mrr != null ? mrr : 0.0);

        // 3. Global Traffic
        Long traffic = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM api_metrics", Long.class);
        dto.setGlobalTraffic(traffic != null ? traffic : 0);

        // 4. Tenants Directory
        String directoryQuery = """
            SELECT 
                t.id::text, 
                t.name, 
                t.subdomain,
                COALESCE(t.status, 'Healthy') as status,
                COALESCE(t.plan, 'free') as plan,
                (SELECT COUNT(*) FROM api_metrics a WHERE a.tenant_id = t.id) as traffic,
                (SELECT COALESCE(SUM(amount), 0) FROM invoices i WHERE i.tenant_id = t.id AND i.status = 'paid') as mrr
            FROM tenants t
        """;

        List<SuperAdminDashboardDTO.TenantSummary> directory = jdbcTemplate.query(directoryQuery, (rs, rowNum) -> {
            SuperAdminDashboardDTO.TenantSummary summary = new SuperAdminDashboardDTO.TenantSummary();
            summary.setId(rs.getString("id"));
            summary.setName(rs.getString("name"));
            summary.setSubdomain(rs.getString("subdomain"));
            summary.setStatus(rs.getString("status"));
            summary.setTraffic(rs.getLong("traffic"));
            summary.setMrr(rs.getDouble("mrr"));
            
            String plan = rs.getString("plan");
            if ("pro".equalsIgnoreCase(plan)) summary.setPlan("Professional");
            else if ("enterprise".equalsIgnoreCase(plan)) summary.setPlan("Enterprise");
            else summary.setPlan("Free Tier");
            
            return summary;
        });

        dto.setDirectory(directory);
        return dto;
    }

    public void suspendTenant(String tenantId) {
        jdbcTemplate.update("UPDATE tenants SET status = 'SUSPENDED' WHERE id = ?::uuid", tenantId);
    }

    public void activateTenant(String tenantId) {
        jdbcTemplate.update("UPDATE tenants SET status = 'ACTIVE' WHERE id = ?::uuid", tenantId);
    }

    public void deleteTenant(String tenantId) {
        // Since we have foreign keys, we should ideally delete child records first or rely on ON DELETE CASCADE.
        // Assuming ON DELETE CASCADE is NOT configured everywhere, let's delete manually from core tables first.
        jdbcTemplate.update("DELETE FROM api_metrics WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM invoices WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM interventions WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM anomalies WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM tenant_forecasts WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?::uuid)", tenantId);
        jdbcTemplate.update("DELETE FROM orders WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM products WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM customers WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM audit_logs WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM users WHERE tenant_id = ?::uuid", tenantId);
        jdbcTemplate.update("DELETE FROM tenants WHERE id = ?::uuid", tenantId);
    }
}
