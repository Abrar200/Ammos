/**
 * Supabase Service Layer
 * Centralized API calls and database operations
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// Authentication Services
export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current user session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  /**
   * Get current user profile with role information
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_roles (
          role,
          permissions
        )
      `)
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  },
};

// Staff Management Services
export const staffService = {
  /**
   * Get all staff members
   */
  async getStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name');
    
    return { data, error };
  },

  /**
   * Get staff member by ID
   */
  async getStaffById(id: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  /**
   * Create new staff member
   */
  async createStaff(staffData: any) {
    const { data, error } = await supabase
      .from('staff')
      .insert([staffData])
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Update staff member
   */
  async updateStaff(id: string, updates: any) {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
};