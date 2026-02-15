export interface Product {
    id: string;
    name: string;           // Brand name (e.g., Panadol Extra)
    genericName: string;    // Active ingredient (e.g., Paracetamol)
    sku: string;            // Stock Keeping Unit for internal tracking
    barcode: string;        // UPC/EAN for scanning
    description?: string;

    // Pricing
    costPrice: number;
    sellingPrice: number;
    taxRate: number;

    // Inventory & Compliance
    stockQuantity: number;
    minStockLevel: number;  // Alert threshold
    expiryDate: Date;       // Critical for pharmacy compliance
    batchNumber: string;    // For tracking recalls
    requiresPrescription: boolean;
    category: 'Medicine' | 'Supplement' | 'Equipment' | 'Other';
}