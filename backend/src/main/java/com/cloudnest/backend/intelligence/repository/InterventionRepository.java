package com.cloudnest.backend.intelligence.repository;

import com.cloudnest.backend.entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterventionRepository extends JpaRepository<Intervention, UUID> {
    List<Intervention> findByStatus(String status);
}
