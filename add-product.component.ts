import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { InventoryService } from '../core/services/inventory.service';
import { Product } from '../core/models/product.model';
import { SettingsService } from '../core/services/settings.service';
import { NotificationService } from '../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-add-product',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="add-product-container">
      <h2>Add New Product to Inventory</h2>
      <form #productForm="ngForm" (ngSubmit)="onSubmit(productForm)" class="product-form">
        
        <!-- Main Details -->
        <div class="form-section">
          <h4>Core Details</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Product Name</label>
              <input type="text" id="name" name="name" [(ngModel)]="newProduct.name" required>
            </div>
            <div class="form-group">
              <label for="genericName">Generic Name</label>
              <input type="text" id="genericName" name="genericName" [(ngModel)]="newProduct.genericName" required>
            </div>
            <div class="form-group">
              <label for="sku">SKU</label>
              <input type="text" id="sku" name="sku" [(ngModel)]="newProduct.sku" required>
            </div>
            <div class="form-group">
              <label for="barcode">Barcode (UPC/EAN)</label>
              <input type="text" id="barcode" name="barcode" [(ngModel)]="newProduct.barcode">
            </div>
            <div class="form-group full-width">
              <label for="description">Description</label>
              <textarea id="description" name="description" [(ngModel)]="newProduct.description" rows="3"></textarea>
            </div>
          </div>
        </div>

        <!-- Pricing & Stock -->
        <div class="form-section">
          <h4>Pricing & Stock</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="costPrice">Cost Price</label>
              <input type="number" id="costPrice" name="costPrice" [(ngModel)]="newProduct.costPrice" required min="0">
            </div>
            <div class="form-group">
              <label for="sellingPrice">Selling Price</label>
              <input type="number" id="sellingPrice" name="sellingPrice" [(ngModel)]="newProduct.sellingPrice" required min="0">
            </div>
            <div class="form-group">
              <label for="taxRate">Tax Rate (%)</label>
              <input type="number" id="taxRate" name="taxRate" [(ngModel)]="newProduct.taxRate" required min="0">
            </div>
            <div class="form-group">
              <label for="stockQuantity">Initial Stock Quantity</label>
              <input type="number" id="stockQuantity" name="stockQuantity" [(ngModel)]="newProduct.stockQuantity" required min="0">
            </div>
            <div class="form-group">
              <label for="minStockLevel">Min. Stock Level</label>
              <input type="number" id="minStockLevel" name="minStockLevel" [(ngModel)]="newProduct.minStockLevel" required min="0">
            </div>
          </div>
        </div>

        <!-- Compliance -->
        <div class="form-section">
          <h4>Compliance & Category</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="batchNumber">Batch Number</label>
              <input type="text" id="batchNumber" name="batchNumber" [(ngModel)]="newProduct.batchNumber" required>
            </div>
            <div class="form-group">
              <label for="expiryDate">Expiry Date</label>
              <input type="date" id="expiryDate" name="expiryDate" [(ngModel)]="expiryDateString" required>
            </div>
            <div class="form-group">
              <label for="category">Category</label>
              <select id="category" name="category" [(ngModel)]="newProduct.category" required>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="requiresPrescription" name="requiresPrescription" [(ngModel)]="newProduct.requiresPrescription">
              <label for="requiresPrescription">Requires Prescription</label>
            </div>
          </div>
        </div>

        <button type="submit" class="submit-btn" [disabled]="productForm.invalid">Add Product</button>
      </form>
    </div>
  `,
    styles: [`
    .add-product-container { padding: 20px; max-width: 1000px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
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
export class AddProductComponent implements OnInit, OnDestroy {
    newProduct: Omit<Product, 'id' | 'expiryDate'> & { expiryDate?: Date };
    expiryDateString: string;
    readonly categories: Product['category'][] = ['Medicine', 'Supplement', 'Equipment', 'Other'];
    private settingsSubscription?: Subscription;
    private defaultTaxRate = 0;

    constructor(
        private inventoryService: InventoryService,
        private settingsService: SettingsService,
        private notificationService: NotificationService
    ) {
        this.newProduct = this.getInitialProductState();
        this.expiryDateString = this.formatDateToISO(new Date());
    }

    ngOnInit(): void {
        this.settingsSubscription = this.settingsService.settings$.subscribe(settings => {
            this.defaultTaxRate = settings.defaultTaxRate;
            this.newProduct.taxRate = settings.defaultTaxRate;
        });
    }

    ngOnDestroy(): void {
        this.settingsSubscription?.unsubscribe();
    }

    onSubmit(form: NgForm): void {
        if (form.invalid) {
            this.notificationService.show('Please fill all required fields correctly.', 'error');
            return;
        }

        const productToAdd: Product = {
            ...this.newProduct,
            id: `prod_${Date.now()}`, // Simple unique ID generation
            expiryDate: new Date(this.expiryDateString)
        };

        this.inventoryService.addProduct(productToAdd);
        this.notificationService.show(`Product "${productToAdd.name}" added successfully!`, 'success');
        form.resetForm();
        this.newProduct = this.getInitialProductState();
        this.expiryDateString = this.formatDateToISO(new Date());
    }

    private getInitialProductState() {
        return {
            name: '', genericName: '', sku: '', barcode: '', description: '',
            costPrice: 0, sellingPrice: 0, taxRate: 0, stockQuantity: 0,
            minStockLevel: 10, batchNumber: '', requiresPrescription: false, category: 'Medicine' as const
        };
    }

    private formatDateToISO(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}