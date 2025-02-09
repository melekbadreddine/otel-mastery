import { Component, OnInit } from '@angular/core';
import { CartService } from './services/cart.service';
import { Cart } from './models/cart.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'Store UI';
  cartItemCount: number = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.refreshCartCount();
    // Optionally, refresh periodically or subscribe to cart changes.
  }

  refreshCartCount(): void {
    this.cartService.getCart().subscribe({
      next: (cart: Cart) => this.cartItemCount = cart.items.length,
      error: err => console.error(err)
    });
  }
}

