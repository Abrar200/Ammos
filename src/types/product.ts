// src/types/product.ts
export interface ProductCategory {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Supplier {
    id: string;
    name: string;
    supplier_type?: string;
    // Add other supplier fields as needed
  }
  
  export interface Product {
    id: string;
    supplier_id: string;
    category_id: string;
    name: string;
    code: string;
    description?: string;
    unit: string;
    cost_per_unit: number;
    unit_type: string;
    min_price?: number;
    max_price?: number;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
    supplier_name?: string;
    category_name?: string;
    // Add joined relations
    suppliers?: Supplier;
    product_categories?: ProductCategory;
  }
  
  export interface ProductOrder {
    id: string;
    supplier_id: string;
    order_date: string;
    status: 'pending' | 'ordered' | 'delivered' | 'cancelled';
    total_amount: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    supplier_name?: string;
    items?: ProductOrderItem[];
  }
  
  export interface ProductOrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    notes?: string;
    created_at: string;
    product_name?: string;
    product_code?: string;
  }
  
  export interface ProductFormData {
    supplier_id: string;
    category_id: string;
    name: string;
    code: string;
    description?: string;
    unit: string;
    cost_per_unit: number;
    unit_type: string;
    min_price?: number;
    max_price?: number;
    is_active: boolean;
    notes?: string;
  }