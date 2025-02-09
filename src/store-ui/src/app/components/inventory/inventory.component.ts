import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { InventoryItem } from 'src/app/models/inventory.model';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.getInventory();
  }

  getInventory(): void {
    this.inventoryService.getInventory().subscribe({
      next: data => this.inventory = data,
      error: err => console.error(err)
    });
  }
}

