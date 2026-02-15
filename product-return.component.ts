import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../core/models/product.model';
import { InventoryService } from '../core/services/inventory.service';
import { NotificationService } from '../core/services/notification.service';

@Component({
    selector: 'app-product-return',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="return-container">
      <h2>Process Product Return</h2>

      <div class="search-section">
        <input
          type="text"
          placeholder="Search product by name or SKU..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="updateSearch()"
          class="search-input"
        >
      </div>

      <div class="product-selection-grid">
        <div *ngIf="(filteredProducts$ | async)?.length === 0 && searchTerm" class="no-results">
          No products found for "{{ searchTerm }}"
        </div>
        <div *ngIf="(filteredProducts$ | async)?.length === 0 && !searchTerm" class="no-results">
          Start typing to search for a product.
        </div>

        <div *ngFor="let product of filteredProducts$ | async" class="product-card">
          <div class="card-header">
            <h5>{{ product.name }}</h5>
            <span class="badge">{{ product.category }}</span>
          </div>
          <div class="card-body">
            <p class="generic-name">{{ product.genericName }}</p>
            <p class="sku">SKU: {{ product.sku }}</p>
            <p class="stock">Current Stock: {{ product.stockQuantity }}</p>
            <div class="return-input-group">
              <input
                type="number"
                min="1"
                [max]="product.stockQuantity"
                [(ngModel)]="returnQuantities[product.id]"
                placeholder="Qty"
                class="return-qty-input"
              >
              <button
                (click)="processReturn(product)"
                [disabled]="!returnQuantities[product.id] || returnQuantities[product.id] <= 0"
                class="return-btn"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .return-container { padding: 20px; max-width: 900px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2c3e50; margin-bottom: 25px; }
    .search-section { margin-bottom: 20px; }
    .search-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 1.1em; }
    .product-selection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .no-results { text-align: center; color: #888; padding: 30px; grid-column: 1 / -1; }
    .product-card { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; }
    .card-header h5 { margin: 0; font-size: 1.1em; color: #333; }
    .badge { background: #e0e0e0; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; color: #555; }
    .generic-name, .sku, .stock { color: #666; font-size: 0.9em; margin-bottom: 5px; }
    .return-input-group { display: flex; gap: 10px; margin-top: 15px; }
    .return-qty-input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 5px; font-size: 1em; }
    .return-btn { padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; transition: background-color 0.2s; }
    .return-btn:hover:not(:disabled) { background: #c0392b; }
    .return-btn:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class ProductReturnComponent implements OnInit {
    searchTerm: string = '';
    searchTermSubject = new BehaviorSubject<string>('');
    filteredProducts$: Observable<Product[]>;
    returnQuantities: { [productId: string]: number } = {};

    constructor(
        private inventoryService: InventoryService,
        private notificationService: NotificationService
    ) {
        this.filteredProducts$ = combineLatest([
            this.inventoryService.products$,
            this.searchTermSubject.asObservable()
        ]).pipe(
            map(([products, term]) => {
                const lowerTerm = term.toLowerCase();
                return products.filter(p =>
                    p.name.toLowerCase().includes(lowerTerm) ||
                    p.sku.toLowerCase().includes(lowerTerm)
                );
            })
        );
    }

    ngOnInit(): void { }

    updateSearch(): void {
        this.searchTermSubject.next(this.searchTerm);
    }

    processReturn(product: Product): void {
        const quantity = this.returnQuantities[product.id];
        if (quantity && quantity > 0) {
            const success = this.inventoryService.addStock(product.id, quantity);
            if (success) {
                this.notificationService.show(`Returned ${quantity} of ${product.name}. Stock updated.`, 'success');
                this.returnQuantities[product.id] = 0; // Reset quantity input
            } else {
                this.notificationService.show(`Failed to return ${product.name}. Product not found.`, 'error');
            }
        } else {
            this.notificationService.show('Please enter a valid quantity to return.', 'warning');
        }
    }
}