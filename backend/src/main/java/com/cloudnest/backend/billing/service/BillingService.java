package com.cloudnest.backend.billing.service;

import com.cloudnest.backend.billing.entity.Invoice;
import com.cloudnest.backend.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BillingService {

    private final InvoiceRepository invoiceRepository;

    private static final Set<String> VALID_STATUSES = Set.of("pending", "paid", "overdue");

    public Invoice generateInvoice(UUID tenantId, BigDecimal amount) {
        Invoice invoice = Invoice.builder()
                .tenantId(tenantId)
                .amount(amount != null ? amount : BigDecimal.ZERO)
                .status("pending")
                .dueDate(LocalDate.now().plusDays(30))
                .build();
        return invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public List<Invoice> listInvoices(UUID tenantId) {
        return invoiceRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<Invoice> getInvoice(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId);
    }

    public Invoice updateInvoiceStatus(UUID invoiceId, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException(
                    "Invalid invoice status: '" + status + "'. Must be one of: " + VALID_STATUSES
            );
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + invoiceId));

        invoice.setStatus(status);

        // Auto-stamp paidAt when status transitions to 'paid'
        if ("paid".equals(status) && invoice.getPaidAt() == null) {
            invoice.setPaidAt(LocalDateTime.now());
        }

        return invoiceRepository.save(invoice);
    }
}
