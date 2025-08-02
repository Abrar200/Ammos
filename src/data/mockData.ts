// Updated src/data/mockData.ts - Fix supplier interface
export const mockStats = {
  totalRevenue: 85420,
  totalExpenses: 42315,
  profit: 43105,
  suppliers: 24
};

export const mockWeeklyData = {
  weeklyTarget: 50000,
  currentWeekRevenue: 18320,
  currentWeekExpenses: 12450
};

// Fixed suppliers data to match Supplier interface
export const mockSuppliers = [
  {
    id: 1,
    name: 'Fresh Foods Wholesale',
    email: 'orders@freshfoods.com.au',
    phone: '+61 8 8234 5678',
    address: '123 Market Street, Adelaide SA 5000',
    supplier_type: 'Food & Beverage',
    type: 'Food & Beverage', // Duplicate for compatibility
    payment_frequency: 'weekly',
    frequency: 'weekly', // Duplicate for compatibility
    amount_per_period: 3850.50,
    amount: 3850.50, // Duplicate for compatibility
    monthlyTotal: 15420.50,
    image_url: null,
    tags: ['fresh-produce', 'vegetables', 'fruits'],
    notes: 'Primary supplier for fresh produce and vegetables'
  },
  {
    id: 2,
    name: 'Premium Meats Co',
    email: 'sales@premiummeats.com.au',
    phone: '+61 8 8345 6789',
    address: '456 Butcher Lane, Adelaide SA 5001',
    supplier_type: 'Food & Beverage',
    type: 'Food & Beverage',
    payment_frequency: 'weekly',
    frequency: 'weekly',
    amount_per_period: 2057.69,
    amount: 2057.69,
    monthlyTotal: 8230.75,
    image_url: null,
    tags: ['meat', 'lamb', 'beef', 'premium'],
    notes: 'Specialist in premium Australian lamb and beef'
  },
  {
    id: 3,
    name: 'Greek Imports Ltd',
    email: 'info@greekimports.com.au',
    phone: '+61 8 8456 7890',
    address: '789 Heritage Avenue, Adelaide SA 5002',
    supplier_type: 'Food & Beverage',
    type: 'Food & Beverage',
    payment_frequency: 'monthly',
    frequency: 'monthly',
    amount_per_period: 5680.00,
    amount: 5680.00,
    monthlyTotal: 5680.00,
    image_url: null,
    tags: ['greek', 'imported', 'specialty', 'authentic'],
    notes: 'Authentic Greek ingredients and specialty items'
  },
  {
    id: 4,
    name: 'Wine & Spirits Direct',
    email: 'orders@winespirits.com.au',
    phone: '+61 8 8567 8901',
    address: '321 Vine Street, Adelaide SA 5003',
    supplier_type: 'Beverages',
    type: 'Beverages',
    payment_frequency: 'monthly',
    frequency: 'monthly',
    amount_per_period: 3450.25,
    amount: 3450.25,
    monthlyTotal: 3450.25,
    image_url: null,
    tags: ['wine', 'spirits', 'greek-wine', 'beverages'],
    notes: 'Greek wines and premium spirits supplier'
  },
  {
    id: 5,
    name: 'Restaurant Equipment Co',
    email: 'service@restaurantequip.com.au',
    phone: '+61 8 8678 9012',
    address: '654 Industrial Drive, Adelaide SA 5004',
    supplier_type: 'Equipment',
    type: 'Equipment',
    payment_frequency: 'quarterly',
    frequency: 'quarterly',
    amount_per_period: 963.33,
    amount: 963.33,
    monthlyTotal: 2890.00,
    image_url: null,
    tags: ['equipment', 'maintenance', 'commercial', 'kitchen'],
    notes: 'Commercial kitchen equipment and maintenance services'
  },
  {
    id: 6,
    name: 'Adelaide Cleaning Services',
    email: 'bookings@adelaidecleaning.com.au',
    phone: '+61 8 8789 0123',
    address: '987 Service Road, Adelaide SA 5005',
    supplier_type: 'Cleaning',
    type: 'Cleaning',
    payment_frequency: 'weekly',
    frequency: 'weekly',
    amount_per_period: 420.00,
    amount: 420.00,
    monthlyTotal: 1680.00,
    image_url: null,
    tags: ['cleaning', 'commercial', 'hygiene', 'weekly'],
    notes: 'Weekly deep cleaning and hygiene services'
  }
];

export const mockExpenseData = [
  { name: 'Food & Beverage', amount: 18500 },
  { name: 'Staff Wages', amount: 12800 },
  { name: 'Utilities', amount: 3200 },
  { name: 'Rent', amount: 5500 },
  { name: 'Equipment', amount: 2315 }
];

// Alternative: Create types file to ensure consistency
// src/types/supplier.ts
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

// Alternative simplified version if you want to update SupplierList component instead:
export const mockSuppliersSimple = [
  {
    id: 1,
    name: 'Fresh Foods Wholesale',
    type: 'Food & Beverage',
    frequency: 'weekly',
    amount: 3850.50,
    monthlyTotal: 15420.50
  },
  {
    id: 2,
    name: 'Premium Meats Co',
    type: 'Food & Beverage',
    frequency: 'weekly',
    amount: 2057.69,
    monthlyTotal: 8230.75
  },
  {
    id: 3,
    name: 'Greek Imports Ltd',
    type: 'Food & Beverage',
    frequency: 'monthly',
    amount: 5680.00,
    monthlyTotal: 5680.00
  },
  {
    id: 4,
    name: 'Wine & Spirits Direct',
    type: 'Beverages',
    frequency: 'monthly',
    amount: 3450.25,
    monthlyTotal: 3450.25
  },
  {
    id: 5,
    name: 'Restaurant Equipment Co',
    type: 'Equipment',
    frequency: 'quarterly',
    amount: 963.33,
    monthlyTotal: 2890.00
  }
];