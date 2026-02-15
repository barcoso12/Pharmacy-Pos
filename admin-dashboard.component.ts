import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionService } from '../core/services/transaction.service';
import { InventoryService } from '../core/services/inventory.service';
import { Transaction } from '../core/models/transaction.model';
import { Product } from '../core/models/product.model';

interface DashboardMetrics {
    totalRevenue: number;
    todaysRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    inventoryValue: number;
    totalProducts: number;
    totalProfit: number;
    todaysProfit: number;
}

interface TopProduct {
    name: string;
    quantitySold: number;
    percentage: number; // For visualization width
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p class="subtitle">Overview of business performance and inventory health</p>
      </header>

      <!-- Key Metrics Cards -->
      <div class="metrics-grid" *ngIf="metrics$ | async as metrics">
        <div class="metric-card revenue">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <h3>Total Revenue</h3>
            <p class="value">{{ metrics.totalRevenue | currency }}</p>
            <span class="sub-value">Today: {{ metrics.todaysRevenue | currency }}</span>
          </div>
        </div>

        <div class="metric-card transactions">
          <div class="metric-icon">🧾</div>
          <div class="metric-content">
            <h3>Transactions</h3>
            <p class="value">{{ metrics.totalTransactions }}</p>
            <span class="sub-value">Avg: {{ metrics.averageTransactionValue | currency }}</span>
          </div>
        </div>

        <div class="metric-card inventory">
          <div class="metric-icon">📦</div>
          <div class="metric-content">
            <h3>Inventory Value</h3>
            <p class="value">{{ metrics.inventoryValue | currency }}</p>
            <span class="sub-value">{{ metrics.totalProducts }} Products</span>
          </div>
        </div>

        <div class="metric-card profit">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <h3>Total Profit</h3>
            <p class="value">{{ metrics.totalProfit | currency }}</p>
            <span class="sub-value">Today: {{ metrics.todaysProfit | currency }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Top Selling Products Visualization -->
        <div class="chart-section">
          <h3>Top Selling Products</h3>
          <div class="bar-chart">
            <div *ngFor="let item of topProducts$ | async" class="bar-row">
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="item.percentage"></div>
              </div>
              <div class="bar-value">{{ item.quantitySold }} sold</div>
            </div>
            <div *ngIf="(topProducts$ | async)?.length === 0" class="no-data">
              No sales data available yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .admin-dashboard { padding: 20px; background-color: #f4f7f6; min-height: 100%; }
    .dashboard-header { margin-bottom: 30px; }
    .dashboard-header h2 { margin: 0; color: #2c3e50; font-size: 2em; }
    .subtitle { color: #7f8c8d; margin: 5px 0 0; }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .metric-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 20px; transition: transform 0.2s; }
    .metric-card:hover { transform: translateY(-5px); }
    .metric-icon { font-size: 2.5em; background: #f8f9fa; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
    .metric-content h3 { margin: 0 0 5px; color: #7f8c8d; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
    .metric-content .value { margin: 0; font-size: 1.8em; font-weight: bold; color: #2c3e50; }
    .metric-content .sub-value { font-size: 0.85em; color: #95a5a6; }
    
    .revenue .metric-icon { background-color: #e8f8f5; }
    .revenue .value { color: #27ae60; }
    .transactions .metric-icon { background-color: #eaf2f8; }
    .transactions .value { color: #2980b9; }
    .inventory .metric-icon { background-color: #fef5e7; }
    .inventory .value { color: #d35400; }
    .profit .metric-icon { background-color: #f4ecf7; }
    .profit .value { color: #8e44ad; }

    .chart-section { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .chart-section h3 { margin-top: 0; color: #34495e; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
    
    .bar-row { display: flex; align-items: center; margin-bottom: 15px; gap: 15px; }
    .bar-label { width: 150px; text-align: right; font-weight: 500; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; background-color: #ecf0f1; height: 12px; border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; background-color: #3498db; border-radius: 6px; transition: width 1s ease-out; }
    .bar-value { width: 80px; font-size: 0.9em; color: #7f8c8d; }
    .no-data { text-align: center; color: #95a5a6; padding: 20px; font-style: italic; }
  `]
})
export class AdminDashboardComponent implements OnInit {
    metrics$: Observable<DashboardMetrics>;
    topProducts$: Observable<TopProduct[]>;

    constructor(
        private transactionService: TransactionService,
        private inventoryService: InventoryService
    ) {
        // Calculate Metrics
        this.metrics$ = combineLatest([
            this.transactionService.transactions$,
            this.inventoryService.products$
        ]).pipe(
            map(([transactions, products]) => {
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
                const totalProfit = transactions.reduce((sum, t) => sum + (t.totalProfit || 0), 0);

                const todaysTransactions = transactions.filter(t => new Date(t.date) >= todayStart);
                const todaysRevenue = todaysTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
                const todaysProfit = todaysTransactions.reduce((sum, t) => sum + (t.totalProfit || 0), 0);

                const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stockQuantity), 0);

                return {
                    totalRevenue,
                    todaysRevenue,
                    totalTransactions: transactions.length,
                    averageTransactionValue: transactions.length ? totalRevenue / transactions.length : 0,
                    inventoryValue,
                    totalProducts: products.length,
                    totalProfit,
                    todaysProfit
                };
            })
        );

        // Calculate Top Products
        this.topProducts$ = this.transactionService.transactions$.pipe(
            map(transactions => {
                const productSales: { [name: string]: number } = {};
                transactions.forEach(t => {
                    t.items.forEach(item => {
                        productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
                    });
                });

                const sorted = Object.entries(productSales)
                    .map(([name, qty]) => ({ name, quantitySold: qty }))
                    .sort((a, b) => b.quantitySold - a.quantitySold)
                    .slice(0, 5); // Top 5

                const maxQty = sorted.length > 0 ? sorted[0].quantitySold : 0;

                return sorted.map(item => ({
                    ...item,
                    percentage: maxQty > 0 ? (item.quantitySold / maxQty) * 100 : 0
                }));
            })
        );
    }

    ngOnInit(): void { }
}