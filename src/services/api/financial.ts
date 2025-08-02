/**
 * Financial Services
 * API calls for financial operations including outgoings, payroll, and transactions
 */

import { supabase } from '@/lib/supabase';

// Outgoings Service
export const outgoingsService = {
  /**
   * Get all outgoings with category breakdown
   */
  async getOutgoings(dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('outgoings')
      .select('*')
      .order('date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Create new outgoing expense
   */
  async createOutgoing(outgoingData: any) {
    const { data, error } = await supabase
      .from('outgoings')
      .insert([outgoingData])
      .select()
      .single();
    
    return { data, error };
  },
};

// Payroll Service
export const payrollService = {
  /**
   * Get payroll records for a specific period
   */
  async getPayrollRecords(period?: string) {
    let query = supabase
      .from('payroll_records')
      .select(`
        *,
        staff (
          name,
          employee_id,
          position
        )
      `)
      .order('pay_date', { ascending: false });

    if (period) {
      query = query.eq('pay_period', period);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Generate payroll for staff member
   */
  async generatePayroll(staffId: string, payPeriod: string, hoursWorked: number) {
    // This would typically call a Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-payroll', {
      body: {
        staffId,
        payPeriod,
        hoursWorked,
      },
    });

    return { data, error };
  },

  /**
   * Send payslip to staff member
   */
  async sendPayslip(payrollId: string, email: string) {
    const { data, error } = await supabase.functions.invoke('send-payslip', {
      body: {
        payrollId,
        email,
      },
    });

    return { data, error };
  },
};

// Award Rates Service
export const awardRatesService = {
  /**
   * Get current award rates
   */
  async getAwardRates() {
    const { data, error } = await supabase
      .from('award_rates')
      .select('*')
      .eq('is_active', true)
      .order('position');
    
    return { data, error };
  },

  /**
   * Update award rate
   */
  async updateAwardRate(id: string, updates: any) {
    const { data, error } = await supabase
      .from('award_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
};