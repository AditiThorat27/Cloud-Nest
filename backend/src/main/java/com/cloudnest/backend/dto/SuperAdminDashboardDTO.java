package com.cloudnest.backend.dto;

import java.util.List;

public class SuperAdminDashboardDTO {
    private long totalActiveTenants;
    private double mrr;
    private long globalTraffic;
    private List<TenantSummary> directory;

    public static class TenantSummary {
        private String id;
        private String name;
        private String subdomain;
        private String plan;
        private double mrr;
        private String status;
        private long traffic;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSubdomain() { return subdomain; }
        public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
        public double getMrr() { return mrr; }
        public void setMrr(double mrr) { this.mrr = mrr; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public long getTraffic() { return traffic; }
        public void setTraffic(long traffic) { this.traffic = traffic; }
    }

    // Getters and setters
    public long getTotalActiveTenants() { return totalActiveTenants; }
    public void setTotalActiveTenants(long totalActiveTenants) { this.totalActiveTenants = totalActiveTenants; }
    public double getMrr() { return mrr; }
    public void setMrr(double mrr) { this.mrr = mrr; }
    public long getGlobalTraffic() { return globalTraffic; }
    public void setGlobalTraffic(long globalTraffic) { this.globalTraffic = globalTraffic; }
    public List<TenantSummary> getDirectory() { return directory; }
    public void setDirectory(List<TenantSummary> directory) { this.directory = directory; }
}
