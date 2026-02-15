import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppSettings } from '../models/settings.model';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly STORAGE_KEY = 'pharmacy-pos-settings';

    private defaultSettings: AppSettings = {
        pharmacyName: 'My Pharmacy',
        address: '123 Health St, Wellness City',
        contactPhone: '555-123-4567',
        defaultTaxRate: 5,
    };

    private settingsSubject: BehaviorSubject<AppSettings>;
    public settings$: Observable<AppSettings>;

    constructor() {
        const savedSettings = this.loadSettingsFromStorage();
        this.settingsSubject = new BehaviorSubject<AppSettings>(savedSettings);
        this.settings$ = this.settingsSubject.asObservable();
    }

    private loadSettingsFromStorage(): AppSettings {
        try {
            const settingsJson = localStorage.getItem(this.STORAGE_KEY);
            return settingsJson ? JSON.parse(settingsJson) : this.defaultSettings;
        } catch (e) {
            console.error('Error loading settings from localStorage', e);
            return this.defaultSettings;
        }
    }

    public saveSettings(settings: AppSettings): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        this.settingsSubject.next(settings);
    }
}