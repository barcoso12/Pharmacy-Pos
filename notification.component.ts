import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../core/services/notification.service';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" class="toast" [ngClass]="toast.type">
        <span class="message">{{ toast.message }}</span>
        <button (click)="remove(toast.id)" class="close-btn">&times;</button>
      </div>
    </div>
  `,
    styles: [`
    .toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast { pointer-events: auto; min-width: 300px; padding: 15px; border-radius: 4px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-out; }
    .toast.success { background-color: #2ecc71; }
    .toast.error { background-color: #e74c3c; }
    .toast.info { background-color: #3498db; }
    .toast.warning { background-color: #f39c12; }
    .message { margin-right: 10px; }
    .close-btn { background: none; border: none; color: white; font-size: 1.5em; line-height: 0.8; cursor: pointer; opacity: 0.8; }
    .close-btn:hover { opacity: 1; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class NotificationComponent {
    toasts$ = this.notificationService.toasts$;

    constructor(public notificationService: NotificationService) { }

    remove(id: number) {
        this.notificationService.remove(id);
    }
}