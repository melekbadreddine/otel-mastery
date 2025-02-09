package com.ecommerce.cart.controller;

import com.ecommerce.cart.model.Cart;
import com.ecommerce.cart.model.CartItem;
import com.ecommerce.cart.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    // Retrieve the cart.
    @GetMapping
    public ResponseEntity<Cart> getCart() {
        Cart cart = cartService.getCart();
        return ResponseEntity.ok(cart);
    }
    
    // Add an item to the cart.
    @PostMapping("/items")
    public ResponseEntity<Cart> addItem(@RequestBody CartItem item) {
        Cart cart = cartService.addItem(item);
        return ResponseEntity.ok(cart);
    }
    
    // Update an item in the cart.
    @PutMapping("/items")
    public ResponseEntity<Cart> updateItem(@RequestBody CartItem item) {
        Cart cart = cartService.updateItem(item);
        return ResponseEntity.ok(cart);
    }
    
    // Remove an item from the cart.
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Cart> removeItem(@PathVariable String productId) {
        Cart cart = cartService.removeItem(productId);
        return ResponseEntity.ok(cart);
    }
    
    // Initiate checkout for the cart.
    @PostMapping("/checkout")
    public ResponseEntity<String> checkout() {
        cartService.checkout();
        return ResponseEntity.ok("Checkout initiated");
    }
}

