import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PosComponent } from './pos/pos.component';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { AddProductComponent } from './add-product/add-product.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { DailySalesComponent } from './daily-sales-report/daily-sales-report.component';
import { MonthlySalesComponent } from './monthly-sales-report/monthly-sales-report.component';
import { TransactionHistoryComponent } from './transaction-history/transaction-history.component';
import { ProductReturnComponent } from './product-return/product-return.component';
import { SettingsComponent } from './settings/settings.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { UserRole } from './core/models/user.model';
import { CustomerManagementComponent } from './customer-management.component';
import { UserManagementComponent } from './user-management.component';

export const APP_ROUTES: Routes = [
    { path: 'login', component: LoginComponent, title: 'Login' },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, title: 'Dashboard', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier] } },
    { path: 'pos', component: PosComponent, title: 'Point of Sale', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier] } },
    {
        path: 'inventory',
        title: 'Inventory',
        canActivate: [AuthGuard],
        data: { roles: [UserRole.Admin, UserRole.Pharmacist] },
        children: [
            { path: '', component: InventoryListComponent },
            { path: 'add', component: AddProductComponent, title: 'Add Product' },
            { path: 'edit/:id', component: EditProductComponent, title: 'Edit Product' },
        ]
    },
    { path: 'reports/daily', component: DailySalesComponent, title: 'Daily Report', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist] } },
    { path: 'reports/monthly', component: MonthlySalesComponent, title: 'Monthly Report', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist] } },
    { path: 'history', component: TransactionHistoryComponent, title: 'Transaction History', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist] } },
    { path: 'returns', component: ProductReturnComponent, title: 'Process Returns', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier] } },
    { path: 'customers', component: CustomerManagementComponent, title: 'Customer Management', canActivate: [AuthGuard], data: { roles: [UserRole.Admin, UserRole.Pharmacist, UserRole.Cashier] } },
    { path: 'settings', component: SettingsComponent, title: 'Settings', canActivate: [AuthGuard], data: { roles: [UserRole.Admin] } },
    { path: 'admin/users', component: UserManagementComponent, title: 'User Management', canActivate: [AuthGuard], data: { roles: [UserRole.Admin] } },
    { path: 'admin', component: AdminDashboardComponent, title: 'Admin Dashboard', canActivate: [AuthGuard], data: { roles: [UserRole.Admin] } },
    // Wildcard route for a 404 page or redirect
    { path: '**', redirectTo: 'login' }
];