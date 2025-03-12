import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryItem } from '../models/inventory.model';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = environment.apiUrls.inventoryManagement;

  constructor(private http: HttpClient) { }

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.baseUrl}/inventory`);
  }

  getInventoryByProduct(productId: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.baseUrl}/inventory/${productId}`);
  }

  addInventory(item: InventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.baseUrl}/inventory`, item);
  }

  updateInventory(item: InventoryItem): Observable<InventoryItem> {
    if (!item.id) {
      throw new Error("Inventory item ID is required");
    }
    return this.http.put<InventoryItem>(`${this.baseUrl}/inventory/${item.id}`, item);
  }

  deleteInventory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/inventory/${id}`);
  }
}

