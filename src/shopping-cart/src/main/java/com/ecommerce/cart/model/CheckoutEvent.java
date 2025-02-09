package com.ecommerce.cart.model;

import java.time.Instant;
import java.util.List;

public class CheckoutEvent {
    private List<CartItem> items;
    private Instant checkoutTime;

    public CheckoutEvent() {}

    public CheckoutEvent(List<CartItem> items) {
        this.items = items;
        this.checkoutTime = Instant.now();
    }
    
    // Getters and Setters
    public List<CartItem> getItems() {
        return items;
    }
    public void setItems(List<CartItem> items) {
        this.items = items;
    }
    public Instant getCheckoutTime() {
        return checkoutTime;
    }
    public void setCheckoutTime(Instant checkoutTime) {
        this.checkoutTime = checkoutTime;
    }
}

