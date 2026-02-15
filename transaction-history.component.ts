import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';
import { Transaction } from '../core/models/transaction.model';
import { TransactionService } from '../core/services/transaction.service';
import { SettingsService } from '../core/services/settings.service';
import { AppSettings } from '../core/models/settings.model';
import { NotificationService } from '../core/services/notification.service';
import { ReceiptService } from '../core/services/receipt.service';

@Component({
    selector: 'app-transaction-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="history-container">
      <div class="history-header">
        <h2>Transaction History</h2>
        <button class="export-btn" (click)="exportToCsv()" [disabled]="(filteredTransactions$ | async)?.length === 0">Export to CSV</button>
      </div>

      <div class="filters-bar">
        <input type="text" [(ngModel)]="searchTerm" (input)="updateFilters()" placeholder="Search Transaction ID" class="search-input">
        <div class="date-group">
            <input type="date" [(ngModel)]="startDate" (change)="updateFilters()">
            <span>to</span>
            <input type="date" [(ngModel)]="endDate" (change)="updateFilters()">
        </div>
        <div class="sort-group">
            <select [(ngModel)]="sortBy" (change)="updateFilters()">
                <option value="date">Date</option>
                <option value="amount">Total Amount</option>
            </select>
            <button (click)="toggleSortDirection()" class="sort-dir-btn">
                {{ sortDirection === 'desc' ? '⬇' : '⬆' }}
            </button>
        </div>
      </div>

      <div *ngIf="(filteredTransactions$ | async)?.length === 0" class="no-history">
        No transactions found.
      </div>
      <div *ngIf="(paginatedTransactions$ | async)?.length > 0" class="transaction-list">
        <div *ngFor="let tx of paginatedTransactions$ | async" class="transaction-card">
          <div class="tx-header">
            <span>Transaction ID: {{ tx.id }}</span>
            <span *ngIf="tx.customerName" class="customer-name">Customer: {{ tx.customerName }}</span>
            <span *ngIf="tx.couponCode" class="coupon-info">Coupon: <strong>{{ tx.couponCode }}</strong></span>
            <span>{{ tx.date | date:'short' }}</span>
          </div>
          <div class="tx-body">
            <ul>
              <li *ngFor="let item of tx.items">
                {{ item.product.name }} (x{{ item.quantity }}) - {{ item.product.sellingPrice * item.quantity | currency }}
              </li>
            </ul>
          </div>
          <div class="tx-footer">
            <strong>Total: {{ tx.totalAmount | currency }}</strong>
            <button class="reprint-btn" (click)="printReceipt(tx)">Reprint Receipt</button>
          </div>
        </div>

        <div class="pagination-controls" *ngIf="(filteredTransactions$ | async)?.length > 0">
            <button (click)="changePage(-1)" [disabled]="(currentPage$ | async) === 1">Previous</button>
            <span>Page {{ currentPage$ | async }} of {{ totalPages }}</span>
            <button (click)="changePage(1)" [disabled]="(currentPage$ | async) === totalPages">Next</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .history-container { padding: 20px; background-color: #f9f9f9; max-width: 800px; margin: auto; }
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .history-header h2 {
      margin: 0;
      color: #2c3e50;
    }
    .export-btn { padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
    .export-btn:hover:not(:disabled) { background: #229954; }
    .export-btn:disabled { background: #ccc; cursor: not-allowed; }
    .filters-bar { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; align-items: center; background: white; padding: 10px; border-radius: 8px; border: 1px solid #e0e0e0; }
    .search-input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1; min-width: 200px; }
    .date-group { display: flex; align-items: center; gap: 5px; }
    .date-group input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .sort-group { display: flex; gap: 5px; }
    .sort-group select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .sort-dir-btn { padding: 8px 12px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
    .no-history { text-align: center; color: #888; padding: 40px; background: white; border-radius: 8px; }
    .transaction-list { display: flex; flex-direction: column; gap: 15px; }
    .transaction-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .tx-header { display: flex; justify-content: space-between; color: #555; font-size: 0.9em; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
    .tx-body ul { list-style: none; padding: 0; margin: 0; }
    .customer-name { font-weight: 500; color: #34495e; }
    .coupon-info { color: #27ae60; }
    .tx-body li { padding: 4px 0; color: #333; }
    .tx-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; }
    .tx-footer strong { font-size: 1.2em; color: #2ecc71; }
    .reprint-btn { padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
    .reprint-btn:hover { background: #2980b9; }
    .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
    .pagination-controls button { padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .pagination-controls button:disabled { background: #bdc3c7; cursor: not-allowed; }
  `]
})
export class TransactionHistoryComponent implements OnInit {
    filteredTransactions$: Observable<Transaction[]>;
    paginatedTransactions$: Observable<Transaction[]>;
    currentSettings: AppSettings | null = null;
    currentPage$ = new BehaviorSubject<number>(1);
    itemsPerPage = 10;
    totalItems = 0;

    searchTerm = '';
    startDate: string = '';
    endDate: string = '';
    sortBy: 'date' | 'amount' = 'date';
    sortDirection: 'asc' | 'desc' = 'desc';

    private filterSubject = new BehaviorSubject<void>(undefined);

    constructor(
        private transactionService: TransactionService,
        private settingsService: SettingsService,
        private notificationService: NotificationService,
        private receiptService: ReceiptService
    ) {
        this.filteredTransactions$ = combineLatest([
            this.transactionService.transactions$,
            this.filterSubject
        ]).pipe(
            map(([transactions]) => {
                let filtered = [...transactions];

                // Filter by Search Term (ID)
                if (this.searchTerm) {
                    const term = this.searchTerm.toLowerCase();
                    filtered = filtered.filter(t => t.id.toLowerCase().includes(term));
                }

                // Filter by Date Range
                if (this.startDate) {
                    const start = new Date(this.startDate);
                    start.setHours(0, 0, 0, 0);
                    filtered = filtered.filter(t => new Date(t.date) >= start);
                }
                if (this.endDate) {
                    const end = new Date(this.endDate);
                    end.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(t => new Date(t.date) <= end);
                }

                // Sort
                filtered.sort((a, b) => {
                    let comparison = 0;
                    if (this.sortBy === 'date') {
                        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    } else if (this.sortBy === 'amount') {
                        comparison = a.totalAmount - b.totalAmount;
                    }
                    return this.sortDirection === 'asc' ? comparison : -comparison;
                });

                return filtered;
            }),
            tap(filtered => {
                this.totalItems = filtered.length;
                const currentPage = this.currentPage$.value;
                const maxPage = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
                if (currentPage > maxPage) {
                    this.currentPage$.next(maxPage);
                }
            })
        );

        this.paginatedTransactions$ = combineLatest([
            this.filteredTransactions$,
            this.currentPage$
        ]).pipe(
            map(([transactions, page]) => {
                const startIndex = (page - 1) * this.itemsPerPage;
                return transactions.slice(startIndex, startIndex + this.itemsPerPage);
            })
        );
    }

    ngOnInit(): void {
        this.settingsService.settings$.subscribe(settings => this.currentSettings = settings);
    }

    updateFilters(): void {
        this.currentPage$.next(1);
        this.filterSubject.next();
    }

    toggleSortDirection(): void {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.updateFilters();
    }

    get totalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    }

    changePage(delta: number): void {
        const newPage = this.currentPage$.value + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage$.next(newPage);
        }
    }

    exportToCsv(): void {
        this.filteredTransactions$.pipe(take(1)).subscribe(transactions => {
            if (!transactions || transactions.length === 0) {
                this.notificationService.show('No transactions to export.', 'info');
                return;
            }

            const csvRows = [];
            // Header row
            const headers = [
                'Transaction ID', 'Date', 'Time', 'Product Name', 'Product SKU',
                'Quantity', 'Unit Price', 'Item Subtotal', 'Transaction Discount',
                'Coupon Code', 'Coupon Discount',
                'Transaction Total', 'Payment Methods'
            ];
            csvRows.push(headers.join(','));

            // Data rows
            for (const tx of transactions) {
                const date = new Date(tx.date).toLocaleDateString();
                const time = new Date(tx.date).toLocaleTimeString();
                const paymentMethods = tx.payments ? tx.payments.map(p => p.method).join(' | ') : 'N/A';

                for (const item of tx.items) {
                    const row = [
                        tx.id,
                        date,
                        time,
                        `"${item.product.name.replace(/"/g, '""')}"`,
                        item.product.sku,
                        item.quantity,
                        item.product.sellingPrice.toFixed(2),
                        (item.product.sellingPrice * item.quantity).toFixed(2),
                        (tx.discountAmount || 0).toFixed(2),
                        tx.couponCode || '',
                        (tx.couponDiscountAmount || 0).toFixed(2),
                        tx.totalAmount.toFixed(2),
                        paymentMethods
                    ];
                    csvRows.push(row.join(','));
                }
            }

            const csvString = csvRows.join('\r\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().slice(0, 10);

            link.setAttribute('href', url);
            link.setAttribute('download', `transaction-history-${today}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.notificationService.show('Transaction history exported successfully.', 'success');
        });
    }

    printReceipt(transaction: Transaction): void {
        this.receiptService.printReceipt(transaction, this.currentSettings);
    }
}