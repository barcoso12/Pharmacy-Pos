import { CartItem } from './cart-item.model';

export type PaymentMethod = 'Cash' | 'Card' | 'GCash' | 'Maya';

export interface Payment {
    method: PaymentMethod;
    amount: number;
}

export interface Transaction {
    id: string;
    date: Date;
    items: CartItem[];
    payments: Payment[];
    subtotal: number;
    discountValue?: number;
    discountType?: 'percentage' | 'fixed';
    discountAmount?: number;
    couponCode?: string;
    couponDiscountAmount?: number;
    totalAmount: number; // This is the final amount after discount
    totalProfit: number;
    customerId?: string;
    customerName?: string;
}

export interface SuspendedSale {
    id: string;
    date: Date;
    items: CartItem[];
    subtotal: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    totalAmount: number;
    note?: string;
    customerId?: string;
    customerName?: string;
}