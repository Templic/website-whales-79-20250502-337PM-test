/**
 * Advanced Security Routes
 * 
 * This module provides API endpoints for managing the advanced security features
 * including RBAC, IP whitelisting, audit logs, and more.
 */

import { Router } from 'express';
import { isAdmin, isSuperAdmin } from '../utils/auth-utils';
import { adminSecurityMiddleware, maximumSecurityMiddleware } from '../security/SecurityMiddleware';
import { getWhitelistedIPs, addToWhitelist, removeFromWhitelist } from '../security/advanced/network/IPWhitelistService';
import { hasPermission, getRolePermissions, getAllRoles, getAllPermissions } from '../security/advanced/rbac/EnhancedRoleManager';
import { AuditAction, AuditCategory, logAuditEvent, queryAuditLogs, exportAuditLogs } from '../security/advanced/audit/AuditLogService';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';
import { logSecurityEvent } from '../security/advanced/SecurityLogger';
import { Request, Response } from 'express';

const router = Router();

// ==================== IP Whitelist Management ====================

// Get all whitelisted IPs (Admin only)
router.get('/ip-whitelist', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const whitelistedIPs = getWhitelistedIPs();

    // Log the access
    logAuditEvent(
      AuditAction.READ,
      AuditCategory.SECURITY,
      'ip_whitelist',
      { count: whitelistedIPs.length },
      req
    );

    return res.status(200).json({
      success: true,
      data: whitelistedIPs
    });
  } catch (error) {
    console.error('Error fetching whitelisted IPs:', error);

    logSecurityEvent({
      category: SecurityEventCategory.IP_WHITELIST,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching whitelisted IPs',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch whitelisted IPs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add IP to whitelist (Super Admin only)
router.post('/ip-whitelist', maximumSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const { ip, description, expiresIn, isSubnet } = req.body;

    if (!ip || !description) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'IP and description are required'
      });
    }

    const addedBy = req.user?.username || req.user?.id?.toString() || 'unknown';
    
    const entry = addToWhitelist(
      ip,
      description,
      addedBy,
      expiresIn ? parseInt(expiresIn) : undefined,
      isSubnet === true
    );

    // Log the action
    logAuditEvent(
      AuditAction.CREATE,
      AuditCategory.SECURITY,
      'ip_whitelist',
      { ip, description, addedBy, expiresIn, isSubnet },
      req
    );

    return res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error adding IP to whitelist:', error);

    logSecurityEvent({
      category: SecurityEventCategory.IP_WHITELIST,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error adding IP to whitelist',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to add IP to whitelist',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove IP from whitelist (Super Admin only)
router.delete('/ip-whitelist/:ip', maximumSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const removedBy = req.user?.username || req.user?.id?.toString() || 'unknown';
    
    const removed = removeFromWhitelist(ip, removedBy);

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'IP not found',
        message: 'The specified IP was not found in the whitelist'
      });
    }

    // Log the action
    logAuditEvent(
      AuditAction.DELETE,
      AuditCategory.SECURITY,
      'ip_whitelist',
      { ip, removedBy },
      req
    );

    return res.status(200).json({
      success: true,
      message: 'IP removed from whitelist successfully'
    });
  } catch (error) {
    console.error('Error removing IP from whitelist:', error);

    logSecurityEvent({
      category: SecurityEventCategory.IP_WHITELIST,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error removing IP from whitelist',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to remove IP from whitelist',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== Role-Based Access Control Management ====================

// Get all roles (Admin only)
router.get('/roles', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const roles = getAllRoles();

    // Log the access
    logAuditEvent(
      AuditAction.READ,
      AuditCategory.AUTHORIZATION,
      'roles',
      { count: roles.length },
      req
    );

    return res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);

    logSecurityEvent({
      category: SecurityEventCategory.AUTHORIZATION,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching roles',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all permissions (Admin only)
router.get('/permissions', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const permissions = getAllPermissions();

    // Log the access
    logAuditEvent(
      AuditAction.READ,
      AuditCategory.AUTHORIZATION,
      'permissions',
      { count: Object.keys(permissions).length },
      req
    );

    return res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);

    logSecurityEvent({
      category: SecurityEventCategory.AUTHORIZATION,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching permissions',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get permissions for a specific role (Admin only)
router.get('/permissions/:role', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    
    const permissions = getRolePermissions(role);

    // Log the access
    logAuditEvent(
      AuditAction.READ,
      AuditCategory.AUTHORIZATION,
      'role_permissions',
      { role },
      req
    );

    return res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error(`Error fetching permissions for role ${req.params.role}:`, error);

    logSecurityEvent({
      category: SecurityEventCategory.AUTHORIZATION,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching role permissions',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        role: req.params.role,
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch role permissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check permission (Admin only)
router.post('/check-permission', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const { role, resource, permission } = req.body;

    if (!role || !resource || !permission) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Role, resource, and permission are required'
      });
    }

    const hasAccess = hasPermission(role, resource, permission);

    // Log the access
    logAuditEvent(
      AuditAction.READ,
      AuditCategory.AUTHORIZATION,
      'permission_check',
      { role, resource, permission, hasAccess },
      req
    );

    return res.status(200).json({
      success: true,
      data: {
        role,
        resource,
        permission,
        hasAccess
      }
    });
  } catch (error) {
    console.error('Error checking permission:', error);

    logSecurityEvent({
      category: SecurityEventCategory.AUTHORIZATION,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error checking permission',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to check permission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== Audit Log Management ====================

// Get audit logs (Admin only)
router.get('/audit-logs', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      category,
      resource,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    // Convert query parameters
    const options = {
      userId: userId as string | undefined,
      action: action as AuditAction | undefined,
      category: category as AuditCategory | undefined,
      resource: resource as string | undefined,
      startDate: startDate ? new Date(startDate as string).getTime() : undefined,
      endDate: endDate ? new Date(endDate as string).getTime() : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const logs = queryAuditLogs(options);

    // Log the access
    logAuditEvent(
      AuditAction.READ,
      AuditCategory.AUDIT,
      'audit_logs',
      {
        filteredBy: {
          userId,
          action,
          category,
          resource,
          startDate,
          endDate
        },
        count: logs.entries.length,
        page: options.page,
        limit: options.limit
      },
      req
    );

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);

    logSecurityEvent({
      category: SecurityEventCategory.AUDIT,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching audit logs',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export audit logs (Admin only)
router.get('/audit-logs/export', adminSecurityMiddleware, (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string || 'json') === 'csv' ? 'csv' : 'json';
    
    const exportData = exportAuditLogs(format);

    // Set appropriate headers
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString()}.${format}`);

    // Log the export
    logAuditEvent(
      AuditAction.EXPORT,
      AuditCategory.AUDIT,
      'audit_logs',
      { format },
      req
    );

    return res.status(200).send(exportData);
  } catch (error) {
    console.error('Error exporting audit logs:', error);

    logSecurityEvent({
      category: SecurityEventCategory.AUDIT,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error exporting audit logs',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;