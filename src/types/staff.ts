// types/staff.ts - Centralized staff type definitions
export interface Staff {
    id: string;
    full_name: string;
    email: string;
    position: string;
    hourly_rate: number;
    employment_type: string;
    avatar_url?: string;
    phone?: string;
    is_active: boolean;
    date_of_birth?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    start_date?: string;
    tax_file_number?: string;
    super_fund_name?: string;
    super_member_number?: string;
    bank_account_name?: string;
    bank_bsb?: string;
    bank_account_number?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface StaffCardData {
    id: string;
    name: string; // Maps to full_name
    email: string;
    position: string;
    hourly_rate: number;
    employment_type: string;
    image_url?: string; // Maps to avatar_url
    phone?: string;
    is_active: boolean;
}

export interface PayrollRecord {
    regular_hours: number;
    id: string;
    staff_id: string;
    pay_period_start: string;
    pay_period_end: string;
    hours_worked: number;
    gross_pay: number;
    net_pay: number;
    created_at: string;
    staff: { full_name: string };
}

export interface ExpiringCertification {
    id: string;
    staff_id: string;
    certification_type: string;
    certification_name: string;
    expiry_date: string;
    staff: { full_name: string };
}