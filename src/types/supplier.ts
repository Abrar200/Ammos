export interface Supplier {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    supplier_type: string;
    payment_frequency: string;
    amount_per_period: number;
    monthly_total: number;
    image_url?: string | null;
    tags?: string[];
    notes?: string;
    created_at?: string;
    updated_at?: string;
}