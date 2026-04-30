package com.cloudnest.backend.service;

import com.cloudnest.backend.entity.Customer;
import com.cloudnest.backend.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(UUID id, Customer updated) {
        Customer c = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
        c.setFirstName(updated.getFirstName());
        c.setLastName(updated.getLastName());
        c.setEmail(updated.getEmail());
        c.setPhone(updated.getPhone());
        return customerRepository.save(c);
    }

    public void deleteCustomer(UUID id) {
        customerRepository.deleteById(id);
    }
}
