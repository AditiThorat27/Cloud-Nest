package com.cloudnest.backend.controller;

import com.cloudnest.backend.dto.SuperAdminDashboardDTO;
import com.cloudnest.backend.service.SuperAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/super-admin")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<SuperAdminDashboardDTO> getDashboard() {
        return ResponseEntity.ok(superAdminService.getDashboardData());
    }

    @org.springframework.web.bind.annotation.PutMapping("/tenants/{id}/suspend")
    public ResponseEntity<java.util.Map<String, String>> suspendTenant(@org.springframework.web.bind.annotation.PathVariable String id) {
        superAdminService.suspendTenant(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Tenant suspended"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/tenants/{id}/activate")
    public ResponseEntity<java.util.Map<String, String>> activateTenant(@org.springframework.web.bind.annotation.PathVariable String id) {
        superAdminService.activateTenant(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Tenant activated"));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/tenants/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteTenant(@org.springframework.web.bind.annotation.PathVariable String id) {
        superAdminService.deleteTenant(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Tenant deleted"));
    }
}
