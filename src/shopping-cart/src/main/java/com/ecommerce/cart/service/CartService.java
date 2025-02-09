package com.ecommerce.cart.service;

import com.ecommerce.cart.model.Cart;
import com.ecommerce.cart.model.CartItem;
import com.ecommerce.cart.model.CheckoutEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class CartService {
    private static final String CART_KEY = "cart";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private KafkaProducerService kafkaProducerService;
    
    public Cart getCart() {
        Cart cart = (Cart) redisTemplate.opsForValue().get(CART_KEY);
        if (cart == null) {
            cart = new Cart();
        }
        return cart;
    }
    
    public Cart addItem(CartItem item) {
        Cart cart = getCart();
        boolean found = false;
        for (CartItem existingItem : cart.getItems()) {
            if (existingItem.getProductId().equals(item.getProductId())) {
                existingItem.setQuantity(existingItem.getQuantity() + item.getQuantity());
                found = true;
                break;
            }
        }
        if (!found) {
            cart.getItems().add(item);
        }
        saveCart(cart);
        return cart;
    }
    
    public Cart updateItem(CartItem item) {
        Cart cart = getCart();
        cart.getItems().removeIf(i -> i.getProductId().equals(item.getProductId()));
        cart.getItems().add(item);
        saveCart(cart);
        return cart;
    }
    
    public Cart removeItem(String productId) {
        Cart cart = getCart();
        cart.getItems().removeIf(i -> i.getProductId().equals(productId));
        saveCart(cart);
        return cart;
    }
    
    public void checkout() {
        Cart cart = getCart();
        if (!cart.getItems().isEmpty()) {
            CheckoutEvent event = new CheckoutEvent(cart.getItems());
            kafkaProducerService.publishCheckoutEvent(event);
            clearCart();
        }
    }
    
    private void saveCart(Cart cart) {
        redisTemplate.opsForValue().set(CART_KEY, cart, 30, TimeUnit.MINUTES);
    }
    
    private void clearCart() {
        redisTemplate.delete(CART_KEY);
    }
}

