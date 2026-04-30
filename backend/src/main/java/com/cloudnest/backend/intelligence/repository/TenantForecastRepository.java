package com.cloudnest.backend.intelligence.repository;

import com.cloudnest.backend.entity.TenantForecast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantForecastRepository extends JpaRepository<TenantForecast, UUID> {
    Optional<TenantForecast> findByTenantId(UUID tenantId);
}
