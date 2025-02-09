import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = environment.apiUrls.orderProcessing;

  constructor(private http: HttpClient) { }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }

  getOrderByOrderNumber(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/orderNumber/${orderNumber}`);
  }
}

