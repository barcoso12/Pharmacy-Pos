export interface AppSettings {
    pharmacyName: string;
    address: string;
    contactPhone: string;
    defaultTaxRate: number; // Stored as a percentage, e.g., 5 for 5%
}