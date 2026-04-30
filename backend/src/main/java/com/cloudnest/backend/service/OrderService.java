package com.cloudnest.backend.service;

import com.cloudnest.backend.entity.Order;
import com.cloudnest.backend.entity.OrderItem;
import com.cloudnest.backend.entity.Product;
import com.cloudnest.backend.repository.OrderRepository;
import com.cloudnest.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional
    public Order createOrder(Order order) {
        BigDecimal total = BigDecimal.ZERO;

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                // Look up the product to get real price and name
                Product product = productRepository.findById(item.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));

                // Validate stock
                if (product.getStockQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Insufficient stock for " + product.getName() + ". Available: " + product.getStockQuantity());
                }

                // Set item details from product
                item.setProductName(product.getName());
                item.setUnitPrice(product.getPrice());
                item.setLineTotal(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                item.setOrder(order);

                // Deduct stock
                product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
                productRepository.save(product);

                total = total.add(item.getLineTotal());
            }
        }

        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    public void deleteOrder(UUID id) {
        orderRepository.deleteById(id);
    }
}
