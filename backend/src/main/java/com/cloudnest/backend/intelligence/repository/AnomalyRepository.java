package com.cloudnest.backend.intelligence.repository;

import com.cloudnest.backend.entity.Anomaly;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AnomalyRepository extends JpaRepository<Anomaly, UUID> {
}
