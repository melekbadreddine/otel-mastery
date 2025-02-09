import { Component, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { ProductService } from 'src/app/services/product.service';
import { CartService } from 'src/app/services/cart.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  searchQuery: string = '';

  constructor(private productService: ProductService, private cartService: CartService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data: Product[]) => {
        console.log('Loaded products:', data);
        this.products = data;
      },
      error: (error) => console.error('Error loading products', error),
    });
  }

  searchProducts(): void {
    if (this.searchQuery.trim()) {
      this.productService.searchProducts(this.searchQuery).subscribe({
        next: (data: Product[]) => {
          console.log('Search results:', data);
          this.products = data;
        },
        error: (error) => console.error('Error searching products', error),
      });
    } else {
      this.loadProducts();
    }
  }

  addToCart(product: Product): void {
    if (product.id) {
      this.cartService.addItem(product.id, 1).subscribe({
        next: () => alert(`Added "${product.name}" to cart.`),
        error: (error) => console.error('Error adding to cart', error)
      });
    }
  }
}

