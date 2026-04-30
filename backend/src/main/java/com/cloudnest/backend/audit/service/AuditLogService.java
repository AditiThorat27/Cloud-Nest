package com.cloudnest.backend.audit.service;

import com.cloudnest.backend.audit.entity.AuditLog;
import com.cloudnest.backend.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public List<AuditLog> getAuditLogs(UUID tenantId) {
        return auditLogRepository.findByTenantIdOrderByPerformedAtDesc(tenantId);
    }
}
