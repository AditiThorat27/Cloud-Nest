package com.cloudnest.backend.billing.repository;

import com.cloudnest.backend.billing.entity.UsageSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface UsageSnapshotRepository extends JpaRepository<UsageSnapshot, UUID> {
    List<UsageSnapshot> findByTenantIdAndSnapshotDateBetween(UUID tenantId, LocalDate startDate, LocalDate endDate);
}
