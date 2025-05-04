/**
 * Validation Test Routes
 * 
 * This module provides routes for testing the validation engine
 * and AI-powered security validation.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { ValidationEngine } from '../security/advanced/apiValidation/ValidationEngine';
import { validationAIConnector } from '../security/advanced/ai/ValidationAIConnector';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Test endpoint that uses AI validation
 * 
 * @route POST /api/validation/test-ai
 */
router.post('/test-ai', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Create a test validation schema
    const testSchema = z.object({
      username: z.string().min(3).max(50),
      email: z.string().email().optional(),
      action: z.string(),
      preferences: z.object({
        theme: z.string().optional(),
        notifications: z.boolean().optional()
      }).optional()
    });

    // First, validate with the schema
    const parseResult = testSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Schema validation failed',
        errors: parseResult.error.errors,
        aiValidation: false
      });
    }

    // Then perform AI validation
    console.log('Running AI validation...');
    const aiResult = await validationAIConnector.validateRequest(
      req.body,
      'api',
      `Test validation for ${req.path}`,
      {
        errorThreshold: 'medium',
        includeDetails: true,
        timeoutMs: 15000,
        userId: (req as any).user?.id || 'test-user'
      }
    );

    // Combine results
    return res.status(200).json({
      success: true,
      message: 'Validation completed',
      schemaValidation: {
        success: true,
        data: parseResult.data
      },
      aiValidation: {
        valid: aiResult.valid,
        errorCount: aiResult.errors.length,
        warningCount: aiResult.warnings.length,
        errors: aiResult.errors,
        warnings: aiResult.warnings,
        metadata: aiResult.metadata
      }
    });
  } catch (error: any) {
    console.error('Error in AI validation test route:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation test failed',
      error: error.message
    });
  }
});

/**
 * Test endpoint for standard schema validation (no AI)
 * 
 * @route POST /api/validation/test-standard
 */
router.post('/test-standard', async (req: Request, res: Response) => {
  try {
    // Register a test validation rule
    const testRuleId = 'test-rule';
    
    // Remove any existing rule with the same ID
    try {
      const existingRules = ValidationEngine.getAllRules();
      if (existingRules.some(rule => rule.id === testRuleId)) {
        ValidationEngine.reset();
      }
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Create a test validation schema
    const testSchema = z.object({
      username: z.string().min(3).max(50),
      email: z.string().email().optional(),
      action: z.string(),
      preferences: z.object({
        theme: z.string().optional(),
        notifications: z.boolean().optional()
      }).optional()
    });

    // Register the rule
    ValidationEngine.registerRule(testRuleId, {
      name: 'Test Validation Rule',
      description: 'A rule for testing validation',
      schema: testSchema,
      target: 'body',
      isActive: true,
      priority: 1
    });
    
    // Apply the rule to our test endpoint
    ValidationEngine.applyRulesToEndpoint('/api/validation/test-standard', [testRuleId]);
    
    // Create validation middleware for this request
    const validationMiddleware = ValidationEngine.createValidationMiddleware(
      [testRuleId],
      {
        mode: 'strict',
        includeDetails: true,
        statusCode: 400,
        logSeverity: 'medium'
      }
    );
    
    // Execute the middleware manually
    validationMiddleware(req, res, () => {
      // This is the "next" function that gets called if validation passes
      return res.status(200).json({
        success: true,
        message: 'Standard validation succeeded',
        data: req.body
      });
    });
  } catch (error: any) {
    console.error('Error in standard validation test route:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation test failed',
      error: error.message
    });
  }
});

export default router;