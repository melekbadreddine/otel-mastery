package com.ecommerce.order.service;

import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.PaymentStatus;
import com.ecommerce.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.UUID;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private KafkaProducerService kafkaProducerService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Consume checkout events from Kafka. The event is expected to be JSON containing
     * a list of cart items and a checkoutTime.
     */
    @KafkaListener(topics = "${kafka.checkout-topic}", groupId = "order-processing-group")
    public void handleCheckoutEvent(String message) {
        try {
            logger.info("Received checkout event: {}", message);
            JsonNode jsonNode = objectMapper.readTree(message);
            // Extract the "items" array from the JSON payload.
            String itemsJson = jsonNode.get("items").toString();
            
            // Handle checkoutTime: check if it's a number or a text.
            Instant checkoutTime;
            JsonNode checkoutTimeNode = jsonNode.get("checkoutTime");
            if (checkoutTimeNode.isNumber()) {
                // If numeric, convert the double value to seconds and nanos.
                double ts = checkoutTimeNode.asDouble();
                long epochSeconds = (long) ts;
                long nanos = (long) ((ts - epochSeconds) * 1_000_000_000);
                checkoutTime = Instant.ofEpochSecond(epochSeconds, nanos);
            } else {
                // Otherwise assume it's a proper ISO‑8601 string.
                checkoutTime = Instant.parse(checkoutTimeNode.asText());
            }

            // Simulate order processing and payment
            String orderNumber = UUID.randomUUID().toString();
            logger.info("Processing order {}", orderNumber);
            
            PaymentStatus paymentStatus = processPayment();
            
            Order order = new Order();
            order.setOrderNumber(orderNumber);
            order.setItems(itemsJson);
            order.setCheckoutTime(checkoutTime);
            order.setOrderStatus(OrderStatus.COMPLETED);
            order.setPaymentStatus(paymentStatus);
            
            // Save the order in PostgreSQL
            orderRepository.save(order);
            logger.info("Order {} processed and saved", orderNumber);
            
            // Publish an order confirmation event to Kafka
            kafkaProducerService.publishOrderConfirmation(order);
        } catch (Exception e) {
            logger.error("Error processing checkout event", e);
        }
    }
    
    // Simulate payment processing (this can be replaced with real integration)
    private PaymentStatus processPayment() {
        try {
            Thread.sleep(1000); // simulate delay
        } catch (InterruptedException e) {
            logger.error("Payment processing interrupted", e);
            return PaymentStatus.FAILED;
        }
        return PaymentStatus.SUCCESS;
    }
    
    // Synchronous method to query an order by its database ID.
    @Transactional(readOnly = true)
    public Order getOrder(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
    
    // Synchronous method to query an order by its order number.
    @Transactional(readOnly = true)
    public Order getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber).orElse(null);
    }
}

