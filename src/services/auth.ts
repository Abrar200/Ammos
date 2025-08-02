/**
 * Authentication Service
 * Handles all authentication-related operations including password reset
 */

import { supabase } from '@/lib/supabase';

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
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  /**
   * Update password (used after reset)
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
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

  /**
   * Enable auto-login by setting session persistence
   */
  async enableAutoLogin() {
    // Supabase handles session persistence automatically
    // This method exists for future customization
    return { success: true };
  },

  /**
   * Check if user has valid session on app start
   */
  async checkAutoLogin() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
};