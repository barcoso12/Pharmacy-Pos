import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { AppSettings } from '../models/settings.model';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root'
})
export class ReceiptService {

    constructor(private notificationService: NotificationService) { }

    printReceipt(transaction: Transaction, settings: AppSettings | null): void {
        if (!settings) {
            this.notificationService.show('Cannot print receipt: Settings not loaded.', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
            this.notificationService.show('Popup blocked. Cannot print receipt.', 'warning');
            return;
        }

        const itemsHtml = transaction.items.map(item => `
            <tr>
                <td>${item.product.name}</td>
                <td style="text-align: center">${item.quantity}</td>
                <td style="text-align: right">${(item.product.sellingPrice * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const customerHtml = transaction.customerName ? `
            <div class="customer-info">
                <p>Customer: ${transaction.customerName}</p>
            </div>
        ` : '';

        let discountHtml = '';
        const manualDiscount = (transaction.discountAmount || 0) - (transaction.couponDiscountAmount || 0);

        if (manualDiscount > 0.01) {
            discountHtml += `
            <tr>
                <td colspan="2">Discount</td>
                <td style="text-align: right">-${manualDiscount.toFixed(2)}</td>
            </tr>`;
        }

        if (transaction.couponDiscountAmount && transaction.couponDiscountAmount > 0) {
            discountHtml += `
            <tr>
                <td colspan="2">Coupon (${transaction.couponCode})</td>
                <td style="text-align: right">-${transaction.couponDiscountAmount.toFixed(2)}</td>
            </tr>`;
        }

        let paymentsHtml = '';
        let changeHtml = '';

        if (transaction.payments && transaction.payments.length > 0) {
            paymentsHtml = transaction.payments.map(p => `
                <tr>
                    <td colspan="2">${p.method}</td>
                    <td style="text-align: right">${p.amount.toFixed(2)}</td>
                </tr>
            `).join('');

            const totalNonCashPaid = transaction.payments
                .filter(p => p.method !== 'Cash')
                .reduce((sum, p) => sum + p.amount, 0);
            
            const totalCashPaid = transaction.payments
                .filter(p => p.method === 'Cash')
                .reduce((sum, p) => sum + p.amount, 0);

            const cashRequired = Math.max(0, transaction.totalAmount - totalNonCashPaid);
            const changeDue = Math.max(0, totalCashPaid - cashRequired);

            if (changeDue > 0) {
                changeHtml = `
                    <tr>
                        <td colspan="2">Change Due</td>
                        <td style="text-align: right">${changeDue.toFixed(2)}</td>
                    </tr>
                `;
            }
        }

        const htmlContent = `
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; margin: 0; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
                    .meta { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .customer-info { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; border-bottom: 1px dashed #000; }
                    td { padding: 5px 0; }
                    .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                    .total-row { font-weight: bold; font-size: 14px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${settings.pharmacyName}</h2>
                    <p>${settings.address}</p>
                    <p>${settings.contactPhone}</p>
                </div>
                <div class="meta">
                    <p>Date: ${new Date(transaction.date).toLocaleString()}</p>
                    <p>Receipt #: ${transaction.id}</p>
                </div>
                ${customerHtml}
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: center">Qty</th>
                            <th style="text-align: right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div class="totals">
                    <table>
                        <tr>
                            <td colspan="2">Subtotal</td>
                            <td style="text-align: right">${transaction.subtotal.toFixed(2)}</td>
                        </tr>
                        ${discountHtml}
                        <tr class="total-row">
                            <td colspan="2">Total</td>
                            <td style="text-align: right">${transaction.totalAmount.toFixed(2)}</td>
                        </tr>
                        ${paymentsHtml ? '<tr><td colspan="3" style="padding: 5px 0; border-top: 1px dashed #000; margin-top: 5px;"></td></tr>' : ''}
                        ${paymentsHtml}
                        ${changeHtml}
                    </table>
                </div>
                <div class="footer">
                    <p>Thank you for your purchase!</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
}