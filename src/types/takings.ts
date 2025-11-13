// src/types/takings.ts
export interface Taking {
    id: string;
    entry_date: string;
    pos_amount: number;
    eft_amount: number;
    cash_amount: number;
    cash_float: number;
    notes?: string;
    gross_takings: number; // EFT + (Cash - 300)
    cash_to_bank: number;  // Cash - 300 (Psila)
    created_at: string;
    updated_at: string;
    created_by?: string;
  }
  
  export interface TakingsSummary {
    totalGross: number;    // Total of (EFT + Psila)
    totalPOS: number;
    totalEFT: number;
    totalCash: number;
    totalPsila: number;    // Total of (Cash - 300)
  }
  
  export interface TakingsFormData {
    entry_date: string;
    pos_amount: number;
    eft_amount: number;
    cash_amount: number;
    notes?: string;
  }