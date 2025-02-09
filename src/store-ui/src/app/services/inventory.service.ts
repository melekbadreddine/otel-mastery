import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryItem } from '../models/inventory.model';
import { environment } from 'src/environments/environment';

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
}

