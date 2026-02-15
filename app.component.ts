import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { User, UserRole } from './core/models/user.model';
import { AuthService } from './core/services/auth.service';
import { NotificationComponent } from './notification/notification.component';
import { HasRoleDirective } from './core/directives/has-role.directive';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent, HasRoleDirective],
    template: `
    <div class="app-container">
      <app-notification></app-notification>
      <nav class="main-nav" *ngIf="currentUser$ | async">
        <div class="nav-logo">
          <h3>Pharmacy POS</h3>
          <div *ngIf="currentUser$ | async as user" class="user-info">
            <span>{{ user.username }} ({{ user.role }})</span>
            <button (click)="logout()" class="logout-btn">Logout</button>
          </div>
        </div>
        <ul>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier]"><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier]"><a routerLink="/pos" routerLinkActive="active">Point of Sale</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist]"><a routerLink="/inventory" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Inventory List</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist]"><a routerLink="/inventory/add" routerLinkActive="active">Add Product</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist]"><a routerLink="/reports/daily" routerLinkActive="active">Daily Report</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist]"><a routerLink="/reports/monthly" routerLinkActive="active">Monthly Report</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist]"><a routerLink="/history" routerLinkActive="active">History</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier]"><a routerLink="/returns" routerLinkActive="active">Process Returns</a></li>
          <li *appHasRole="[UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier]"><a routerLink="/customers" routerLinkActive="active">Customers</a></li>
          <li *appHasRole="[UserRole.Admin]"><a routerLink="/admin" routerLinkActive="active">Admin Dashboard</a></li>
        </ul>
        <ul class="nav-footer">
          <li *appHasRole="[UserRole.Admin]"><a routerLink="/admin/users" routerLinkActive="active">User Management</a></li>
          <li *appHasRole="[UserRole.Admin]"><a routerLink="/settings" routerLinkActive="active">Settings</a></li>
        </ul>
      </nav>
      <main class="content" [class.full-width]="!(currentUser$ | async)">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    .app-container { display: flex; height: 100vh; }
    .main-nav {
      width: 240px;
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 20px 10px;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .main-nav ul { list-style: none; padding: 0; margin: 0; }
    .nav-logo {
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.4em;
    }
    .user-info { font-size: 0.7em; color: #bdc3c7; margin-top: 10px; }
    .user-info span { display: block; margin-bottom: 5px; }
    .logout-btn {
      background: #e74c3c; color: white; border: none; border-radius: 4px;
      padding: 4px 8px; font-size: 0.9em; cursor: pointer; margin-top: 5px; width: 100%;
    }
    .logout-btn:hover { background: #c0392b; }
    .main-nav ul { list-style: none; padding: 0; margin: 0; }
    .main-nav li a {
      display: block;
      padding: 15px 20px;
      color: #ecf0f1;
      text-decoration: none;
      border-radius: 5px;
      transition: background-color 0.2s;
      margin-bottom: 5px;
    }
    .main-nav li a:hover { background-color: #34495e; }
    .main-nav li a.active {
      background-color: #2ecc71;
      color: white;
      font-weight: 500;
    }
    .nav-footer {
      margin-top: auto;
    }
    .content { flex: 1; overflow-y: auto; background-color: #ecf0f1; }
    .content.full-width {
      height: 100vh;
      overflow: auto;
    }
  `]
})
export class AppComponent {
  currentUser$: Observable<User | null>;
  UserRole = UserRole; // Expose enum to the template

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
  }
}