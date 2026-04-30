package com.cloudnest.backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usage_snapshots", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "snapshot_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageSnapshot {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Builder.Default
    @Column(name = "api_calls_count")
    private Integer apiCallsCount = 0;

    @Builder.Default
    @Column(name = "storage_used_gb", precision = 8, scale = 2)
    private BigDecimal storageUsedGb = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "active_users")
    private Integer activeUsers = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
