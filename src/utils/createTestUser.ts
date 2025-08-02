/**
 * Utility to create test users for development
 */

import { supabase } from '@/lib/supabase';

export const createTestUser = async (email: string, password: string, role: string = 'admin') => {
  try {
    const { data, error } = await supabase.functions.invoke('create-test-user', {
      body: { email, password, role }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

// Helper function to create default test users
export const createDefaultTestUsers = async () => {
  const testUsers = [
    { email: 'admin@test.com', password: 'password123', role: 'admin' },
    { email: 'manager@test.com', password: 'password123', role: 'manager' },
    { email: 'staff@test.com', password: 'password123', role: 'staff' },
    { email: 'viewer@test.com', password: 'password123', role: 'viewer' }
  ];

  const results = [];
  
  for (const user of testUsers) {
    try {
      const result = await createTestUser(user.email, user.password, user.role);
      results.push({ ...user, success: true, result });
      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      results.push({ ...user, success: false, error: error.message });
      console.error(`❌ Failed to create user: ${user.email}`, error);
    }
  }

  return results;
};