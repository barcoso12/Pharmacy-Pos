import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for pipes like date, currency, and ngIf/ngFor
import { FormsModule } from '@angular/forms'; // Needed for ngModel on date input
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { TransactionService } from '../core/services/transaction.service';
import { Transaction } from '../core/models/transaction.model';
import { SettingsService } from '../core/services/settings.service';
import { AppSettings } from '../core/models/settings.model';
import { NotificationService } from '../core/services/notification.service';

interface DailyReportSummary {
    totalSales: number;
    totalItemsSold: number;
    totalTransactions: number;
    transactions: Transaction[];
    totalProfit: number;
    profitMargin: number; // As a percentage
    hourlyTrend: { hour: string; total: number; percentage: number }[];
}

@Component({
    selector: 'app-daily-sales-report',
    standalone: true, // Mark as standalone component
    imports: [CommonModule, FormsModule], // Import necessary modules for standalone
    template: `
    <div class="daily-sales-container">
      <h2>Daily Sales Report</h2>

      <div class="date-selector">
        <label for="reportDate">Select Date:</label>
        <input type="date" id="reportDate" [(ngModel)]="selectedDateString" (change)="onDateChange()">
        <button class="export-btn" (click)="exportToPdf()" [disabled]="(dailyReport$ | async)?.totalTransactions === 0">Export to PDF</button>
      </div>

      <div *ngIf="dailyReport$ | async as report" class="report-summary">
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

      <div class="chart-section" *ngIf="dailyReport$ | async as report">
        <h3>Hourly Sales Trend</h3>
        <div class="bar-chart">
          <div *ngFor="let item of report.hourlyTrend" class="bar-row">
            <div class="bar-label">{{ item.hour }}</div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="item.percentage"></div>
            </div>
            <div class="bar-value">{{ item.total | currency }}</div>
          </div>
          <div *ngIf="report.totalSales === 0" class="no-data">No sales data for chart.</div>
        </div>
      </div>

      <div class="transaction-list-section">
        <h3>Transactions for {{ selectedDate | date:'fullDate' }}</h3>
        <div *ngIf="(dailyReport$ | async)?.transactions.length === 0" class="no-transactions">
          No transactions recorded for this date.
        </div>
        <div *ngFor="let tx of (dailyReport$ | async)?.transactions" class="transaction-card">
          <div class="tx-header">
            <span>ID: {{ tx.id }}</span>
            <span>Time: {{ tx.date | date:'shortTime' }}</span>
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
    .daily-sales-container { padding: 20px; background-color: #f4f7f6; max-width: 900px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { margin-bottom: 25px; color: #2c3e50; text-align: center; font-size: 1.8em; }
    .date-selector { margin-bottom: 30px; display: flex; align-items: center; justify-content: center; gap: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .date-selector label { font-weight: bold; color: #34495e; font-size: 1.1em; }
    .date-selector input { padding: 10px 15px; border: 1px solid #ccc; border-radius: 5px; font-size: 1em; outline: none; transition: border-color 0.2s; }
    .date-selector input:focus { border-color: #2ecc71; }
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
export class DailySalesComponent implements OnInit {
    selectedDate: Date = new Date();
    selectedDateString: string; // For ngModel binding to input type="date"

    private dateSelectionSubject = new BehaviorSubject<Date>(this.selectedDate);
    dailyReport$: Observable<DailyReportSummary>;
    currentSettings: AppSettings | null = null;

    constructor(
        private transactionService: TransactionService,
        private settingsService: SettingsService,
        private notificationService: NotificationService
    ) {
        // Initialize selectedDateString for the input field to today's date
        this.selectedDateString = this.formatDateToISO(this.selectedDate);

        // Combine date selection with transaction service to get daily report
        this.dailyReport$ = this.dateSelectionSubject.pipe(
            switchMap(date => this.transactionService.getDailyTransactions(date)),
            map(transactions => this.summarizeTransactions(transactions))
        );
    }

    ngOnInit(): void {
        this.settingsService.settings$.subscribe(settings => this.currentSettings = settings);
    }

    /**
     * Called when the date input changes. Updates the selectedDate and triggers report refresh.
     */
    onDateChange(): void {
        if (this.selectedDateString) {
            this.selectedDate = new Date(this.selectedDateString);
            this.dateSelectionSubject.next(this.selectedDate);
        }
    }

    exportToPdf(): void {
        this.dailyReport$.pipe(take(1)).subscribe(report => {
            if (!report || report.totalTransactions === 0) {
                this.notificationService.show('No data to export.', 'warning');
                return;
            }

            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow) {
                this.notificationService.show('Popup blocked. Cannot export PDF.', 'warning');
                return;
            }

            const pharmacyName = this.currentSettings?.pharmacyName || 'Pharmacy POS';
            const dateStr = this.selectedDate.toLocaleDateString();

            const transactionsHtml = report.transactions.map(tx => `
                <tr>
                    <td>${tx.id}</td>
                    <td>${new Date(tx.date).toLocaleTimeString()}</td>
                    <td>${tx.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}</td>
                    <td style="text-align: right">${tx.totalAmount.toFixed(2)}</td>
                </tr>
            `).join('');

            const htmlContent = `
                <html>
                <head>
                    <title>Daily Sales Report - ${dateStr}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        h1, h2 { text-align: center; color: #2c3e50; margin: 5px 0; }
                        .summary { display: flex; justify-content: space-between; margin: 30px 0; padding: 15px; background: #f9f9f9; border: 1px solid #eee; border-radius: 5px; }
                        .summary-item { text-align: center; }
                        .summary-item strong { display: block; font-size: 1.4em; color: #27ae60; margin-top: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .footer { margin-top: 40px; text-align: center; font-size: 0.8em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>${pharmacyName}</h1>
                    <h2>Daily Sales Report: ${dateStr}</h2>
                    
                    <div class="summary">
                        <div class="summary-item">Total Sales<br><strong>${report.totalSales.toFixed(2)}</strong></div>
                        <div class="summary-item">Transactions<br><strong>${report.totalTransactions}</strong></div>
                        <div class="summary-item">Items Sold<br><strong>${report.totalItemsSold}</strong></div>
                        <div class="summary-item">Total Profit<br><strong>${report.totalProfit.toFixed(2)}</strong></div>
                        <div class="summary-item">Margin<br><strong>${report.profitMargin.toFixed(2)}%</strong></div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Time</th>
                                <th>Items</th>
                                <th style="text-align: right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactionsHtml}
                        </tbody>
                    </table>

                    <div class="footer">
                        Generated on ${new Date().toLocaleString()}
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        });
    }

    /**
     * Summarizes a list of transactions into a DailyReportSummary object.
     */
    private summarizeTransactions(transactions: Transaction[]): DailyReportSummary {
        let totalSales = 0;
        let totalItemsSold = 0;
        let totalProfit = 0;
        const hourlyTotals = new Array(24).fill(0);

        transactions.forEach(tx => {
            totalSales += tx.totalAmount;
            // Fallback to 0 if totalProfit is not available on older transactions
            totalProfit += tx.totalProfit || 0;
            tx.items.forEach(item => {
                totalItemsSold += item.quantity;
            });
            const hour = new Date(tx.date).getHours();
            hourlyTotals[hour] += tx.totalAmount;
        });

        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        const maxHourlyTotal = Math.max(...hourlyTotals, 1);
        const hourlyTrend = hourlyTotals.map((total, index) => ({
            hour: `${index.toString().padStart(2, '0')}:00`,
            total,
            percentage: (total / maxHourlyTotal) * 100
        }));

        return {
            totalSales,
            totalItemsSold,
            totalTransactions: transactions.length,
            transactions,            
            totalProfit,
            profitMargin,
            hourlyTrend
        };
    }

    /**
     * Formats a Date object into an ISO string (YYYY-MM-DD) suitable for input type="date".
     */
    private formatDateToISO(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}