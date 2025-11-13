// src/types/tasks.ts
export interface Task {
    id: string;
    title: string;
    description: string;
    category: 'supplier' | 'staff' | 'general';
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed';
    assigned_to?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
  }
  
  export interface TaskFormData {
    title: string;
    description: string;
    category: 'supplier' | 'staff' | 'general';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    assigned_to?: string;
  }