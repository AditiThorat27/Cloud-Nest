package com.cloudnest.backend.repository;

import com.cloudnest.backend.entity.ApiMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

import java.time.LocalDateTime;

public interface ApiMetricRepository extends JpaRepository<ApiMetric, UUID> {
    long countByTimestampAfter(LocalDateTime date);
}
