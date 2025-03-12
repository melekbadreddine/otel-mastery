import { Component, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { InventoryItem } from 'src/app/models/inventory.model';
import { ProductService } from 'src/app/services/product.service';
import { InventoryService } from 'src/app/services/inventory.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  products: Product[] = [];
  inventory: InventoryItem[] = [];
  
  // Form data for new product
  newProduct: Product = {
    name: '',
    description: '',
    price: 0,
    image_url: ''
  };

  // Form data for new inventory item
  newInventory: Partial<InventoryItem> = {
    productId: '',
    stock: 0
  };

  // For update operations
  editProduct: Product | null = null;
  editInventory: InventoryItem | null = null;

  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadInventory();
  }

  // Load data
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data: Product[]) => this.products = data,
      error: (error) => console.error('Error loading products', error)
    });
  }

  loadInventory(): void {
    this.inventoryService.getInventory().subscribe({
      next: (data: InventoryItem[]) => this.inventory = data,
      error: (error) => console.error('Error loading inventory', error)
    });
  }

  // Product CRUD operations
  addProduct(): void {
    this.productService.addProduct(this.newProduct).subscribe({
      next: (product) => {
        this.products.push(product);
        this.newProduct = { name: '', description: '', price: 0, image_url: '' };
      },
      error: (error) => console.error('Error adding product', error)
    });
  }

  updateProduct(): void {
    if (!this.editProduct || !this.editProduct.id) return;
    this.productService.updateProduct(this.editProduct).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }
        this.editProduct = null;
      },
      error: (error) => console.error('Error updating product', error)
    });
  }

  deleteProduct(id: string): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
      },
      error: (error) => console.error('Error deleting product', error)
    });
  }

  // Inventory CRUD operations
  addInventory(): void {
    if (!this.newInventory.productId) return;
    this.inventoryService.addInventory(this.newInventory as InventoryItem).subscribe({
      next: (item) => {
        this.inventory.push(item);
        this.newInventory = { productId: '', stock: 0 };
      },
      error: (error) => console.error('Error adding inventory item', error)
    });
  }

  updateInventory(): void {
    if (!this.editInventory) return;
    this.inventoryService.updateInventory(this.editInventory).subscribe({
      next: (updatedItem) => {
        const index = this.inventory.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) {
          this.inventory[index] = updatedItem;
        }
        this.editInventory = null;
      },
      error: (error) => console.error('Error updating inventory item', error)
    });
  }

  deleteInventory(id: number): void {
    this.inventoryService.deleteInventory(id).subscribe({
      next: () => {
        this.inventory = this.inventory.filter(i => i.id !== id);
      },
      error: (error) => console.error('Error deleting inventory item', error)
    });
  }

  // Helpers for editing
  startEditProduct(product: Product): void {
    this.editProduct = { ...product };
  }

  cancelEditProduct(): void {
    this.editProduct = null;
  }

  startEditInventory(item: InventoryItem): void {
    this.editInventory = { ...item };
  }

  cancelEditInventory(): void {
    this.editInventory = null;
  }
}
