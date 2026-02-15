import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for pipes like date, currency, and ngIf/ngFor
import { FormsModule } from '@angular/forms'; // Needed for ngModel on select inputs
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { TransactionService } from '../core/services/transaction.service';
import { Transaction } from '../core/models/transaction.model';
import { SettingsService } from '../core/services/settings.service';
import { AppSettings } from '../core/models/settings.model';
import { NotificationService } from '../core/services/notification.service';

interface MonthlyReportSummary {
    totalSales: number;
    totalItemsSold: number;
    totalTransactions: number;
    transactions: Transaction[];
    totalProfit: number;
    profitMargin: number; // As a percentage
    dailyTrend: { day: number; total: number; percentage: number }[];
}

@Component({
    selector: 'app-monthly-sales-report',
    standalone: true, // Mark as standalone component
    imports: [CommonModule, FormsModule], // Import necessary modules for standalone
    template: `
    <div class="monthly-sales-container">
      <h2>Monthly Sales Report</h2>

      <div class="date-selector">
        <label for="reportMonth">Select Month:</label>
        <select id="reportMonth" [(ngModel)]="selectedMonth" (change)="onMonthYearChange()">
          <option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option>
        </select>

        <label for="reportYear">Select Year:</label>
        <select id="reportYear" [(ngModel)]="selectedYear" (change)="onMonthYearChange()">
          <option *ngFor="let y of years" [value]="y">{{ y }}</option>
        </select>
        <button class="export-btn" (click)="exportToPdf()" [disabled]="(monthlyReport$ | async)?.totalTransactions === 0">Export to PDF</button>
      </div>

      <div *ngIf="monthlyReport$ | async as report" class="report-summary">
        <div class="summary-card">
          <h3>Total Sales</h3>
          <p class="metric">{{ report.totalSales | currency }}</p>
        </div>
        <div class="summary-card">
          <h3>Total Items Sold</h3>
          <p class="metric">{{ report.totalItemsSold }}</p>
        </div>
        <div class="summary-card">
          <h3>Total Transactions</h3>
          <p class="metric">{{ report.totalTransactions }}</p>
        </div>
        <div class="summary-card">
          <h3>Total Profit</h3>
          <p class="metric profit">{{ report.totalProfit | currency }}</p>
        </div>
        <div class="summary-card">
          <h3>Profit Margin</h3>
          <p class="metric margin">{{ report.profitMargin | number:'1.2-2' }}%</p>
        </div>
      </div>

      <div class="chart-section" *ngIf="monthlyReport$ | async as report">
        <h3>Daily Sales Trend</h3>
        <div class="bar-chart">
          <div *ngFor="let item of report.dailyTrend" class="bar-row">
            <div class="bar-label">Day {{ item.day }}</div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="item.percentage"></div>
            </div>
            <div class="bar-value">{{ item.total | currency }}</div>
          </div>
          <div *ngIf="report.totalSales === 0" class="no-data">No sales data for chart.</div>
        </div>
      </div>

      <div class="transaction-list-section">
        <h3>Transactions for {{ getMonthName(selectedMonth) }} {{ selectedYear }}</h3>
        <div *ngIf="(monthlyReport$ | async)?.transactions.length === 0" class="no-transactions">
          No transactions recorded for this month.
        </div>
        <div *ngFor="let tx of (monthlyReport$ | async)?.transactions" class="transaction-card">
          <div class="tx-header">
            <span>ID: {{ tx.id }}</span>
            <span>Date: {{ tx.date | date:'short' }}</span>
            <strong>Total: {{ tx.totalAmount | currency }}</strong>
          </div>
          <div class="tx-body">
            <ul>
              <li *ngFor="let item of tx.items">
                {{ item.product.name }} (x{{ item.quantity }})
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .monthly-sales-container { padding: 20px; background-color: #f4f7f6; max-width: 900px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { margin-bottom: 25px; color: #2c3e50; text-align: center; font-size: 1.8em; }
    .date-selector { margin-bottom: 30px; display: flex; align-items: center; justify-content: center; gap: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .date-selector label { font-weight: bold; color: #34495e; font-size: 1.1em; }
    .date-selector select { padding: 10px 15px; border: 1px solid #ccc; border-radius: 5px; font-size: 1em; outline: none; transition: border-color 0.2s; }
    .date-selector select:focus { border-color: #2ecc71; }
    .export-btn { padding: 10px 15px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; margin-left: 10px; transition: background-color 0.2s; }
    .export-btn:hover:not(:disabled) { background: #c0392b; }
    .export-btn:disabled { background: #ccc; cursor: not-allowed; }
    .report-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .summary-card { background: linear-gradient(135deg, #ffffff, #f0f0f0); border-radius: 10px; padding: 25px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s ease-in-out; }
    .summary-card:hover { transform: translateY(-5px); }
    .summary-card h3 { margin-top: 0; color: #555; font-size: 1.1em; margin-bottom: 10px; }
    .summary-card .metric { font-size: 2.8em; font-weight: bold; color: #2ecc71; line-height: 1; }
    .summary-card .metric.profit { color: #3498db; }
    .summary-card .metric.margin { color: #e67e22; }
    .transaction-list-section h3 { margin-bottom: 20px; color: #34495e; text-align: center; font-size: 1.5em; }
    .no-transactions { text-align: center; color: #888; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .transaction-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 18px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .tx-header { display: flex; justify-content: space-between; align-items: center; color: #555; font-size: 0.95em; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
    .tx-header strong { font-size: 1.2em; color: #2ecc71; }
    .tx-body ul { list-style: none; padding: 0; margin: 0; }
    .tx-body li { padding: 4px 0; color: #333; font-size: 0.9em; border-bottom: 1px dotted #f0f0f0; }
    .tx-body li:last-child { border-bottom: none; }
    .chart-section { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
    .bar-chart { max-height: 400px; overflow-y: auto; }
    .bar-row { display: flex; align-items: center; margin-bottom: 10px; gap: 15px; font-size: 0.9em; }
    .bar-label { width: 60px; text-align: right; font-weight: 500; color: #555; }
    .bar-track { flex: 1; background-color: #ecf0f1; height: 12px; border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; background-color: #3498db; border-radius: 6px; transition: width 0.5s ease-out; }
    .bar-value { width: 80px; text-align: right; color: #7f8c8d; }
    .no-data { text-align: center; color: #95a5a6; padding: 20px; font-style: italic; }
  `]
})
export class MonthlySalesComponent implements OnInit {
    selectedMonth: number; // 0-indexed
    selectedYear: number;

    months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    years: number[] = []; // Populate dynamically

    private monthYearSelectionSubject = new BehaviorSubject<{ year: number, month: number }>(this.getCurrentMonthYear());
    monthlyReport$: Observable<MonthlyReportSummary>;
    currentSettings: AppSettings | null = null;

    constructor(
        private transactionService: TransactionService,
        private settingsService: SettingsService,
        private notificationService: NotificationService
    ) {
        const current = this.getCurrentMonthYear();
        this.selectedMonth = current.month;
        this.selectedYear = current.year;
        this.populateYears();

        // Combine month/year selection with transaction service to get monthly report
        this.monthlyReport$ = this.monthYearSelectionSubject.pipe(
            switchMap(({ year, month }) => 
                this.transactionService.getMonthlyTransactions(year, month).pipe(
                    map(transactions => this.summarizeTransactions(transactions, year, month))
                )
            )
        );
    }

    ngOnInit(): void {
        this.settingsService.settings$.subscribe(settings => this.currentSettings = settings);
    }

    /**
     * Called when the month or year selection changes. Triggers report refresh.
     */
    onMonthYearChange(): void {
        this.monthYearSelectionSubject.next({ year: this.selectedYear, month: this.selectedMonth });
    }

    /**
     * Gets the current year and month (0-indexed).
     */
    private getCurrentMonthYear(): { year: number, month: number } {
        const today = new Date();
        return { year: today.getFullYear(), month: today.getMonth() };
    }

    /**
     * Populates the years array for the dropdown.
     */
    private populateYears(): void {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 1; i++) { // e.g., last 5 years, current, and next year
            this.years.push(i);
        }
    }

    /**
     * Returns the name of the month given its 0-indexed number.
     */
    getMonthName(monthIndex: number): string {
        return this.months[monthIndex];
    }

    /**
     * Summarizes a list of transactions into a MonthlyReportSummary object.
     */
    private summarizeTransactions(transactions: Transaction[], year: number, month: number): MonthlyReportSummary {
        let totalSales = 0;
        let totalItemsSold = 0;
        let totalProfit = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dailyTotals = new Array(daysInMonth).fill(0);

        transactions.forEach(tx => {
            totalSales += tx.totalAmount;
            // Fallback to 0 if totalProfit is not available on older transactions
            totalProfit += tx.totalProfit || 0;
            tx.items.forEach(item => {
                totalItemsSold += item.quantity;
            });
            const day = new Date(tx.date).getDate();
            if (day >= 1 && day <= daysInMonth) {
                dailyTotals[day - 1] += tx.totalAmount;
            }
        });

        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        const maxDailyTotal = Math.max(...dailyTotals, 1);
        const dailyTrend = dailyTotals.map((total, index) => ({
            day: index + 1,
            total,
            percentage: (total / maxDailyTotal) * 100
        }));

        return {
            totalSales,
            totalItemsSold,
            totalTransactions: transactions.length,
            transactions,
            dailyTrend,
            totalProfit,
            profitMargin
        };
    }
}