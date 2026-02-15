import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { User, UserRole } from './core/models/user.model';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="user-container">
      <h2>User Management</h2>
      
      <div class="actions-bar">
        <button class="add-btn" (click)="openModal()">+ Add New User</button>
      </div>

      <div class="user-list">
        <table *ngIf="(users$ | async)?.length > 0; else noUsers">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users$ | async">
              <td>{{ user.username }}</td>
              <td><span class="role-badge" [ngClass]="user.role.toLowerCase()">{{ user.role }}</span></td>
              <td class="actions">
                <button class="edit-btn" (click)="openModal(user)">Edit</button>
                <button class="delete-btn" (click)="deleteUser(user)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noUsers>
          <div class="no-data">No users found.</div>
        </ng-template>
      </div>

      <!-- Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit User' : 'Add User' }}</h3>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <form (ngSubmit)="saveUser()">
            <div class="form-group">
              <label>Username *</label>
              <input type="text" [(ngModel)]="currentUser.username" name="username" required>
            </div>
            <div class="form-group">
              <label>Role *</label>
              <select [(ngModel)]="currentUser.role" name="role" required>
                <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ isEditing ? 'New Password (leave blank to keep current)' : 'Password *' }}</label>
              <input type="password" [(ngModel)]="passwordInput" name="password" [required]="!isEditing">
            </div>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" (click)="closeModal()">Cancel</button>
              <button type="submit" class="save-btn" [disabled]="!currentUser.username || (!isEditing && !passwordInput)">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .user-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
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
    
    .role-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 500; }
    .role-badge.admin { background: #e74c3c; color: white; }
    .role-badge.pharmacist { background: #3498db; color: white; }
    .role-badge.cashier { background: #2ecc71; color: white; }

    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 1.5em; cursor: pointer; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .save-btn { background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
    .save-btn:disabled { background: #ccc; cursor: not-allowed; }
    .cancel-btn { background: #95a5a6; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
  `]
})
export class UserManagementComponent implements OnInit {
    users$: Observable<User[]>;
    showModal = false;
    isEditing = false;
    currentUser: Partial<User> = {};
    passwordInput = '';
    roles = Object.values(UserRole);

    constructor(
        private authService: AuthService,
        private notificationService: NotificationService
    ) {
        this.users$ = this.authService.users$;
    }

    ngOnInit(): void { }

    openModal(user?: User): void {
        this.showModal = true;
        this.passwordInput = '';
        if (user) {
            this.isEditing = true;
            this.currentUser = { ...user };
        } else {
            this.isEditing = false;
            this.currentUser = { role: UserRole.Cashier }; // Default role
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.currentUser = {};
        this.passwordInput = '';
    }

    saveUser(): void {
        if (!this.currentUser.username || !this.currentUser.role) return;

        if (this.isEditing && this.currentUser.id) {
            const updatedUser = { ...this.currentUser } as User;
            if (this.passwordInput) {
                updatedUser.passwordHash = this.passwordInput;
            }
            this.authService.updateUser(updatedUser);
            this.notificationService.show('User updated successfully', 'success');
        } else {
            if (!this.passwordInput) return;
            const newUser = { ...this.currentUser, passwordHash: this.passwordInput } as Omit<User, 'id'>;
            this.authService.addUser(newUser);
            this.notificationService.show('User added successfully', 'success');
        }
        this.closeModal();
    }

    deleteUser(user: User): void {
        if (user.username === 'admin') {
             this.notificationService.show('Cannot delete the main admin user.', 'warning');
             return;
        }
        if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
            this.authService.deleteUser(user.id);
            this.notificationService.show('User deleted', 'info');
        }
    }
}