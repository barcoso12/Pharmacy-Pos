import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();
    private counter = 0;

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
        const id = this.counter++;
        const newToast: Toast = { id, message, type };
        this.toastsSubject.next([...this.toastsSubject.value, newToast]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => this.remove(id), 3000);
    }

    remove(id: number): void {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
    }
}