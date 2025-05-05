/**
 * TypeScript Error Management API Routes
 * 
 * This module provides API endpoints for the TypeScript error management system,
 * allowing frontend components to interact with the error detection, analysis,
 * and resolution functionality.
 * 
 * Features:
 * - RESTful API design
 * - Secure validation of all inputs
 * - Comprehensive error handling
 * - Open source compatible implementations
 * - Auditable request/response logging
 */

import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { TypeScriptErrorManagement } from '../utils/ts-error-management';
import { db } from '../db';
import { typeScriptErrors, errorFixes, errorPatterns } from '@shared/schema';
import { eq, and, or, not, isNull, sql, desc, count } from 'drizzle-orm';
import { logger } from '../logger';

// Create router
const router = Router();

// Initialize error management system
const errorManagement = new TypeScriptErrorManagement(
  process.env.OPENAI_API_KEY
);

/**
 * GET /api/typescript/errors
 * Retrieve all TypeScript errors with optional filtering
 */
router.get('/errors', 
  query('severity').optional().isString(),
  query('category').optional().isString(),
  query('status').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Parse query parameters
      const severity = req.query.severity ? (req.query.severity as string).split(',') : [];
      const category = req.query.category ? (req.query.category as string).split(',') : [];
      const status = req.query.status ? (req.query.status as string).split(',') : [];
      const search = req.query.search as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      
      // Build query
      let query = db.select().from(typeScriptErrors);
      
      // Apply filters
      if (severity.length > 0) {
        query = query.where(sql`${typeScriptErrors.severity} = ANY(${severity})`);
      }
      
      if (category.length > 0) {
        query = query.where(sql`${typeScriptErrors.category} = ANY(${category})`);
      }
      
      if (status.length > 0) {
        query = query.where(sql`${typeScriptErrors.status} = ANY(${status})`);
      }
      
      if (search) {
        query = query.where(
          or(
            sql`${typeScriptErrors.message} ILIKE ${'%' + search + '%'}`,
            sql`${typeScriptErrors.file_path} ILIKE ${'%' + search + '%'}`,
            sql`${typeScriptErrors.code} ILIKE ${'%' + search + '%'}`
          )
        );
      }
      
      // Add pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset).orderBy(desc(typeScriptErrors.detected_at));
      
      // Execute query
      const results = await query;
      
      // Transform results to camelCase format for frontend
      const transformedResults = results.map(error => ({
        id: error.id,
        code: error.code,
        message: error.message,
        filePath: error.file_path,
        line: error.line,
        column: error.column,
        severity: error.severity,
        category: error.category,
        status: error.status,
        patternId: error.pattern_id,
        fixId: error.fix_id,
        detectedAt: error.detected_at,
        resolvedAt: error.resolved_at,
        userId: error.user_id
      }));
      
      res.json(transformedResults);
    } catch (error) {
      logger.error(`Error getting TypeScript errors: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve TypeScript errors' });
    }
});

/**
 * GET /api/typescript/errors/:id
 * Get details of a specific TypeScript error
 */
router.get('/errors/:id',
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const errorId = Number(req.params.id);
      
      // Get error from database
      const [error] = await db.select()
        .from(typeScriptErrors)
        .where(eq(typeScriptErrors.id, errorId));
      
      if (!error) {
        return res.status(404).json({ error: 'TypeScript error not found' });
      }
      
      // Transform to camelCase
      const result = {
        id: error.id,
        code: error.code,
        message: error.message,
        filePath: error.file_path,
        line: error.line,
        column: error.column,
        severity: error.severity,
        category: error.category,
        status: error.status,
        patternId: error.pattern_id,
        fixId: error.fix_id,
        detectedAt: error.detected_at,
        resolvedAt: error.resolved_at,
        userId: error.user_id
      };
      
      res.json(result);
    } catch (error) {
      logger.error(`Error getting TypeScript error ${req.params.id}: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve TypeScript error' });
    }
});

/**
 * GET /api/typescript/errors/:id/fixes
 * Get available fixes for a TypeScript error
 */
router.get('/errors/:id/fixes',
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const errorId = Number(req.params.id);
      
      // Check if error exists
      const [error] = await db.select({ id: typeScriptErrors.id })
        .from(typeScriptErrors)
        .where(eq(typeScriptErrors.id, errorId));
      
      if (!error) {
        return res.status(404).json({ error: 'TypeScript error not found' });
      }
      
      // Get fixes for this error
      const fixes = await db.select()
        .from(errorFixes)
        .where(eq(errorFixes.error_id, errorId))
        .orderBy(desc(errorFixes.confidence_score));
      
      // Transform to camelCase
      const results = fixes.map(fix => ({
        id: fix.id,
        errorId: fix.error_id,
        patternId: fix.pattern_id,
        description: fix.description,
        replacements: fix.fix_text ? JSON.parse(fix.fix_text) : [],
        isAIGenerated: fix.is_ai_generated,
        confidence: fix.confidence_score,
        successRate: fix.success_rate,
        userId: fix.user_id,
        createdAt: fix.created_at
      }));
      
      res.json(results);
    } catch (error) {
      logger.error(`Error getting fixes for error ${req.params.id}: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve fixes' });
    }
});

/**
 * POST /api/typescript/errors/:id/resolve
 * Resolve a TypeScript error (apply a fix)
 */
router.post('/errors/:id/resolve',
  param('id').isInt({ min: 1 }).toInt(),
  body('fixId').optional().isInt({ min: 1 }),
  body('applyImmediately').optional().isBoolean(),
  body('useAI').optional().isBoolean(),
  body('userId').optional().isString(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const errorId = Number(req.params.id);
      const { fixId, applyImmediately = true, useAI = true, userId } = req.body;
      
      // Resolve the error
      const result = await errorManagement.resolveError(errorId, {
        applyImmediately,
        useAI,
        userId
      });
      
      res.json(result);
    } catch (error) {
      logger.error(`Error resolving error ${req.params.id}: ${error.message}`);
      res.status(500).json({ error: 'Failed to resolve error' });
    }
});

/**
 * POST /api/typescript/scan
 * Run a TypeScript error scan
 */
router.post('/scan',
  body('includeDirs').isArray(),
  body('excludeDirs').optional().isArray(),
  body('maxErrors').optional().isInt({ min: 1 }),
  body('autoFix').optional().isBoolean(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { includeDirs, excludeDirs, maxErrors, autoFix } = req.body;
      
      // Run the scan
      const result = await errorManagement.runFullErrorProcessingCycle({
        includeDirs,
        excludeDirs,
        maxErrors,
        autoFix,
        resolution: {
          applyImmediately: true,
          useAI: true
        }
      });
      
      res.json(result);
    } catch (error) {
      logger.error(`Error running TypeScript scan: ${error.message}`);
      res.status(500).json({ error: 'Failed to run TypeScript scan' });
    }
});

/**
 * GET /api/typescript/metrics
 * Get TypeScript error metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await errorManagement.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error(`Error getting TypeScript metrics: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve TypeScript metrics' });
  }
});

/**
 * GET /api/typescript/patterns
 * Get TypeScript error patterns
 */
router.get('/patterns',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      
      // Get patterns with error count
      const patterns = await db.select({
        id: errorPatterns.id,
        name: errorPatterns.name,
        category: errorPatterns.category,
        errorCode: errorPatterns.error_code,
        autoFixable: errorPatterns.auto_fixable,
        createdAt: errorPatterns.created_at,
        frequency: sql<number>`(
          SELECT COUNT(*) FROM typescript_errors 
          WHERE pattern_id = ${errorPatterns.id}
        )`
      })
      .from(errorPatterns)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(errorPatterns.id));
      
      res.json(patterns);
    } catch (error) {
      logger.error(`Error getting TypeScript patterns: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve TypeScript patterns' });
    }
});

/**
 * POST /api/typescript/feedback
 * Submit feedback for a fix
 */
router.post('/feedback',
  body('fixId').isInt({ min: 1 }),
  body('userId').isString(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { fixId, userId, rating, comment } = req.body;
      
      // Submit feedback
      await errorManagement.metricsService.recordFixFeedback(
        fixId,
        userId,
        rating,
        comment
      );
      
      res.json({ success: true });
    } catch (error) {
      logger.error(`Error submitting fix feedback: ${error.message}`);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

export default router;