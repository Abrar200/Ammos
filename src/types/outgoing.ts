// src/types/outgoing.ts
export interface Outgoing {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    supplier?: string;
    type: 'supplier' | 'subscription' | 'payroll' | 'other';
    payment_frequency?: string;
    notes?: string;
  }
  
  export interface OutgoingSummary {
    total: number;
    count: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  }