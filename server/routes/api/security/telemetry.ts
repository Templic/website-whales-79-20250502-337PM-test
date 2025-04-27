/**
 * @file telemetry.ts
 * @description Security Telemetry API for providing security event correlation and analytics
 */

import { Router, Request, Response } from 'express';
import { SecurityTelemetryCorrelator } from '../../../security/advanced/telemetry/SecurityTelemetryCorrelator';
import { Logger } from '../../../utils/Logger';
import { isAuthenticated, isAdmin } from '../../../middleware/authMiddleware';

const router = Router();

/**
 * Get recent security pattern matches
 * 
 * @route GET /api/security/telemetry/matches
 * @param {number} limit - Maximum number of matches to return
 * @returns {object} Security pattern matches with details
 */
router.get('/matches', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        
        const telemetry = SecurityTelemetryCorrelator.getInstance();
        const matches = telemetry.getRecentMatches(limit);
        
        res.json({
            success: true,
            matches,
            count: matches.length
        });
    } catch (error) {
        Logger.error('Failed to retrieve security pattern matches', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve security pattern matches'
        });
    }
});

/**
 * Get available security patterns
 * 
 * @route GET /api/security/telemetry/patterns
 * @returns {object} List of available security patterns
 */
router.get('/patterns', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
        const telemetry = SecurityTelemetryCorrelator.getInstance();
        const patterns = telemetry.getPatterns();
        
        res.json({
            success: true,
            patterns,
            count: patterns.length
        });
    } catch (error) {
        Logger.error('Failed to retrieve security patterns', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve security patterns'
        });
    }
});

/**
 * Run telemetry analysis on demand
 * 
 * @route POST /api/security/telemetry/analyze
 * @returns {object} Status of the analysis request
 */
router.post('/analyze', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
        const telemetry = SecurityTelemetryCorrelator.getInstance();
        await telemetry.runAnalysis(true);
        
        res.json({
            success: true,
            message: 'Security telemetry analysis triggered'
        });
    } catch (error) {
        Logger.error('Failed to trigger security telemetry analysis', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger security telemetry analysis'
        });
    }
});

/**
 * Get telemetry statistics
 * 
 * @route GET /api/security/telemetry/stats
 * @returns {object} Telemetry statistics
 */
router.get('/stats', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
        const telemetry = SecurityTelemetryCorrelator.getInstance();
        const matches = telemetry.getRecentMatches(1000); // Get a large sample to analyze
        
        // Compute statistics
        const stats = {
            totalAlerts: matches.length,
            bySeverity: {
                low: matches.filter(m => m.severity === 'low').length,
                medium: matches.filter(m => m.severity === 'medium').length,
                high: matches.filter(m => m.severity === 'high').length,
                critical: matches.filter(m => m.severity === 'critical').length
            },
            byPattern: {} as Record<string, number>,
            bySource: {} as Record<string, number>,
            averageConfidence: matches.length > 0 
                ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length 
                : 0
        };
        
        // Count by pattern
        matches.forEach(match => {
            if (!stats.byPattern[match.patternId]) {
                stats.byPattern[match.patternId] = 0;
            }
            stats.byPattern[match.patternId]++;
        });
        
        // Count by source
        matches.forEach(match => {
            if (!stats.bySource[match.source]) {
                stats.bySource[match.source] = 0;
            }
            stats.bySource[match.source]++;
        });
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        Logger.error('Failed to retrieve telemetry statistics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve telemetry statistics'
        });
    }
});

export default router;