import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Product } from '../core/models/product.model';
import { UserRole } from '../core/models/user.model';
import { HasRoleDirective } from '../core/directives/has-role.directive';
import { InventoryService } from '../core/services/inventory.service';
import { Router } from '@angular/router';
import { NotificationService } from '../core/services/notification.service';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, HasRoleDirective],
    template: `
    <div class="inventory-list-container">
      <h2>Product Inventory</h2>

      <div *ngIf="(products$ | async)?.length === 0" class="no-products">
        No products in inventory. Add some using the "Add Product" feature!
      </div>

      <div class="product-table-wrapper" *ngIf="(products$ | async)?.length > 0">
        <table class="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Generic Name</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Min Stock</th>
              <th>Selling Price</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products$ | async">
              <td>{{ product.name }}</td>
              <td>{{ product.genericName }}</td>
              <td>{{ product.sku }}</td>
              <td [class.low-stock]="product.stockQuantity <= product.minStockLevel">{{ product.stockQuantity }}</td>
              <td>{{ product.minStockLevel }}</td>
              <td>{{ product.sellingPrice | currency }}</td>
              <td>{{ product.expiryDate | date:'shortDate' }}</td>
              <td class="actions">
                <button class="edit-btn" (click)="onEditProduct(product.id)">Edit</button>
                <button class="delete-btn" *appHasRole="[UserRole.Admin]" (click)="onDeleteProduct(product.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    .inventory-list-container { padding: 20px; max-width: 1200px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2c3e50; margin-bottom: 25px; }
    .no-products { text-align: center; color: #888; padding: 40px; background: #f9f9f9; border-radius: 8px; }
    .product-table-wrapper { overflow-x: auto; }
    .product-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .product-table th, .product-table td { border: 1px solid #eee; padding: 12px 15px; text-align: left; }
    .product-table th { background-color: #f8f8f8; font-weight: 600; color: #333; }
    .product-table tbody tr:nth-child(even) { background-color: #fcfcfc; }
    .product-table tbody tr:hover { background-color: #f0f0f0; }
    .low-stock { color: #e74c3c; font-weight: bold; }
    .actions { white-space: nowrap; }
    .actions button { padding: 8px 12px; margin-right: 8px; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s; }
    .edit-btn { background-color: #3498db; color: white; }
    .edit-btn:hover { background-color: #2980b9; }
    .delete-btn { background-color: #e74c3c; color: white; }
    .delete-btn:hover { background-color: #c0392b; }
  `]
})
export class InventoryListComponent implements OnInit {
    products$: Observable<Product[]>;
    protected readonly UserRole = UserRole;

    constructor(
        private inventoryService: InventoryService,
        private router: Router,
        private notificationService: NotificationService
    ) {
        this.products$ = this.inventoryService.products$;
    }

    ngOnInit(): void { }

    onEditProduct(productId: string): void {
        this.router.navigate(['/inventory/edit', productId]);
    }

    onDeleteProduct(productId: string): void {
        if (confirm(`Are you sure you want to delete product with ID: ${productId}?`)) {
            this.inventoryService.deleteProduct(productId);
            this.notificationService.show('Product deleted successfully.', 'success');
        }
    }
}