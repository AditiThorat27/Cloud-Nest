package com.cloudnest.backend.audit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @TenantId
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "table_name", length = 100)
    private String tableName;

    @Column(length = 10)
    private String operation;

    @Column(name = "old_data", columnDefinition = "JSONB")
    private String oldData;

    @Column(name = "new_data", columnDefinition = "JSONB")
    private String newData;

    @Column(name = "performed_at", updatable = false)
    private LocalDateTime performedAt;

    @Column(name = "performed_by")
    private String performedBy;

    @PrePersist
    protected void onCreate() {
        performedAt = LocalDateTime.now();
    }
}
