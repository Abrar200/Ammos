/**
 * Supplier Management Service
 * API calls for supplier-related operations
 */

import { supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'active' | 'inactive';
  payment_terms: string;
  created_at: string;
  updated_at: string;
}

export const supplierService = {
  /**
   * Get all suppliers with optional filtering
   */
  async getSuppliers(filters?: { category?: string; status?: string }) {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  /**
   * Create new supplier
   */
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Update supplier
   */
  async updateSupplier(id: string, updates: Partial<Supplier>) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string) {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  /**
   * Upload supplier image
   */
  async uploadSupplierImage(supplierId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${supplierId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('supplier-images')
      .upload(fileName, file);
    
    if (error) return { data: null, error };
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('supplier-images')
      .getPublicUrl(fileName);
    
    return { data: { path: fileName, url: publicUrl }, error: null };
  },
};