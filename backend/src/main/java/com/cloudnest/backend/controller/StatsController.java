package com.cloudnest.backend.controller;

import com.cloudnest.backend.repository.CustomerRepository;
import com.cloudnest.backend.repository.OrderRepository;
import com.cloudnest.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        long productCount = productRepository.count();
        long orderCount = orderRepository.count();
        long customerCount = customerRepository.count();

        return ResponseEntity.ok(Map.of(
                "productCount", productCount,
                "orderCount", orderCount,
                "customerCount", customerCount
        ));
    }
}
