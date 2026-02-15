import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppSettings } from '../core/models/settings.model';
import { SettingsService } from '../core/services/settings.service';
import { NotificationService } from '../core/services/notification.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="settings-container">
      <h2>Application Settings</h2>
      <form #settingsForm="ngForm" (ngSubmit)="onSubmit(settingsForm)" class="settings-form" *ngIf="currentSettings">
        <div class="form-section">
          <h4>Business Information</h4>
          <div class="form-group">
            <label for="pharmacyName">Pharmacy Name</label>
            <input type="text" id="pharmacyName" name="pharmacyName" [(ngModel)]="currentSettings.pharmacyName" required>
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <input type="text" id="address" name="address" [(ngModel)]="currentSettings.address">
          </div>
          <div class="form-group">
            <label for="contactPhone">Contact Phone</label>
            <input type="tel" id="contactPhone" name="contactPhone" [(ngModel)]="currentSettings.contactPhone">
          </div>
        </div>

        <div class="form-section">
          <h4>Financial Settings</h4>
          <div class="form-group">
            <label for="defaultTaxRate">Default Tax Rate (%)</label>
            <input type="number" id="defaultTaxRate" name="defaultTaxRate" [(ngModel)]="currentSettings.defaultTaxRate" required min="0" max="100">
          </div>
        </div>

        <button type="submit" class="submit-btn" [disabled]="settingsForm.invalid">Save Settings</button>
      </form>
    </div>
  `,
    styles: [`
    .settings-container { padding: 20px; max-width: 800px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2c3e50; margin-bottom: 25px; }
    .form-section { margin-bottom: 25px; border-top: 1px solid #eee; padding-top: 20px; }
    .form-section h4 { color: #34495e; margin-bottom: 15px; font-size: 1.2em; }
    .form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
    .form-group label { margin-bottom: 8px; font-weight: 500; color: #555; font-size: 0.9em; }
    .form-group input { padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 1em; transition: border-color 0.2s; }
    .form-group input:focus { border-color: #2ecc71; outline: none; }
    .submit-btn { width: 100%; padding: 15px; background: #2ecc71; color: white; border: none; border-radius: 5px; font-size: 1.2em; cursor: pointer; transition: background-color 0.2s; }
    .submit-btn:hover { background: #27ae60; }
    .submit-btn:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
    currentSettings: AppSettings | null = null;
    private settingsSubscription?: Subscription;

    constructor(
        private settingsService: SettingsService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.settingsSubscription = this.settingsService.settings$.subscribe(settings => {
            // Create a copy to avoid direct mutation on the service's state via ngModel
            this.currentSettings = { ...settings };
        });
    }

    ngOnDestroy(): void {
        this.settingsSubscription?.unsubscribe();
    }

    onSubmit(form: NgForm): void {
        if (form.invalid || !this.currentSettings) {
            this.notificationService.show('Please fill all required fields correctly.', 'error');
            return;
        }
        this.settingsService.saveSettings(this.currentSettings);
        this.notificationService.show('Settings saved successfully!', 'success');
    }
}