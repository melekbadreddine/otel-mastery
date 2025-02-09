package com.ecommerce.order.service;

import com.ecommerce.order.model.Order;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    @Value("${kafka.order-confirmation-topic}")
    private String orderConfirmationTopic;
    
    private final ObjectMapper objectMapper;
    
    public KafkaProducerService() {
        objectMapper = new ObjectMapper();
        // Register the module that supports Java 8 date/time types.
        objectMapper.registerModule(new JavaTimeModule());
        // Disable writing dates as numeric timestamps
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
    
    public void publishOrderConfirmation(Order order) {
        try {
            String orderJson = objectMapper.writeValueAsString(order);
            kafkaTemplate.send(orderConfirmationTopic, order.getOrderNumber(), orderJson);
            logger.info("Published order confirmation for order {}", order.getOrderNumber());
        } catch (JsonProcessingException e) {
            logger.error("Error serializing order confirmation", e);
        }
    }
}

