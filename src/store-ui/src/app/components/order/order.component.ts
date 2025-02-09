import { Component } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { Order } from 'src/app/models/order.model';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html'
})
export class OrderComponent {
  orderId: number | null = null;
  order: Order | null = null;

  constructor(private orderService: OrderService) { }

  getOrder(): void {
    if(this.orderId !== null) {
      this.orderService.getOrderById(this.orderId).subscribe({
        next: data => this.order = data,
        error: err => console.error(err)
      });
    }
  }
}

