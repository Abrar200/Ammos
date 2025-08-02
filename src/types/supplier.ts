export interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    supplier_type: string;
    type: string; // For backward compatibility
    payment_frequency: string;
    frequency: string; // For backward compatibility  
    amount_per_period: number;
    amount: number; // For backward compatibility
    monthlyTotal: number;
    image_url?: string | null;
    tags?: string[];
    notes?: string;
}