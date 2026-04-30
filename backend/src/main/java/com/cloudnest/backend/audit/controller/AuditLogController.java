package com.cloudnest.backend.audit.controller;

import com.cloudnest.backend.audit.entity.AuditLog;
import com.cloudnest.backend.audit.service.AuditLogService;
import com.cloudnest.backend.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<AuditLog> logs = auditLogService.getAuditLogs(UUID.fromString(tenantId));
        return ResponseEntity.ok(logs);
    }
}
