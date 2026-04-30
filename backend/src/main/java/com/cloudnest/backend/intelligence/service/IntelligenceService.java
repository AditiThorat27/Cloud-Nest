package com.cloudnest.backend.intelligence.service;

import com.cloudnest.backend.entity.Anomaly;
import com.cloudnest.backend.entity.Intervention;
import com.cloudnest.backend.entity.TenantForecast;
import com.cloudnest.backend.intelligence.repository.AnomalyRepository;
import com.cloudnest.backend.intelligence.repository.InterventionRepository;
import com.cloudnest.backend.intelligence.repository.TenantForecastRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class IntelligenceService {

    private final TenantForecastRepository tenantForecastRepository;
    private final AnomalyRepository anomalyRepository;
    private final InterventionRepository interventionRepository;

    @Transactional(readOnly = true)
    public Optional<TenantForecast> getTenantForecast(UUID tenantId) {
        return tenantForecastRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<TenantForecast> getAllForecasts() {
        return tenantForecastRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Anomaly> getAnomalies() {
        return anomalyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Intervention> getPendingInterventions() {
        return interventionRepository.findByStatus("pending");
    }

    public TenantForecast saveForecast(UUID tenantId, TenantForecast forecast) {
        forecast.setTenantId(tenantId);
        return tenantForecastRepository.save(forecast);
    }

    public Intervention resolveIntervention(UUID interventionId) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention not found with id: " + interventionId));

        intervention.setStatus("resolved");
        intervention.setResolvedAt(LocalDateTime.now());
        return interventionRepository.save(intervention);
    }

    public Anomaly saveAnomaly(Anomaly anomaly) {
        return anomalyRepository.save(anomaly);
    }

    public Intervention saveIntervention(Intervention intervention) {
        return interventionRepository.save(intervention);
    }
}
