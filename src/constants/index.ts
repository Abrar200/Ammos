/**
 * Application Constants
 * Centralized configuration and constant values
 */

// Application Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Business Management Panel',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
} as const;

// User Roles and Permissions
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  // Staff Management
  VIEW_STAFF: 'view_staff',
  MANAGE_STAFF: 'manage_staff',
  VIEW_PAYROLL: 'view_payroll',
  MANAGE_PAYROLL: 'manage_payroll',
  
  // Financial
  VIEW_FINANCES: 'view_finances',
  MANAGE_FINANCES: 'manage_finances',
  VIEW_OUTGOINGS: 'view_outgoings',
  MANAGE_OUTGOINGS: 'manage_outgoings',
  
  // Suppliers & Inventory
  VIEW_SUPPLIERS: 'view_suppliers',
  MANAGE_SUPPLIERS: 'manage_suppliers',
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',
  
  // System Administration
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.MANAGE_FINANCES,
    PERMISSIONS.VIEW_OUTGOINGS,
    PERMISSIONS.MANAGE_OUTGOINGS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_OUTGOINGS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
  ],
  [USER_ROLES.STAFF]: [
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.VIEW_INVENTORY,
  ],
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_OUTGOINGS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.VIEW_INVENTORY,
  ],
} as const;