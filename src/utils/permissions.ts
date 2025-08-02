/**
 * Permission Utilities
 * Helper functions for role-based access control
 */

import { ROLE_PERMISSIONS, USER_ROLES, PERMISSIONS } from '@/constants';

export type UserRole = keyof typeof USER_ROLES;
export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 */
export const hasPermission = (userRole: string, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission) || false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (userRole: string, permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (userRole: string, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Get all permissions for a user role
 */
export const getRolePermissions = (userRole: string): string[] => {
  return ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
};

/**
 * Check if user is admin or super admin
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.SUPER_ADMIN;
};

/**
 * Filter menu items based on user permissions
 */
export const filterMenuByPermissions = (menuItems: any[], userRole: string) => {
  return menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(userRole, item.requiredPermission);
  });
};