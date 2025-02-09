// app.component.ts
import { Component, OnInit } from '@angular/core';
import { CartService } from './services/cart.service';
import { Cart } from './models/cart.model';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'ModernStore';
  cartItemCount: number = 0;
  
  // Add navLinks array
  navLinks = [
    { path: '/products', label: 'Products', icon: 'fas fa-th-large' },
    { path: '/orders', label: 'Orders', icon: 'fas fa-box-open' },
    { path: '/inventory', label: 'Inventory', icon: 'fas fa-warehouse' }
  ];

  constructor(
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // Add isActive method
  isActive(path: string): boolean {
    return this.router.url === path;
  }

  ngOnInit(): void {
    this.refreshCartCount();
  }

  refreshCartCount(): void {
    this.cartService.getCart().subscribe({
      next: (cart: Cart) => this.cartItemCount = cart.items.length,
      error: err => console.error(err)
    });
  }
}