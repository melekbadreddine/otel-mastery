package com.ecommerce.order.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A unique order number (e.g., a UUID)
    private String orderNumber;

    // Store the order details (e.g. cart items) as JSON text
    @Column(columnDefinition = "TEXT")
    private String items;

    private Instant checkoutTime;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    // Getters and setters (or use Lombok annotations if desired)
    public Order() {
    }

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }
    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getItems() {
        return items;
    }
    public void setItems(String items) {
        this.items = items;
    }

    public Instant getCheckoutTime() {
        return checkoutTime;
    }
    public void setCheckoutTime(Instant checkoutTime) {
        this.checkoutTime = checkoutTime;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }
    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }
    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
}

