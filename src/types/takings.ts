// src/types/takings.ts
export interface Taking {
    id: string;
    entry_date: string;
    pos_amount: number;
    eft_amount: number;
    cash_amount: number;
    cash_float: number;
    notes?: string;
    gross_takings: number;
    cash_to_bank: number;
    created_at: string;
    updated_at: string;
    created_by?: string;
  }
  
  export interface TakingsSummary {
    totalGross: number;
    totalPOS: number;
    totalEFT: number;
    totalCash: number;
    totalCashToBank: number;
  }
  
  export interface TakingsFormData {
    entry_date: string;
    pos_amount: number;
    eft_amount: number;
    cash_amount: number;
    notes?: string;
  }