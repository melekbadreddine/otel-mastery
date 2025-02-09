import { Component, OnInit } from '@angular/core';
import { CartService } from 'src/app/services/cart.service';
import { Cart } from 'src/app/models/cart.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  cart: Cart = { items: [] };
  loading: boolean = false;
  error: string | null = null;

  constructor(private cartService: CartService) { }

  ngOnInit(): void {
    this.getCart();
  }

  getCart(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cart = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load cart';
        this.loading = false;
        console.error(err);
      }
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.cartService.updateItem(productId, quantity).subscribe({
      next: (data) => {
        this.cart = data;
      },
      error: (err) => console.error(err)
    });
  }

  removeItem(productId: string): void {
    this.cartService.removeItem(productId).subscribe({
      next: (data) => {
        this.cart = data;
      },
      error: (err) => console.error(err)
    });
  }

  checkout(): void {
    this.cartService.checkout().subscribe({
      next: () => {
        this.cart = { items: [] };
        // Show success message
        const message = document.createElement('div');
        message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
        message.textContent = 'Checkout successful!';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      },
      error: (err) => {
        // Show error message
        const message = document.createElement('div');
        message.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
        message.textContent = 'Checkout failed. Please try again.';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
        console.error(err);
      }
    });
  }
}
