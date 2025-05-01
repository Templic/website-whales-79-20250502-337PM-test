/**
 * Security Dashboard Controller
 * 
 * Provides API endpoints for the Security Dashboard in the Admin Portal.
 */

import { Request, Response } from 'express';
import { AuditAction, AuditCategory, logAuditEvent } from '../../advanced/audit/AuditLogService';
import * as SecurityDashboardService from './SecurityDashboardService';

/**
 * Get complete dashboard data
 */
export async function getDashboardData(req: Request, res: Response): Promise<void> {
  try {
    // Log the dashboard access
    logAuditEvent(
      AuditAction.DATA_VIEWED,
      AuditCategory.SECURITY,
      'security_dashboard',
      { userId: (req.user as any)?.id },
      req
    );
    
    // Get dashboard data
    const dashboardData = SecurityDashboardService.getDashboardData();
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching security dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch security dashboard data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get security metrics only
 */
export async function getSecurityMetrics(req: Request, res: Response): Promise<void> {
  try {
    const metrics = SecurityDashboardService.getSecurityMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch security metrics',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get security events
 */
export async function getSecurityEvents(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const events = SecurityDashboardService.getSecurityEvents(limit);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      error: 'Failed to fetch security events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get system health metrics
 */
export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    const healthMetrics = SecurityDashboardService.getSystemHealth();
    res.status(200).json(healthMetrics);
  } catch (error) {
    console.error('Error fetching system health metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch system health metrics',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get vulnerability assessment results
 */
export async function getVulnerabilityAssessment(req: Request, res: Response): Promise<void> {
  try {
    const vulnerabilityResults = SecurityDashboardService.getVulnerabilityAssessment();
    res.status(200).json(vulnerabilityResults);
  } catch (error) {
    console.error('Error fetching vulnerability assessment:', error);
    res.status(500).json({
      error: 'Failed to fetch vulnerability assessment',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get runtime security stats
 */
export async function getRuntimeSecurityStats(req: Request, res: Response): Promise<void> {
  try {
    const runtimeStats = SecurityDashboardService.getRuntimeSecurityStats();
    res.status(200).json(runtimeStats);
  } catch (error) {
    console.error('Error fetching runtime security stats:', error);
    res.status(500).json({
      error: 'Failed to fetch runtime security stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get audit activity summary
 */
export async function getAuditActivitySummary(req: Request, res: Response): Promise<void> {
  try {
    const auditSummary = SecurityDashboardService.getAuditActivitySummary();
    res.status(200).json(auditSummary);
  } catch (error) {
    console.error('Error fetching audit activity summary:', error);
    res.status(500).json({
      error: 'Failed to fetch audit activity summary',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export default {
  getDashboardData,
  getSecurityMetrics,
  getSecurityEvents,
  getSystemHealth,
  getVulnerabilityAssessment,
  getRuntimeSecurityStats,
  getAuditActivitySummary
};