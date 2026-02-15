import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { InventoryService } from '../core/services/inventory.service';
import { Product } from '../core/models/product.model';
import { CartItem } from '../core/models/cart-item.model';
import { TransactionService } from '../core/services/transaction.service';
import { Transaction, SuspendedSale, Payment, PaymentMethod } from '../core/models/transaction.model';
import { Customer } from '../core/models/customer.model';
import { UserRole } from '../core/models/user.model';
import { HasRoleDirective } from '../core/directives/has-role.directive';
import { SettingsService } from '../core/services/settings.service';
import { AppSettings } from '../core/models/settings.model';
import { CustomerService } from '../core/services/customer.service';
import { NotificationService } from '../core/services/notification.service';
import { BarcodeScannerService } from '../core/services/barcode-scanner.service';
import { ReceiptService } from '../core/services/receipt.service';
import { SalesService } from '../core/services/sales.service';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, HasRoleDirective],
    template: `
    <div class="pos-container">
      <div class="pos-header" *ngIf="settings$ | async as settings">
        <h1>{{ settings.pharmacyName }}</h1>
        <h2>Point of Sale</h2>
      </div>

      <div class="pos-main-content">
        <!-- Product Catalog -->
        <div class="catalog-section">
          <h3>Product Catalog</h3>
          <div class="search-container">
          <input 
            #searchInput
            type="text" 
            placeholder="Search by name or generic name..." 
            (input)="updateSearch(searchInput.value)"
            class="search-input"
          >
          </div>
          <div class="product-grid">
          <div *ngFor="let product of products$ | async" class="product-card">
            <div class="card-header">
              <h5>{{ product.name }}</h5>
              <span class="badge">{{ product.category }}</span>
            </div>
            <div class="card-body">
              <p class="generic-name">{{ product.genericName }}</p>
              <p class="price">{{ product.sellingPrice | currency }}</p>
              <p class="stock" [class.low-stock]="product.stockQuantity < product.minStockLevel">
                Stock: {{ product.stockQuantity }}
              </p>
              <button 
                (click)="addToCart(product)" 
                [disabled]="product.stockQuantity === 0">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        </div>

        <!-- Customer Section -->
        <div class="customer-section-wrapper">
          <div class="customer-section-header">
              <div *ngIf="selectedCustomer" class="selected-customer-info">
                  <span>Customer: <strong>{{ selectedCustomer.name }}</strong></span>
                  <button (click)="clearCustomer()" class="clear-customer-btn">&times;</button>
              </div>
              <button *ngIf="!selectedCustomer" (click)="showCustomerSearch = !showCustomerSearch" class="add-customer-btn">
                  {{ showCustomerSearch ? 'Cancel' : '+ Add Customer' }}
              </button>
          </div>
          <div *ngIf="showCustomerSearch" class="customer-search-flyout">
              <input type="text" placeholder="Search or add new customer..." #customerSearchInput (input)="customerSearchTerm$.next(customerSearchInput.value)" class="customer-search-input">
              <div class="customer-list">
                  <div *ngFor="let cust of filteredCustomers$ | async" (click)="selectCustomer(cust)" class="customer-list-item">
                      {{ cust.name }} <span *ngIf="cust.phone">({{ cust.phone }})</span>
                  </div>
                  <div *ngIf="(filteredCustomers$ | async)?.length === 0 && customerSearchInput.value" class="customer-list-item add-new" (click)="addNewCustomer(customerSearchInput.value)">
                      + Add new customer: "{{ customerSearchInput.value }}"
                  </div>
              </div>
          </div>
        </div>
        <!-- Shopping Cart -->
        <div class="cart-section">
          <h3>Current Sale</h3>
        <div class="cart-items">
          <div *ngFor="let item of cart" class="cart-item">
            <div class="item-details">
              <span class="item-name">{{ item.product.name }}</span>
              <div class="qty-control-group">
                <span class="item-price">{{ item.product.sellingPrice | currency }}</span>
                <div class="qty-inputs">
                  <button (click)="updateQuantity(item, -1)" class="qty-btn">-</button>
                  <input type="number" [ngModel]="item.quantity" (ngModelChange)="setQuantity(item, $event)" class="qty-input">
                  <button (click)="updateQuantity(item, 1)" class="qty-btn">+</button>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <span class="item-total">{{ item.product.sellingPrice * item.quantity | currency }}</span>
              <button (click)="removeFromCart(item)" class="remove-btn">&times;</button>
            </div>
          </div>
          <div *ngIf="cart.length === 0" class="empty-cart">
            Cart is empty
          </div>
        </div>
        
        <div class="cart-footer">
          <!-- Discount UI -->
          <div *ngIf="showDiscountInput" class="discount-input-section">
            <div class="discount-controls">
                <input #discountInput type="number" placeholder="Amount" class="discount-value-input" min="0">
                <select #discountTypeSelect [(ngModel)]="discountType" class="discount-type-select">
                    <option value="percentage">%</option>
                    <option value="fixed">$</option>
                </select>
            </div>
            <div class="discount-actions">
                <button (click)="applyDiscount(discountInput.valueAsNumber, discountTypeSelect.value)" class="apply-btn">Apply</button>
                <button (click)="showDiscountInput = false" class="cancel-btn">Cancel</button>
            </div>
          </div>

          <!-- Coupon UI -->
          <div class="coupon-section" *ngIf="cart.length > 0">
            <div *ngIf="!appliedCoupon" class="coupon-input-group">
                <input type="text" [(ngModel)]="couponCode" placeholder="Coupon Code" class="coupon-input" (keyup.enter)="applyCoupon()">
                <button (click)="applyCoupon()" [disabled]="!couponCode" class="apply-coupon-btn">Apply</button>
            </div>
            <div *ngIf="appliedCoupon" class="applied-coupon-info">
                <span>Coupon: <strong>{{ appliedCoupon.code }}</strong> (-{{ appliedCoupon.amount | currency }})</span>
                <button (click)="removeCoupon()" class="remove-coupon-btn">&times;</button>
            </div>
          </div>

          <div class="action-buttons">
            <button class="suspend-btn" (click)="suspendSale()" [disabled]="cart.length === 0">Suspend</button>
            <button class="recall-btn" (click)="showSuspendedSales = true">Recall ({{ (suspendedSales$ | async)?.length || 0 }})</button>
          </div>

          <!-- Summary -->
          <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ subtotal | currency }}</span>
          </div>

          <div *ngIf="discount > 0" class="summary-row discount-row">
              <span>Discount ({{ discountType === 'percentage' ? discount + '%' : (discount | currency) }})</span>
              <div class="discount-details">
                <span class="discount-amount">- {{ discountAmount | currency }}</span>
                <button *appHasRole="[UserRole.Admin, UserRole.Pharmacist]" (click)="removeDiscount()" class="remove-discount-btn">&times;</button>
              </div>
          </div>

          <div *ngIf="appliedCoupon" class="summary-row discount-row">
              <span>Coupon Discount</span>
              <span class="discount-amount">- {{ appliedCoupon.amount | currency }}</span>
          </div>

          <div *ngIf="!showDiscountInput && discount === 0 && cart.length > 0" class="add-discount-row">
              <button *appHasRole="[UserRole.Admin, UserRole.Pharmacist]" (click)="showDiscountInput = true" class="add-discount-btn">+ Add Discount</button>
          </div>

          <div class="total-row">
            <span>Total</span>
            <span class="total-amount">{{ total | currency }}</span>
          </div>

          <button 
            class="checkout-btn" 
            (click)="processSale()" 
            [disabled]="cart.length === 0">
            Proceed to Payment
          </button>
        </div>
        </div>
      </div>

      <!-- Suspended Sales Modal -->
      <div class="suspended-sales-modal" *ngIf="showSuspendedSales">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Suspended Sales</h3>
            <button class="close-modal-btn" (click)="showSuspendedSales = false">&times;</button>
          </div>
          <div class="suspended-list">
            <div *ngIf="(suspendedSales$ | async)?.length === 0" class="no-data">No suspended sales.</div>
            <div *ngFor="let sale of suspendedSales$ | async" class="suspended-item">
              <div class="suspended-info">
                <div><strong>{{ sale.date | date:'medium' }}</strong></div>
                <div>{{ sale.items.length }} items - {{ sale.totalAmount | currency }}</div>
                <div *ngIf="sale.note" class="note">{{ sale.note }}</div>
              </div>
              <div class="suspended-actions">
                <button class="resume-btn" (click)="resumeSale(sale)">Resume</button>
                <button class="delete-btn" *appHasRole="[UserRole.Admin, UserRole.Pharmacist]" (click)="deleteSuspendedSale(sale.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Modal -->
      <div class="payment-modal" *ngIf="showPaymentModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Process Payment</h3>
            <button class="close-modal-btn" (click)="cancelPayment()">&times;</button>
          </div>
          <div class="payment-body">
            <div class="payment-summary-grid">
              <div class="summary-item">
                <span>Total Due</span>
                <strong class="total-due">{{ total | currency }}</strong>
              </div>
              <div class="summary-item">
                <span>Amount Paid</span>
                <strong class="amount-paid">{{ totalPaid | currency }}</strong>
              </div>
              <div class="summary-item remaining">
                <span>Remaining</span>
                <strong class="amount-remaining">{{ amountRemaining | currency }}</strong>
              </div>
            </div>

            <div class="payments-list">
              <div *ngFor="let p of payments; let i = index" class="payment-item">
                <span>{{ p.method }}: {{ p.amount | currency }}</span>
                <button (click)="removePayment(i)" class="remove-btn">&times;</button>
              </div>
            </div>

            <div class="add-payment-section" *ngIf="amountRemaining > 0">
              <select [(ngModel)]="selectedPaymentMethod" class="payment-method-select">
                <option *ngFor="let opt of paymentOptions" [value]="opt">{{ opt }}</option>
              </select>
              <input type="number" [placeholder]="'Amount (or leave blank for ' + (amountRemaining | currency) + ')'" [(ngModel)]="paymentAmountInput" (keyup.enter)="addPayment()" class="payment-amount-input">
              <button (click)="addPayment()" class="add-payment-btn">Add</button>
            </div>

            <div *ngIf="changeDue > 0" class="change-due">
              Change Due: <strong>{{ changeDue | currency }}</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="cancelPayment()" class="cancel-btn">Cancel</button>
            <button (click)="confirmPayment()" [disabled]="amountRemaining > 0" class="confirm-btn">Confirm Payment</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .pos-container { display: flex; flex-direction: column; height: 100vh; padding: 20px; background-color: #f5f5f5; gap: 20px; }
    .pos-header { text-align: center; flex-shrink: 0; }
    .pos-header h1 { margin: 0; color: #2c3e50; font-size: 2em; }
    .pos-header h2 { margin: 0 0 10px; color: #7f8c8d; font-weight: 300; font-size: 1.2em; }
    .pos-main-content { display: flex; flex: 1; gap: 20px; overflow: hidden; }
    .catalog-section { flex: 2; display: flex; flex-direction: column; overflow-y: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .search-container { margin-bottom: 15px; }
    .search-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em; }
    .cart-section { flex: 1; background: white; padding: 20px; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .catalog-section h3, .cart-section h3 { margin-top: 0; color: #34495e; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
    .product-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
    .customer-section-wrapper { background: white; padding: 10px 20px; border-radius: 8px 8px 0 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-bottom: 1px solid #eee; position: relative; }
    .customer-section-header { display: flex; align-items: center; justify-content: space-between; }
    .selected-customer-info { font-size: 1.1em; }
    .clear-customer-btn { background: none; border: none; color: #e74c3c; font-size: 1.5em; cursor: pointer; }
    .add-customer-btn { background: none; border: none; color: #3498db; font-size: 1em; cursor: pointer; }
    .customer-search-flyout { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-top: none; z-index: 100; box-shadow: 0 5px 10px rgba(0,0,0,0.1); border-radius: 0 0 8px 8px; }
    .customer-search-input { width: 100%; padding: 10px; border: none; border-bottom: 1px solid #eee; font-size: 1em; }
    .customer-list { max-height: 200px; overflow-y: auto; }
    .customer-list-item { padding: 10px; cursor: pointer; }
    .customer-list-item:hover { background: #f5f5f5; }
    .customer-list-item.add-new { color: #27ae60; font-weight: bold; }
    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; }
    .card-header h5 { margin: 0; font-size: 1.1em; }
    .badge { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; }
    .generic-name { color: #666; font-size: 0.9em; margin-bottom: 5px; }
    .price { font-weight: bold; font-size: 1.2em; color: #2c3e50; }
    .stock { font-size: 0.9em; }
    .low-stock { color: #d32f2f; font-weight: bold; }
    .cart-items { flex: 1; overflow-y: auto; margin-bottom: 20px; padding-top: 10px; }
    .cart-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .item-details { display: flex; flex-direction: column; }
    .qty-control-group { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
    .qty-inputs { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
    .qty-btn { background: #f0f0f0; border: none; padding: 5px 10px; cursor: pointer; font-weight: bold; }
    .qty-btn:hover { background: #e0e0e0; }
    .qty-input { width: 40px; text-align: center; border: none; border-left: 1px solid #ddd; border-right: 1px solid #ddd; padding: 5px 0; -moz-appearance: textfield; }
    .qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .item-name { font-weight: 500; }
    .item-price { font-size: 0.85em; color: #666; }
    .item-actions { display: flex; align-items: center; gap: 10px; }
    .remove-btn { background: none; border: none; color: #ff4444; font-size: 1.2em; cursor: pointer; }
    .cart-footer { border-top: 2px solid #eee; padding-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .summary-row, .total-row { display: flex; justify-content: space-between; align-items: center; }
    .summary-row { font-size: 1em; color: #555; }
    .discount-row { color: #27ae60; }
    .discount-details { display: flex; align-items: center; gap: 5px; }
    .discount-amount { font-weight: 500; }
    .remove-discount-btn { background: none; border: none; color: #e74c3c; font-size: 1.4em; cursor: pointer; padding: 0 5px; line-height: 1; }
    .add-discount-row { text-align: left; }
    .add-discount-btn { background: none; border: none; color: #3498db; cursor: pointer; font-size: 0.9em; padding: 0; }
    .add-discount-btn:hover { text-decoration: underline; }
    .discount-input-section { background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 5px; display: flex; flex-direction: column; gap: 10px; }
    .discount-controls { display: flex; gap: 5px; }
    .discount-value-input { flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .discount-type-select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: white; }
    .discount-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .discount-actions button { padding: 5px 15px; border-radius: 4px; border: none; cursor: pointer; }
    .apply-btn { background-color: #2ecc71; color: white; }
    .cancel-btn { background-color: #bdc3c7; color: white; }
    .coupon-section { margin-bottom: 10px; padding: 10px; background: #e8f6f3; border-radius: 5px; border: 1px dashed #2ecc71; }
    .coupon-input-group { display: flex; gap: 5px; }
    .coupon-input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .apply-coupon-btn { background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
    .applied-coupon-info { display: flex; justify-content: space-between; align-items: center; color: #27ae60; }
    .remove-coupon-btn { background: none; border: none; color: #e74c3c; font-size: 1.4em; cursor: pointer; padding: 0 5px; line-height: 1; }
    .total-row { font-size: 1.5em; font-weight: bold; margin-top: 5px; border-top: 1px solid #eee; padding-top: 10px; }
    .checkout-btn { width: 100%; padding: 15px; background: #2ecc71; color: white; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer; }
    .checkout-btn:disabled { background: #ccc; cursor: not-allowed; }
    .action-buttons { display: flex; gap: 10px; margin-bottom: 10px; }
    .suspend-btn { flex: 1; padding: 10px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .recall-btn { flex: 1; padding: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .suspended-sales-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 20px; border-radius: 8px; width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .modal-header h3 { margin: 0; color: #2c3e50; }
    .close-modal-btn { background: none; border: none; font-size: 1.5em; cursor: pointer; color: #7f8c8d; }
    .suspended-item { border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; }
    .suspended-info { font-size: 0.9em; color: #555; }
    .suspended-info strong { color: #2c3e50; }
    .note { font-style: italic; color: #7f8c8d; font-size: 0.85em; margin-top: 2px; }
    .suspended-actions { display: flex; gap: 5px; }
    .resume-btn { padding: 5px 10px; background: #2ecc71; color: white; border: none; border-radius: 3px; cursor: pointer; }
    .delete-btn { padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; }
    .no-data { text-align: center; color: #999; padding: 20px; }
    .payment-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .payment-body { padding: 20px 0; }
    .payment-summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; text-align: center; }
    .summary-item { background: #f9f9f9; padding: 10px; border-radius: 5px; }
    .summary-item span { display: block; font-size: 0.9em; color: #555; }
    .summary-item strong { display: block; font-size: 1.4em; font-weight: 600; }
    .total-due { color: #2c3e50; }
    .amount-paid { color: #27ae60; }
    .remaining .amount-remaining { color: #e74c3c; }
    .payments-list { margin-bottom: 20px; }
    .payment-item { display: flex; justify-content: space-between; align-items: center; background: #ecf0f1; padding: 8px 12px; border-radius: 4px; margin-bottom: 5px; }
    .add-payment-section { display: flex; gap: 10px; margin-bottom: 20px; }
    .payment-method-select { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .payment-amount-input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .add-payment-btn { padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .change-due { font-size: 1.2em; text-align: center; color: #2ecc71; background: #e8f8f5; padding: 10px; border-radius: 5px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eee; padding-top: 15px; }
    .modal-footer button { padding: 10px 20px; border-radius: 5px; border: none; cursor: pointer; font-weight: bold; }
    .modal-footer .cancel-btn { background: #bdc3c7; color: white; }
    .modal-footer .confirm-btn { background: #2ecc71; color: white; }
    .modal-footer .confirm-btn:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class PosComponent implements OnInit, OnDestroy {
    searchTerm$ = new BehaviorSubject<string>('');
    settings$: Observable<AppSettings>;
    suspendedSales$: Observable<SuspendedSale[]>;
    protected readonly UserRole = UserRole;

    products$ = combineLatest([
        this.inventoryService.products$, this.searchTerm$
    ]).pipe(
        map(([products, term]) => {
            const lowerTerm = term.toLowerCase();
            return products.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                p.genericName.toLowerCase().includes(lowerTerm) ||
                p.barcode === term
            );


        })
    );

    cart: CartItem[] = [];
    total = 0;
    subtotal = 0;
    discount = 0;
    discountType: 'percentage' | 'fixed' = 'percentage';
    discountAmount = 0;
    showDiscountInput = false;
    couponCode = '';
    appliedCoupon: { code: string; amount: number } | null = null;
    showSuspendedSales = false;
    currentSettings: AppSettings | null = null;

    // Customer state
    customers$: Observable<Customer[]>;
    customerSearchTerm$ = new BehaviorSubject<string>('');
    filteredCustomers$: Observable<Customer[]>;
    selectedCustomer: Customer | null = null;
    showCustomerSearch = false;

    // Payment Modal State
    showPaymentModal = false;
    payments: Payment[] = [];
    paymentAmountInput: number | null = null;
    selectedPaymentMethod: PaymentMethod = 'Cash';
    readonly paymentOptions: PaymentMethod[] = ['Cash', 'Card', 'GCash', 'Maya'];

    private barcodeSubscription?: Subscription;


    constructor(
        private inventoryService: InventoryService,
        private transactionService: TransactionService,
        private settingsService: SettingsService,
        private customerService: CustomerService,
        private notificationService: NotificationService,
        private barcodeScannerService: BarcodeScannerService,
        private receiptService: ReceiptService,
        private salesService: SalesService
    ) {
        this.settings$ = this.settingsService.settings$;
        this.suspendedSales$ = this.transactionService.suspendedSales$;
        this.customers$ = this.customerService.customers$;

        this.filteredCustomers$ = combineLatest([
            this.customers$,
            this.customerSearchTerm$
        ]).pipe(
            map(([customers, term]) => {
                if (!term) return customers;
                const lowerTerm = term.toLowerCase();
                return customers.filter(c => c.name.toLowerCase().includes(lowerTerm));
            })
        );
    }

    ngOnInit(): void {
        this.settings$.subscribe(settings => this.currentSettings = settings);
        this.barcodeSubscription = this.barcodeScannerService.productScanned$.subscribe(product => {
            this.addToCart(product);
        });
    }

    ngOnDestroy(): void {
        this.barcodeSubscription?.unsubscribe();
    }

    get totalPaid(): number {
        return this.payments.reduce((sum, p) => sum + p.amount, 0);
    }

    get amountRemaining(): number {
        // Use a small epsilon to handle floating point inaccuracies
        const remaining = this.total - this.totalPaid;
        return remaining < 1e-9 ? 0 : remaining;
    }

    get changeDue(): number {
        if (this.amountRemaining > 0) return 0;

        const totalNonCashPaid = this.payments
            .filter(p => p.method !== 'Cash')
            .reduce((sum, p) => sum + p.amount, 0);
        
        const totalCashPaid = this.payments
            .filter(p => p.method === 'Cash')
            .reduce((sum, p) => sum + p.amount, 0);

        const cashRequired = Math.max(0, this.total - totalNonCashPaid);

        return Math.max(0, totalCashPaid - cashRequired);
    }

    updateSearch(term: string): void {
        this.searchTerm$.next(term);
    }

    selectCustomer(customer: Customer): void {
        this.selectedCustomer = customer;
        this.showCustomerSearch = false;
        this.customerSearchTerm$.next('');
    }

    clearCustomer(): void {
        this.selectedCustomer = null;
    }

    addNewCustomer(name: string): void {
        if (!name.trim()) {
            this.notificationService.show('Customer name cannot be empty.', 'warning');
            return;
        }
        const newCustomer = this.customerService.addCustomer({ name });
        this.selectCustomer(newCustomer);
    }

    applyCoupon(): void {
        if (!this.couponCode.trim()) return;

        this.salesService.applyCoupon(this.cart, this.couponCode).subscribe({
            next: (result) => {
                if (result.amount > 0) {
                    this.appliedCoupon = {
                        code: this.couponCode,
                        amount: result.amount
                    };
                    this.notificationService.show(`Coupon applied: ${result.discountName}`, 'success');
                    this.calculateTotal();
                } else {
                    this.notificationService.show('Coupon valid but no discount applicable to current items.', 'warning');
                }
            },
            error: (err) => {
                this.notificationService.show(err.error?.message || 'Invalid coupon code', 'error');
            }
        });
    }

    removeCoupon(): void {
        if (this.appliedCoupon) {
            this.appliedCoupon = null;
            this.couponCode = '';
            this.calculateTotal();
        }
    }

    addToCart(product: Product): void {
        this.removeCoupon(); // Automatically remove coupon when cart changes
        const existingItem = this.cart.find(item => item.product.id === product.id);
        const currentQty = existingItem ? existingItem.quantity : 0;

        if (currentQty < product.stockQuantity) {
            if (existingItem) {
                existingItem.quantity++;
            } else {
                this.cart.push({ product, quantity: 1 });
            }
            this.calculateTotal();
        } else {
            this.notificationService.show('Insufficient stock available.', 'warning');
        }
    }

    updateQuantity(item: CartItem, delta: number): void {
        const newQty = item.quantity + delta;
        if (newQty > 0) {
            this.setQuantity(item, newQty);
        }
    }

    setQuantity(item: CartItem, qty: number): void {
        this.removeCoupon(); // Automatically remove coupon when cart changes
        if (!qty || qty < 1) {
            item.quantity = 1;
        } else if (qty > item.product.stockQuantity) {
            this.notificationService.show(`Insufficient stock. Max available: ${item.product.stockQuantity}`, 'warning');
            item.quantity = item.product.stockQuantity;
        } else {
            item.quantity = qty;
        }
        this.calculateTotal();
    }

    applyDiscount(amount: number, type: string): void {
        if (isNaN(amount) || amount < 0) {
            this.notificationService.show('Please enter a valid discount amount.', 'warning');
            return;
        }
        this.discount = amount;
        this.discountType = type as 'percentage' | 'fixed';
        this.showDiscountInput = false;
        this.calculateTotal();
    }

    removeDiscount(): void {
        this.discount = 0;
        this.calculateTotal();
    }

    removeFromCart(item: CartItem): void {
        this.removeCoupon(); // Automatically remove coupon when cart changes
        const index = this.cart.indexOf(item);
        if (index > -1) {
            this.cart.splice(index, 1);
            this.calculateTotal();
        }
    }

    calculateTotal(): void {
        this.subtotal = this.cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

        if (this.discount > 0) {
            if (this.discountType === 'percentage') {
                this.discountAmount = (this.subtotal * this.discount) / 100;
            } else { // fixed
                this.discountAmount = Math.min(this.discount, this.subtotal); // Cannot discount more than subtotal
            }
        } else {
            this.discountAmount = 0;
        }

        let totalDiscount = this.discountAmount;
        if (this.appliedCoupon) {
            totalDiscount += this.appliedCoupon.amount;
        }

        this.total = Math.max(0, this.subtotal - totalDiscount);
    }

    processSale(): void {
        if (this.cart.length === 0) return;
        this.showPaymentModal = true;
        // Reset payment state for new sale
        this.payments = [];
        this.paymentAmountInput = null;
        this.selectedPaymentMethod = 'Cash';
    }

    confirmPayment(): void {
      if (this.amountRemaining > 0) {
          this.notificationService.show('Payment is not complete.', 'warning');
          return;
      }

      let allSuccessful = true;
      const tempCart = [...this.cart];

      tempCart.forEach(item => {
          const success = this.inventoryService.deductStock(item.product.id, item.quantity);
          if (!success) allSuccessful = false;
      });

      if (allSuccessful) {
          const grossProfit = tempCart.reduce((sum, item) => {
              const itemProfit = (item.product.sellingPrice - item.product.costPrice) * item.quantity;
              return sum + itemProfit;
          }, 0);
          const totalDiscount = this.discountAmount + (this.appliedCoupon?.amount || 0);
          const netProfit = grossProfit - totalDiscount;

          const newTransaction: Transaction = {
              id: Date.now().toString(),
              date: new Date(),
              items: tempCart,
              payments: this.payments,
              subtotal: this.subtotal,
              discountValue: this.discount,
              discountType: this.discountType,
              discountAmount: totalDiscount,
              couponCode: this.appliedCoupon?.code,
              couponDiscountAmount: this.appliedCoupon?.amount,
              totalAmount: this.total,
              totalProfit: netProfit,
              customerId: this.selectedCustomer?.id,
              customerName: this.selectedCustomer?.name
          };
          this.transactionService.logTransaction(newTransaction);
          this.receiptService.printReceipt(newTransaction, this.currentSettings);
          this.notificationService.show('Sale completed successfully!', 'success');

          // Reset state
          this.cart = [];
          this.removeDiscount();
          this.removeCoupon();
          this.showPaymentModal = false;
      } else {
          this.notificationService.show('Some items could not be processed due to stock changes.', 'error');
          // In a real app, you would need to reconcile inventory and potentially reverse any processed payments.
      }
    }

    addPayment(): void {
      let amount = this.paymentAmountInput;
      if (amount === null || amount <= 0) {
          // If no amount is entered, assume they are paying the rest of the bill with this method
          amount = this.amountRemaining;
      }

      if (amount > this.amountRemaining && this.selectedPaymentMethod !== 'Cash') {
          this.notificationService.show(`Cannot overpay with ${this.selectedPaymentMethod}.`, 'warning');
          return;
      }

      if (amount > 0) {
          this.payments.push({ method: this.selectedPaymentMethod, amount: amount });
          this.paymentAmountInput = null; // Reset input
          this.selectedPaymentMethod = 'Cash'; // Default back to cash for next payment
      }
    }

    removePayment(index: number): void {
        this.payments.splice(index, 1);
    }

    cancelPayment(): void {
        this.showPaymentModal = false;
        // No need to reset payments array, it will be reset on next `processSale`
    }

    suspendSale(): void {
        if (this.cart.length === 0) return;
        
        const note = prompt('Add a note for this suspended sale (optional):');
        if (note === null) return; // Cancelled

        const totalDiscount = this.discountAmount + (this.appliedCoupon?.amount || 0);

        const sale: SuspendedSale = {
            id: Date.now().toString(),
            date: new Date(),
            items: [...this.cart],
            subtotal: this.subtotal,
            discount: this.discount,
            discountType: this.discountType,
            discountAmount: totalDiscount,
            totalAmount: this.total,
            note: note || undefined,
            customerId: this.selectedCustomer?.id,
            customerName: this.selectedCustomer?.name
        };

        this.transactionService.suspendSale(sale);
        this.notificationService.show('Sale suspended successfully.', 'info');
        
        // Clear cart and customer
        this.cart = [];
        this.removeDiscount();
        this.removeCoupon();
        this.clearCustomer();
    }

    resumeSale(sale: SuspendedSale): void {
        if (this.cart.length > 0) {
            if (!confirm('Current cart is not empty. Overwrite with suspended sale?')) {
                return;
            }
        }

        this.cart = [...sale.items];
        this.applyDiscount(sale.discount, sale.discountType);

        if (sale.customerId) {
            // In a real app, you might want to fetch the full customer object from the service.
            // For this implementation, creating a partial object is sufficient for the UI.
            this.selectedCustomer = {
                id: sale.customerId,
                name: sale.customerName || 'Unknown Customer'
            };
        } else {
            this.clearCustomer();
        }
        
        this.transactionService.removeSuspendedSale(sale.id);
        this.showSuspendedSales = false;
        this.notificationService.show('Sale resumed.', 'success');
    }

    deleteSuspendedSale(id: string): void {
        if (confirm('Are you sure you want to delete this suspended sale?')) {
            this.transactionService.removeSuspendedSale(id);
        }
    }
}