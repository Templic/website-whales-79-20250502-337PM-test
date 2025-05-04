/**
 * Direct Validation Test Routes
 * 
 * This file contains routes for testing validation by completely bypassing all security checks.
 * These routes are intended ONLY for development and testing purposes.
 * 
 * WARNING: These endpoints have NO security protection and should never be exposed in production.
 */

import express from 'express';
import { z } from 'zod';
import { noSecurityMiddleware } from '../middleware/noSecurityMiddleware';
import { ValidationEngine } from '../validation/ValidationEngine';

// Create router
const router = express.Router();

// Apply noSecurityMiddleware to all routes in this router
router.use(noSecurityMiddleware);

// Special middleware to force bypass all security restrictions
router.use((req, res, next) => {
  // Mark this request to skip all security
  (req as any).__skipCSRF = true;
  (req as any).__noSecurity = true;
  
  // Explicitly set headers to bypass CORS restrictions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Security-Mode', 'COMPLETELY_BYPASSED');
  
  // Log the bypass
  console.log(`[DIRECT-VALIDATION] Security completely bypassed for ${req.method} ${req.path}`);
  
  next();
});

// Make sure JSON body parsing is enabled for these routes
router.use(express.json());

// Basic validation endpoint
router.post('/basic', (req, res) => {
  console.log("Direct validation test - basic endpoint called", req.body);
  
  try {
    // Define validation schema
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      message: z.string().min(10).max(2000)
    });
    
    // Validate input
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validation: {
          passed: false,
          errors: result.error.errors.map(e => ({
            field: e.path.join('.'),
            error: e.message
          }))
        }
      });
    }
    
    // Validation passed
    const data = result.data;
    
    res.json({
      success: true,
      validation: {
        passed: true
      },
      data
    });
  } catch (error) {
    console.error('Error in basic validation endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Security validation endpoint
router.post('/security', (req, res) => {
  console.log("Direct validation test - security endpoint called", req.body);
  
  try {
    // Validate input structure
    const schema = z.object({
      query: z.string().min(1).max(1000)
    });
    
    // Parse the input
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validation: {
          passed: false,
          errors: result.error.errors.map(e => ({
            field: e.path.join('.'),
            error: e.message
          }))
        }
      });
    }
    
    const { query } = result.data;
    
    // Simple heuristic to detect SQL injection
    const hasSqlInjection = 
      query.toLowerCase().includes('select') ||
      query.toLowerCase().includes('from') ||
      query.toLowerCase().includes('drop') ||
      query.toLowerCase().includes('table') ||
      query.toLowerCase().includes(';') ||
      query.toLowerCase().includes('--');
    
    if (hasSqlInjection) {
      return res.json({
        success: true, // API call was successful
        validation: {
          passed: false, // But validation failed
          securityScore: 0.2,
          warnings: ['Potential SQL injection detected']
        }
      });
    }
    
    // No security issues detected
    res.json({
      success: true,
      validation: {
        passed: true,
        securityScore: 0.9
      }
    });
  } catch (error) {
    console.error('Error in security validation endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// System status endpoint
router.get('/status', (req, res) => {
  console.log("Direct validation test - status endpoint called");
  
  try {
    res.json({
      success: true,
      status: {
        environment: process.env.NODE_ENV || 'development',
        securityMode: 'COMPLETELY_BYPASSED',
        cacheStats: {
          hits: 128,
          misses: 37,
          size: 45
        },
        activeBatches: 2,
        aiValidation: {
          enabled: true,
          lastProcessed: new Date().toISOString(),
          averageResponseTime: 230 // ms
        },
        performance: {
          avgProcessingTime: 18, // ms
          p95ProcessingTime: 47, // ms
          p99ProcessingTime: 102 // ms
        }
      }
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Rules endpoint
router.get('/rules', (req, res) => {
  console.log("Direct validation test - rules endpoint called");
  
  try {
    // Get validation rules from the validation engine
    const rules = ValidationEngine.getInstance().getRules();
    
    res.json({
      success: true,
      rules: Object.entries(rules).map(([id, rule]) => ({
        id,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        metadata: rule.metadata || {}
      }))
    });
  } catch (error) {
    console.error('Error in rules endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mappings endpoint
router.get('/mappings', (req, res) => {
  console.log("Direct validation test - mappings endpoint called");
  
  try {
    // Get API mappings from the validation engine
    const mappings = ValidationEngine.getInstance().getMappings();
    
    res.json({
      success: true,
      mappings: Object.entries(mappings).map(([endpoint, mapping]) => ({
        endpoint,
        rules: mapping.rules,
        metadata: mapping.metadata || {}
      }))
    });
  } catch (error) {
    console.error('Error in mappings endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;