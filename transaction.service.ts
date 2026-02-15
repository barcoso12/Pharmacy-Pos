import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transaction, SuspendedSale } from '../models/transaction.model';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
    public transactions$ = this.transactionsSubject.asObservable();

    private suspendedSalesSubject = new BehaviorSubject<SuspendedSale[]>([]);
    public suspendedSales$ = this.suspendedSalesSubject.asObservable();

    constructor() { }

    /**
     * Adds a completed transaction to the history log.
     */
    logTransaction(transaction: Transaction): void {
        const currentTransactions = this.transactionsSubject.value;
        this.transactionsSubject.next([transaction, ...currentTransactions]); // Add new transactions to the top
    }

    /**
     * Returns an observable list of transactions for a specific date.
     */
    getDailyTransactions(date: Date): Observable<Transaction[]> {
        // Normalize the date to start and end of day for accurate filtering
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.transactions$.pipe(
            map(transactions => transactions.filter(tx =>
                tx.date >= startOfDay && tx.date <= endOfDay
            ))
        );
    }

    /**
     * Returns an observable list of transactions for a specific month and year.
     * @param year The year (e.g., 2023).
     * @param month The month (0-indexed, e.g., 0 for January, 11 for December).
     */
    getMonthlyTransactions(year: number, month: number): Observable<Transaction[]> {
        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        // Get the last day of the month by going to the next month and subtracting one day
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        return this.transactions$.pipe(
            map(transactions => transactions.filter(tx =>
                tx.date >= startOfMonth && tx.date <= endOfMonth
            ))
        );
    }

    suspendSale(sale: SuspendedSale): void {
        const current = this.suspendedSalesSubject.value;
        this.suspendedSalesSubject.next([sale, ...current]);
    }

    removeSuspendedSale(id: string): void {
        const current = this.suspendedSalesSubject.value;
        this.suspendedSalesSubject.next(current.filter(s => s.id !== id));
    }
}