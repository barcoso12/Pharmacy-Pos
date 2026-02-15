import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { InventoryService } from '../core/services/inventory.service';
import { Product } from '../core/models/product.model';
import { NotificationService } from '../core/services/notification.service';
import { Subscription } from 'rxjs';

// In a real application, you would likely use routing to get the product ID.
// For example, using ActivatedRoute from '@angular/router'.
// This component uses an @Input() for simplicity and reusability.

@Component({
    selector: 'app-edit-product',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="edit-product-container">
      <div *ngIf="product; else loading">
        <h2>Edit Product: {{ product.name }}</h2>
        <form #productForm="ngForm" (ngSubmit)="onSubmit(productForm)" class="product-form">
          
          <!-- Main Details -->
          <div class="form-section">
            <h4>Core Details</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Product Name</label>
                <input type="text" id="name" name="name" [(ngModel)]="product.name" required>
              </div>
              <div class="form-group">
                <label for="genericName">Generic Name</label>
                <input type="text" id="genericName" name="genericName" [(ngModel)]="product.genericName" required>
              </div>
              <div class="form-group">
                <label for="sku">SKU</label>
                <input type="text" id="sku" name="sku" [(ngModel)]="product.sku" required>
              </div>
              <div class="form-group">
                <label for="barcode">Barcode (UPC/EAN)</label>
                <input type="text" id="barcode" name="barcode" [(ngModel)]="product.barcode">
              </div>
              <div class="form-group full-width">
                <label for="description">Description</label>
                <textarea id="description" name="description" [(ngModel)]="product.description" rows="3"></textarea>
              </div>
            </div>
          </div>

          <!-- Pricing & Stock -->
          <div class="form-section">
            <h4>Pricing & Stock</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="costPrice">Cost Price</label>
                <input type="number" id="costPrice" name="costPrice" [(ngModel)]="product.costPrice" required min="0">
              </div>
              <div class="form-group">
                <label for="sellingPrice">Selling Price</label>
                <input type="number" id="sellingPrice" name="sellingPrice" [(ngModel)]="product.sellingPrice" required min="0">
              </div>
              <div class="form-group">
                <label for="taxRate">Tax Rate (%)</label>
                <input type="number" id="taxRate" name="taxRate" [(ngModel)]="product.taxRate" required min="0">
              </div>
              <div class="form-group">
                <label for="stockQuantity">Stock Quantity</label>
                <input type="number" id="stockQuantity" name="stockQuantity" [(ngModel)]="product.stockQuantity" required min="0">
              </div>
              <div class="form-group">
                <label for="minStockLevel">Min. Stock Level</label>
                <input type="number" id="minStockLevel" name="minStockLevel" [(ngModel)]="product.minStockLevel" required min="0">
              </div>
            </div>
          </div>

          <!-- Compliance -->
          <div class="form-section">
            <h4>Compliance & Category</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="batchNumber">Batch Number</label>
                <input type="text" id="batchNumber" name="batchNumber" [(ngModel)]="product.batchNumber" required>
              </div>
              <div class="form-group">
                <label for="expiryDate">Expiry Date</label>
                <input type="date" id="expiryDate" name="expiryDate" [(ngModel)]="expiryDateString" required>
              </div>
              <div class="form-group">
                <label for="category">Category</label>
                <select id="category" name="category" [(ngModel)]="product.category" required>
                  <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                </select>
              </div>
              <div class="form-group checkbox-group">
                <input type="checkbox" id="requiresPrescription" name="requiresPrescription" [(ngModel)]="product.requiresPrescription">
                <label for="requiresPrescription">Requires Prescription</label>
              </div>
            </div>
          </div>

          <button type="submit" class="submit-btn" [disabled]="productForm.invalid">Update Product</button>
        </form>
      </div>
      <ng-template #loading>
        <p>Loading product details...</p>
      </ng-template>
    </div>
  `,
    styles: [`
    .edit-product-container { padding: 20px; max-width: 1000px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2c3e50; margin-bottom: 25px; }
    .form-section { margin-bottom: 25px; border-top: 1px solid #eee; padding-top: 20px; }
    .form-section h4 { color: #34495e; margin-bottom: 15px; font-size: 1.2em; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { margin-bottom: 8px; font-weight: 500; color: #555; font-size: 0.9em; }
    .form-group input, .form-group textarea, .form-group select { padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 1em; transition: border-color 0.2s; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #2ecc71; outline: none; }
    .checkbox-group { flex-direction: row; align-items: center; gap: 10px; margin-top: auto; }
    .submit-btn { width: 100%; padding: 15px; background: #2ecc71; color: white; border: none; border-radius: 5px; font-size: 1.2em; cursor: pointer; transition: background-color 0.2s; }
    .submit-btn:hover { background: #27ae60; }
    .submit-btn:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class EditProductComponent implements OnInit, OnDestroy {
    @Input() productId!: string;

    product: Product | null = null;
    private productSubscription?: Subscription;
    expiryDateString: string = '';
    categories: Product['category'][] = ['Medicine', 'Supplement', 'Equipment', 'Other'];

    constructor(
        private inventoryService: InventoryService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        if (this.productId) {
            this.productSubscription = this.inventoryService.getProductById(this.productId).subscribe(p => {
                if (p) {
                    // Create a copy to avoid direct mutation on the service's state via ngModel
                    this.product = { ...p };
                    this.expiryDateString = this.formatDateToISO(new Date(p.expiryDate));
                } else {
                    this.notificationService.show(`Product with ID ${this.productId} not found.`, 'error');
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.productSubscription?.unsubscribe();
    }

    onSubmit(form: NgForm): void {
        if (form.invalid || !this.product) {
            this.notificationService.show('Please fill all required fields correctly.', 'error');
            return;
        }

        // The product object is already updated by ngModel, just need to handle the date
        const productToUpdate: Product = {
            ...this.product,
            expiryDate: new Date(this.expiryDateString)
        };

        this.inventoryService.updateProduct(productToUpdate);
        this.notificationService.show(`Product "${productToUpdate.name}" updated successfully!`, 'success');
    }

    private formatDateToISO(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}