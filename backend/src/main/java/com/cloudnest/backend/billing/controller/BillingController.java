package com.cloudnest.backend.billing.controller;

import com.cloudnest.backend.billing.entity.Invoice;
import com.cloudnest.backend.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.cloudnest.backend.multitenancy.TenantContext;

import com.cloudnest.backend.repository.TenantRepository;
import com.cloudnest.backend.entity.Tenant;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final TenantRepository tenantRepository;
    private final com.cloudnest.backend.repository.ApiMetricRepository apiMetricRepository;

    @GetMapping("/plan")
    public ResponseEntity<Map<String, Object>> getCurrentPlan() {
        String tenantIdStr = TenantContext.getCurrentTenant();
        if (tenantIdStr == null) return ResponseEntity.badRequest().build();
        
        return tenantRepository.findById(UUID.fromString(tenantIdStr))
                .map(t -> {
                    String plan = t.getPlan() != null ? t.getPlan() : "free";
                    long usage = apiMetricRepository.countByTimestampAfter(java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0));
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "plan", plan,
                            "usage", usage
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/plan")
    public ResponseEntity<Map<String, String>> updatePlan(@RequestBody Map<String, String> body) {
        String tenantIdStr = TenantContext.getCurrentTenant();
        if (tenantIdStr == null) return ResponseEntity.badRequest().build();
        
        return tenantRepository.findById(UUID.fromString(tenantIdStr))
                .map(t -> {
                    t.setPlan(body.get("plan"));
                    tenantRepository.save(t);
                    return ResponseEntity.ok(Map.of("plan", t.getPlan()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/invoices/generate")
    public ResponseEntity<Invoice> generateInvoice() {
        String tenantIdStr = TenantContext.getCurrentTenant();
        if (tenantIdStr == null) return ResponseEntity.badRequest().build();
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        String plan = tenantRepository.findById(tenantId).map(Tenant::getPlan).orElse("free");
        
        java.math.BigDecimal amount = java.math.BigDecimal.ZERO;
        if ("pro".equals(plan)) amount = new java.math.BigDecimal("49.00");
        else if ("enterprise".equals(plan)) amount = new java.math.BigDecimal("199.00");
        
        Invoice invoice = billingService.generateInvoice(tenantId, amount);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> listInvoices() {
        String tenantIdStr = TenantContext.getCurrentTenant();
        if (tenantIdStr == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(billingService.listInvoices(UUID.fromString(tenantIdStr)));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable UUID id) {
        return billingService.getInvoice(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/invoices/{id}/status")
    public ResponseEntity<Invoice> updateInvoiceStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Invoice updated = billingService.updateInvoiceStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}
