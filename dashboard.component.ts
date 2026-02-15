import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../core/models/product.model';
import { InventoryService } from '../core/services/inventory.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="dashboard-container">
      <h1>Pharmacy Dashboard</h1>
      <div class="alerts-grid">
        <!-- Low Stock Alerts -->
        <div class="alert-card low-stock-card">
          <div class="card-header">
            <h3>Low Stock Alerts</h3>
            <span class="count-badge">{{ (lowStockProducts$ | async)?.length || 0 }}</span>
          </div>
          <div class="card-body">
            <div *ngIf="(lowStockProducts$ | async)?.length === 0" class="no-alerts">
              All products are well-stocked.
            </div>
            <ul *ngIf="(lowStockProducts$ | async)?.length > 0">
              <li *ngFor="let product of lowStockProducts$ | async">
                <span>{{ product.name }}</span>
                <span class="stock-details">
                  Stock: {{ product.stockQuantity }} (Min: {{ product.minStockLevel }})
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Expiring Soon Alerts -->
        <div class="alert-card expiring-card">
          <div class="card-header">
            <h3>Expiring Soon (Next 60 Days)</h3>
            <span class="count-badge">{{ (expiringProducts$ | async)?.length || 0 }}</span>
          </div>
          <div class="card-body">
            <div *ngIf="(expiringProducts$ | async)?.length === 0" class="no-alerts">
              No products are expiring soon.
            </div>
            <ul *ngIf="(expiringProducts$ | async)?.length > 0">
              <li *ngFor="let product of expiringProducts$ | async">
                <span>{{ product.name }}</span>
                <span class="expiry-details">
                  Expires: {{ product.expiryDate | date:'yyyy-MM-dd' }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 20px; background-color: #f4f7f6; }
    h1 { color: #2c3e50; margin-bottom: 20px; }
    .alerts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .alert-card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee; }
    .card-header h3 { margin: 0; font-size: 1.2em; color: #34495e; }
    .count-badge { padding: 4px 10px; border-radius: 12px; font-weight: bold; color: white; }
    .low-stock-card .count-badge { background-color: #e74c3c; }
    .expiring-card .count-badge { background-color: #f39c12; }
    .card-body { padding: 20px; }
    .no-alerts { color: #7f8c8d; text-align: center; padding: 20px 0; }
    .card-body ul { list-style: none; padding: 0; margin: 0; }
    .card-body li { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
    .card-body li:last-child { border-bottom: none; }
    .stock-details { font-weight: 500; color: #c0392b; }
    .expiry-details { font-weight: 500; color: #d35400; }
  `]
})
export class DashboardComponent implements OnInit {
    lowStockProducts$: Observable<Product[]>;
    expiringProducts$: Observable<Product[]>;
    private readonly EXPIRY_THRESHOLD_DAYS = 60;

    constructor(private inventoryService: InventoryService) {
        this.lowStockProducts$ = this.inventoryService.getLowStockProducts();
        this.expiringProducts$ = this.inventoryService.getExpiringProducts(this.EXPIRY_THRESHOLD_DAYS);
    }

    ngOnInit(): void { }
}