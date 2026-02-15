import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { InventoryService } from './inventory.service';
import { Product } from '../models/product.model';
import { NotificationService } from './notification.service';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class BarcodeScannerService implements OnDestroy {
    private readonly KEY_ENTER = 'Enter';
    private barcode = '';
    private productScannedSource = new Subject<Product>();

    // Public observable for components to subscribe to
    public productScanned$ = this.productScannedSource.asObservable();

    private keydownListener: (event: KeyboardEvent) => void;
    private barcodeTimeout: any;

    constructor(
        private inventoryService: InventoryService,
        private notificationService: NotificationService,
        private ngZone: NgZone
    ) {
        // Define the listener function once
        this.keydownListener = (event: KeyboardEvent) => {
            this.handleKeydown(event);
        };
        this.listenForBarcode();
    }

    private listenForBarcode(): void {
        // Run outside angular zone to prevent change detection on every keypress
        this.ngZone.runOutsideAngular(() => {
            document.addEventListener('keydown', this.keydownListener);
        });
    }

    private handleKeydown(event: KeyboardEvent): void {
        // Ignore keys if an input, textarea, or select element is focused
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            return;
        }

        // Most scanners send characters very fast and end with an Enter key.
        // We can use a small timeout to reset the buffer if keys are typed too slowly,
        // distinguishing a scan from manual typing.
        if (this.barcodeTimeout) {
            clearTimeout(this.barcodeTimeout);
        }
        this.barcodeTimeout = setTimeout(() => this.barcode = '', 100);

        if (event.key === this.KEY_ENTER) {
            if (this.barcode) {
                this.processBarcode(this.barcode);
                this.barcode = ''; // Reset barcode
                clearTimeout(this.barcodeTimeout); // Don't reset after a successful scan
            }
        } else if (event.key.length === 1) { // Only append single, printable characters
            this.barcode += event.key;
        }
    }

    private processBarcode(barcode: string): void {
        // Use first() to automatically unsubscribe after one emission
        this.inventoryService.products$.pipe(first()).subscribe(products => {
            const product = products.find(p => p.barcode === barcode);

            // Run updates back inside the Angular zone
            this.ngZone.run(() => {
                if (product) {
                    this.productScannedSource.next(product);
                } else {
                    this.notificationService.show(`Product with barcode "${barcode}" not found.`, 'warning');
                }
            }
        });
    }

    ngOnDestroy(): void {
        // Clean up the event listener and any pending timeout
        document.removeEventListener('keydown', this.keydownListener);
        if (this.barcodeTimeout) {
            clearTimeout(this.barcodeTimeout);
        }
    }
}