package com.cloudnest.backend.intelligence.scheduler;

import com.cloudnest.backend.intelligence.service.IntelligenceService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class IntelligenceScheduler {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceScheduler.class);

    private final JdbcTemplate jdbcTemplate;
    private final IntelligenceService intelligenceService;

    /**
     * Runs daily at 2:00 AM.
     * Executes the PostgreSQL forecast_all_tenants() function
     * to compute health scores and risk levels for all tenants.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void runForecasting() {
        log.info("[IntelligenceScheduler] Starting daily tenant forecasting...");
        try {
            Integer tenantsProcessed = jdbcTemplate.queryForObject(
                    "SELECT forecast_all_tenants()", Integer.class
            );
            log.info("[IntelligenceScheduler] Forecasting complete. Tenants processed: {}", tenantsProcessed);
        } catch (Exception e) {
            log.error("[IntelligenceScheduler] Forecasting failed. Will retry on next scheduled run.", e);
        }
    }

    /**
     * Runs every hour at the top of the hour.
     * Executes the PostgreSQL detect_usage_anomalies() function
     * to flag unusual API usage spikes per tenant.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void runAnomalyDetection() {
        log.info("[IntelligenceScheduler] Starting hourly anomaly detection...");
        try {
            Integer anomaliesDetected = jdbcTemplate.queryForObject(
                    "SELECT detect_usage_anomalies()", Integer.class
            );
            log.info("[IntelligenceScheduler] Anomaly detection complete. New anomalies detected: {}", anomaliesDetected);
        } catch (Exception e) {
            log.error("[IntelligenceScheduler] Anomaly detection failed. Will retry on next scheduled run.", e);
        }
    }
}
