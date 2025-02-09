package com.ecommerce.cart.service;

import com.ecommerce.cart.model.CheckoutEvent;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    
    @Value("${kafka.checkout-topic}")
    private String checkoutTopic;
    
    // Register the module so that Instant can be serialized properly
    private final ObjectMapper objectMapper;
    
    public KafkaProducerService() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }
    
    public void publishCheckoutEvent(CheckoutEvent event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(checkoutTopic, "cart", eventJson);
            logger.info("Published checkout event for cart");
        } catch (JsonProcessingException e) {
            logger.error("Error serializing checkout event", e);
        }
    }
}

