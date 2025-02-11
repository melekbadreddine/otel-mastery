import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cart } from '../models/cart.model';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = environment.apiUrls.shoppingCart;

  constructor(private http: HttpClient) { }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.baseUrl}/cart`);
  }

  addItem(productId: string, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart/items`, { productId, quantity });
  }

  updateItem(productId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/cart/items`, { productId, quantity });
  }

  removeItem(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/cart/items/${productId}`);
  }

  checkout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/checkout`, {}, { responseType: 'text' });
  }
}

