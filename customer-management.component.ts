import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Customer } from './core/models/customer.model';
import { UserRole } from './core/models/user.model';
import { HasRoleDirective } from './core/directives/has-role.directive';
import { CustomerService } from './core/services/customer.service';
import { NotificationService } from './core/services/notification.service';

@Component({
    selector: 'app-customer-management',
    standalone: true,
    imports: [CommonModule, FormsModule, HasRoleDirective],
    template: `
    <div class="customer-container">
      <h2>Customer Management</h2>
      
      <div class="actions-bar">
        <button class="add-btn" (click)="openModal()">+ Add New Customer</button>
      </div>

      <div class="customer-list">
        <table *ngIf="(customers$ | async)?.length > 0; else noCustomers">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let customer of customers$ | async">
              <td>{{ customer.name }}</td>
              <td>{{ customer.phone || '-' }}</td>
              <td>{{ customer.email || '-' }}</td>
              <td>{{ customer.address || '-' }}</td>
              <td class="actions">
                <button class="edit-btn" (click)="openModal(customer)">Edit</button>
                <button class="delete-btn" *appHasRole="[UserRole.Admin]" (click)="deleteCustomer(customer)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noCustomers>
          <div class="no-data">No customers found.</div>
        </ng-template>
      </div>

      <!-- Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Customer' : 'Add Customer' }}</h3>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <form (ngSubmit)="saveCustomer()">
            <div class="form-group">
              <label>Name *</label>
              <input type="text" [(ngModel)]="currentCustomer.name" name="name" required>
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="text" [(ngModel)]="currentCustomer.phone" name="phone">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="currentCustomer.email" name="email">
            </div>
            <div class="form-group">
              <label>Address</label>
              <textarea [(ngModel)]="currentCustomer.address" name="address"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" (click)="closeModal()">Cancel</button>
              <button type="submit" class="save-btn" [disabled]="!currentCustomer.name">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .customer-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
    h2 { color: #2c3e50; margin-bottom: 20px; }
    .actions-bar { margin-bottom: 20px; }
    .add-btn { background: #2ecc71; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 1em; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; color: #333; }
    .actions button { margin-right: 5px; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; }
    .edit-btn { background: #3498db; color: white; }
    .delete-btn { background: #e74c3c; color: white; }
    .no-data { text-align: center; padding: 20px; color: #7f8c8d; background: white; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 1.5em; cursor: pointer; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .save-btn { background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
    .save-btn:disabled { background: #ccc; cursor: not-allowed; }
    .cancel-btn { background: #95a5a6; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
  `]
})
export class CustomerManagementComponent implements OnInit {
    customers$: Observable<Customer[]>;
    showModal = false;
    isEditing = false;
    currentCustomer: Partial<Customer> = {};
    protected readonly UserRole = UserRole;

    constructor(
        private customerService: CustomerService,
        private notificationService: NotificationService
    ) {
        this.customers$ = this.customerService.customers$;
    }

    ngOnInit(): void { }

    openModal(customer?: Customer): void {
        this.showModal = true;
        if (customer) {
            this.isEditing = true;
            this.currentCustomer = { ...customer };
        } else {
            this.isEditing = false;
            this.currentCustomer = {};
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.currentCustomer = {};
    }

    saveCustomer(): void {
        if (!this.currentCustomer.name) return;

        if (this.isEditing && this.currentCustomer.id) {
            this.customerService.updateCustomer(this.currentCustomer as Customer);
            this.notificationService.show('Customer updated successfully', 'success');
        } else {
            this.customerService.addCustomer(this.currentCustomer as Omit<Customer, 'id'>);
            this.notificationService.show('Customer added successfully', 'success');
        }
        this.closeModal();
    }

    deleteCustomer(customer: Customer): void {
        if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
            this.customerService.deleteCustomer(customer.id);
            this.notificationService.show('Customer deleted', 'info');
        }
    }
}