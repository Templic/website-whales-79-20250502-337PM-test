/**
 * Security Admin Routes
 * 
 * Defines API routes for security administration in the Admin Portal.
 */

import { Router } from 'express';
import * as SecurityDashboardController from './dashboard/SecurityDashboardController';
import * as SecurityConfigController from './SecurityConfigController';
import * as UserSecurityController from './UserSecurityController';
import { adminSecurityMiddleware } from '../SecurityMiddleware';

const router = Router();

// Apply admin security middleware to all routes
router.use(adminSecurityMiddleware);

// Security Dashboard routes
router.get('/dashboard', SecurityDashboardController.getDashboardData);
router.get('/dashboard/metrics', SecurityDashboardController.getSecurityMetrics);
router.get('/dashboard/events', SecurityDashboardController.getSecurityEvents);
router.get('/dashboard/health', SecurityDashboardController.getSystemHealth);
router.get('/dashboard/vulnerabilities', SecurityDashboardController.getVulnerabilityAssessment);
router.get('/dashboard/runtime', SecurityDashboardController.getRuntimeSecurityStats);
router.get('/dashboard/audit', SecurityDashboardController.getAuditActivitySummary);

// Security Configuration routes
router.get('/config', SecurityConfigController.getSecurityConfiguration);
router.post('/config/mode', SecurityConfigController.setSecurityMode);
router.post('/config/feature', SecurityConfigController.setSecurityFeature);
router.get('/config/history', SecurityConfigController.getConfigurationHistory);
router.post('/config/reset', SecurityConfigController.resetSecurityConfiguration);
router.post('/config/recommended', SecurityConfigController.applyRecommendedConfiguration);

// User Security Management routes
router.get('/users', UserSecurityController.getUsersWithSecurityStatus);
router.get('/users/:userId', UserSecurityController.getUserSecurityDetails);
router.post('/users/:userId/mfa/reset', UserSecurityController.resetUserMFA);
router.post('/users/:userId/unlock', UserSecurityController.unlockUserAccount);
router.post('/users/:userId/mfa/enforce', UserSecurityController.enforceMFA);
router.post('/users/:userId/sessions/terminate', UserSecurityController.terminateUserSessions);

export default router;