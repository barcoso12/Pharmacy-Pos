import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    // Holds the current state of products
    private productsSubject = new BehaviorSubject<Product[]>([]);
    public products$ = this.productsSubject.asObservable();

    constructor() { }

    /**
     * Adds a new product to the inventory
     */
    addProduct(product: Product): void {
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next([...currentProducts, product]);
    }

    /**
     * Deletes a product from the inventory.
     */
    deleteProduct(productId: string): void {
        const currentProducts = this.productsSubject.value;
        const updatedProducts = currentProducts.filter(p => p.id !== productId);
        if (updatedProducts.length < currentProducts.length) {
            this.productsSubject.next(updatedProducts);
        } else {
            console.warn(`Product with ID ${productId} not found for deletion.`);
        }
    }

    /**
     * Adds stock back to a product. Returns true if successful, false if product not found.
     */
    addStock(productId: string, quantity: number): boolean {
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex(p => p.id === productId);

        if (index === -1) {
            console.warn(`Product with ID ${productId} not found for stock addition.`);
            return false;
        }

        const product = currentProducts[index];
        const updatedProduct = { ...product, stockQuantity: product.stockQuantity + quantity };
        const updatedProducts = [...currentProducts];
        updatedProducts[index] = updatedProduct;
        this.productsSubject.next(updatedProducts);
        return true;
    }

    /**
     * Deducts stock for a sale. Returns true if successful, false if insufficient stock.
     */
    deductStock(productId: string, quantity: number): boolean {
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex(p => p.id === productId);

        if (index === -1) return false;

        const product = currentProducts[index];
        if (product.stockQuantity < quantity) return false;

        // Create updated product with new quantity
        const updatedProduct = {
            ...product,
            stockQuantity: product.stockQuantity - quantity
        };

        // Update state immutably
        const updatedProducts = [...currentProducts];
        updatedProducts[index] = updatedProduct;
        this.productsSubject.next(updatedProducts);

        return true;
    }

    /**
     * Gets a single product by its ID.
     */
    getProductById(id: string): Observable<Product | undefined> {
        return this.products$.pipe(
            map(products => products.find(p => p.id === id))
        );
    }

    /**
     * Updates an existing product in the inventory.
     */
    updateProduct(updatedProduct: Product): void {
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex(p => p.id === updatedProduct.id);

        if (index !== -1) {
            const updatedProducts = [...currentProducts];
            updatedProducts[index] = updatedProduct;
            this.productsSubject.next(updatedProducts);
        } else {
            console.error(`Product with id ${updatedProduct.id} not found. Cannot update.`);
        }
    }

    /**
     * Returns a list of products expiring within the given days threshold.
     */
    getExpiringProducts(daysThreshold: number = 30): Observable<Product[]> {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        return this.products$.pipe(
            map(products => products.filter(p => new Date(p.expiryDate) <= thresholdDate))
        );
    }

    /**
     * Returns an observable list of products that are at or below their minimum stock level.
     */
    getLowStockProducts(): Observable<Product[]> {
        return this.products$.pipe(
            map(products => products.filter(p => p.stockQuantity <= p.minStockLevel))
        );
    }
}