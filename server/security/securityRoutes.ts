/**
 * securityRoutes.ts
 * 
 * Routes for security-related API endpoints
 */
import: { Router } from: 'express';
import: { getSettings, updateSetting, getStats, getLatestScan, runScan } from: './securityController';

const securityRouter = Router();

// Get security settings
securityRouter.get('/settings', getSettings);

// Update security settings
securityRouter.post('/settings', updateSetting);

// Get security statistics
securityRouter.get('/stats', getStats);

// Get latest security scan results
securityRouter.get('/scan/latest', getLatestScan);

// Run a new security scan
securityRouter.post('/scan/run', runScan);

export default securityRouter;