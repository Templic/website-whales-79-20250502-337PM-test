/**
 * Enhanced Role-Based Access Control (RBAC) System
 * 
 * Provides a comprehensive role management system with
 * advanced permission controls and role hierarchies.
 * 
 * Features:
 * - Role hierarchies with inheritance
 * - Fine-grained permission control
 * - Resource-based access restrictions
 * - Dynamic role assignment and validation
 * - Integration with audit logging
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole, roleHierarchy, routePermissions } from '../../../utils/auth-config';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';

// Define types for better type safety
export type Permission = string;
export type Resource = string;

export interface PermissionSet {
  [key: Permission]: boolean;
}

export interface ResourcePermissions {
  [key: Resource]: PermissionSet;
}

export interface RoleDefinition {
  name: UserRole;
  level: number;
  inheritsFrom?: UserRole[];
  permissions: ResourcePermissions;
}

// Default role definitions
const roleDefinitions: RoleDefinition[] = [
  {
    name: UserRole.USER,
    level: 0,
    permissions: {
      'profile': { 'read': true, 'update': true },
      'content': { 'read': true },
      'comments': { 'create': true, 'read': true, 'update': true, 'delete': true }
    }
  },
  {
    name: UserRole.ADMIN,
    level: 1,
    inheritsFrom: [UserRole.USER],
    permissions: {
      'users': { 'read': true, 'create': true, 'update': true },
      'content': { 'create': true, 'update': true, 'delete': true },
      'comments': { 'moderate': true },
      'settings': { 'read': true, 'update': true }
    }
  },
  {
    name: UserRole.SUPER_ADMIN,
    level: 2,
    inheritsFrom: [UserRole.ADMIN],
    permissions: {
      'users': { 'delete': true },
      'roles': { 'create': true, 'read': true, 'update': true, 'delete': true },
      'settings': { 'create': true, 'delete': true },
      'system': { 'read': true, 'update': true }
    }
  }
];

// Additional role-specific permissions
const additionalPermissions: { [role: string]: ResourcePermissions } = {
  [UserRole.ADMIN]: {
    'analytics': { 'read': true },
    'media': { 'create': true, 'read': true, 'update': true, 'delete': true },
    'newsletter': { 'create': true, 'read': true, 'update': true, 'delete': true }
  },
  [UserRole.SUPER_ADMIN]: {
    'analytics': { 'export': true },
    'database': { 'read': true, 'backup': true, 'restore': true },
    'security': { 'read': true, 'update': true }
  }
};

// Merge additional permissions into role definitions
roleDefinitions.forEach(role => {
  if (additionalPermissions[role.name]) {
    role.permissions = { ...role.permissions, ...additionalPermissions[role.name] };
  }
});

// Cache for calculated permissions
const permissionCache: Map<UserRole, ResourcePermissions> = new Map();

/**
 * Calculate effective permissions for a role
 */
function calculateEffectivePermissions(roleName: UserRole): ResourcePermissions {
  // Check cache first
  if (permissionCache.has(roleName)) {
    return permissionCache.get(roleName)!;
  }
  
  const role = roleDefinitions.find(r => r.name === roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  
  let effectivePermissions: ResourcePermissions = { ...role.permissions };
  
  // Add inherited permissions
  if (role.inheritsFrom && role.inheritsFrom.length > 0) {
    role.inheritsFrom.forEach(parentRole => {
      const parentPermissions = calculateEffectivePermissions(parentRole);
      
      // Merge parent permissions
      Object.keys(parentPermissions).forEach(resource => {
        if (!effectivePermissions[resource]) {
          effectivePermissions[resource] = {};
        }
        
        Object.keys(parentPermissions[resource]).forEach(permission => {
          if (!effectivePermissions[resource][permission]) {
            effectivePermissions[resource][permission] = parentPermissions[resource][permission];
          }
        });
      });
    });
  }
  
  // Cache the result
  permissionCache.set(roleName, effectivePermissions);
  
  return effectivePermissions;
}

/**
 * Check if a role has a specific permission on a resource
 */
export function hasPermission(
  roleName: UserRole,
  resource: Resource,
  permission: Permission
): boolean {
  const effectivePermissions = calculateEffectivePermissions(roleName);
  
  return !!(
    effectivePermissions[resource] && 
    effectivePermissions[resource][permission]
  );
}

/**
 * Check if a role has access to a specific route
 */
export function hasRouteAccess(
  roleName: UserRole,
  route: string
): boolean {
  // If the route isn't in routePermissions, use the default
  const requiredRole = routePermissions[route] || routePermissions.default;
  
  // Get levels for comparison
  const userLevel = roleHierarchy[roleName];
  const requiredLevel = roleHierarchy[requiredRole];
  
  return userLevel >= requiredLevel;
}

/**
 * Middleware to check resource permissions
 */
export function checkPermission(
  resource: Resource,
  permission: Permission
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // First check if user is authenticated
    if (!req.isAuthenticated() && !req.user) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHORIZATION,
        severity: SecurityEventSeverity.WARNING,
        message: 'Unauthenticated permission access attempt',
        data: {
          resource,
          permission,
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      });
      
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userRole = req.user?.role as UserRole || UserRole.USER;
    
    if (!hasPermission(userRole, resource, permission)) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHORIZATION,
        severity: SecurityEventSeverity.WARNING,
        message: 'Permission denied',
        data: {
          resource,
          permission,
          userRole,
          userId: req.user?.id,
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      });
      
      logAuditEvent(
        AuditAction.PERMISSION_CHANGE,
        AuditCategory.AUTHORIZATION,
        resource,
        { permission, granted: false },
        req
      );
      
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Log successful permission check
    logAuditEvent(
      AuditAction.PERMISSION_CHANGE,
      AuditCategory.AUTHORIZATION,
      resource,
      { permission, granted: true },
      req
    );
    
    next();
  };
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(roleName: UserRole): ResourcePermissions {
  return calculateEffectivePermissions(roleName);
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): { [key: UserRole]: ResourcePermissions } {
  const allPermissions: { [key: UserRole]: ResourcePermissions } = {};
  
  roleDefinitions.forEach(role => {
    allPermissions[role.name] = calculateEffectivePermissions(role.name);
  });
  
  return allPermissions;
}

/**
 * Get all roles
 */
export function getAllRoles(): UserRole[] {
  return roleDefinitions.map(role => role.name);
}

/**
 * Get direct role permissions (without inheritance)
 */
export function getDirectRolePermissions(roleName: UserRole): ResourcePermissions {
  const role = roleDefinitions.find(r => r.name === roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  
  return { ...role.permissions };
}

/**
 * Helper middleware generators for common permissions
 */
export const Permissions = {
  Users: {
    create: checkPermission('users', 'create'),
    read: checkPermission('users', 'read'),
    update: checkPermission('users', 'update'),
    delete: checkPermission('users', 'delete')
  },
  Content: {
    create: checkPermission('content', 'create'),
    read: checkPermission('content', 'read'),
    update: checkPermission('content', 'update'),
    delete: checkPermission('content', 'delete')
  },
  Comments: {
    create: checkPermission('comments', 'create'),
    read: checkPermission('comments', 'read'),
    update: checkPermission('comments', 'update'),
    delete: checkPermission('comments', 'delete'),
    moderate: checkPermission('comments', 'moderate')
  },
  Settings: {
    read: checkPermission('settings', 'read'),
    update: checkPermission('settings', 'update')
  }
};

export default {
  hasPermission,
  hasRouteAccess,
  checkPermission,
  getRolePermissions,
  getAllPermissions,
  getAllRoles,
  getDirectRolePermissions,
  Permissions
};