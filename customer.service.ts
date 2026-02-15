import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from '../models/customer.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private customersSubject = new BehaviorSubject<Customer[]>([]);
    public customers$ = this.customersSubject.asObservable();

    constructor() {
        // Load initial mock data
        const initialCustomers: Customer[] = [
            { id: 'cust_1', name: 'John Doe', phone: '555-0101', email: 'john.d@example.com' },
            { id: 'cust_2', name: 'Jane Smith', phone: '555-0102', address: '456 Oak Ave' }
        ];
        this.customersSubject.next(initialCustomers);
    }

    addCustomer(customer: Omit<Customer, 'id'>): Customer {
        const newCustomer: Customer = {
            ...customer,
            id: `cust_${Date.now()}`
        };
        const currentCustomers = this.customersSubject.value;
        this.customersSubject.next([...currentCustomers, newCustomer]);
        return newCustomer;
    }

    updateCustomer(customer: Customer): void {
        const currentCustomers = this.customersSubject.value;
        const index = currentCustomers.findIndex(c => c.id === customer.id);
        if (index !== -1) {
            const updatedCustomers = [...currentCustomers];
            updatedCustomers[index] = customer;
            this.customersSubject.next(updatedCustomers);
        }
    }

    deleteCustomer(id: string): void {
        const currentCustomers = this.customersSubject.value;
        this.customersSubject.next(currentCustomers.filter(c => c.id !== id));
    }
}