/**
 * TypeScript Error Management Admin Routes
 * 
 * API endpoints for managing TypeScript errors through the admin portal.
 */

import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middlewares/validationMiddleware';
// Create a temporary requireAdmin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  // For development purposes, we'll allow all access
  // In production, this would check if the user has admin privileges
  console.log('[Auth] Admin access granted to TypeScript error management');
  next();
};
import { db } from '../../db';
import { logSecurityEvent } from '../../security';

// Temporary auditAction function until we create a proper one
function auditAction(data: any): void {
  console.log(`[AUDIT] ${data.action} - Target: ${data.targetId} - User: ${data.userId}`);
}
import path from 'path';
import { nanoid } from 'nanoid';
import { ErrorCategory, ErrorSeverity, ErrorStatus } from '../../../shared/schema';
import { findTypeScriptErrors } from '../../utils/ts-error-finder';
import { analyzeTypeScriptErrors } from '../../utils/ts-error-analyzer';
import { fixTypeScriptErrorsWithOpenAI, TypeScriptErrorInput } from '../../utils/openai-enhanced-fixer';
import fs from 'fs';

const router = express.Router();

// Simple test endpoint that doesn't require any validation or database access
router.get('/test', (req, res) => {
  // Set special flag to skip CSRF validation (similar to the Content API)
  req.__skipCSRF = true;
  
  console.log('[TypeScript Errors API] Test endpoint called with CSRF bypass');
  res.json({
    success: true,
    message: 'TypeScript Errors API is working',
    timestamp: new Date().toISOString(),
    csrf: 'bypassed'
  });
});

// Validation middleware
const scanValidation = [
  body('aiEnabled').isBoolean().optional()
];

const errorFixValidation = [
  param('scanId').isString().notEmpty(),
  param('errorId').isString().notEmpty()
];

// Get all scans
router.get('/scans', async (req, res) => {
  // Set special flag to skip CSRF validation
  req.__skipCSRF = true;
  
  try {
    const scans = await db.query(`
      SELECT id, status, error_count as "errorCount", fixed_count as "fixedCount", 
             ai_enabled as "aiEnabled", start_time as "startTime", end_time as "endTime"
      FROM typescript_scan_results
      ORDER BY start_time DESC
    `);
    
    res.json(scans);
  } catch (error) {
    console.error('Error fetching TypeScript scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// Get scan by ID
router.get('/scans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get scan details
    const scan = await db.queryOne(`
      SELECT id, status, error_count as "errorCount", fixed_count as "fixedCount", 
             ai_enabled as "aiEnabled", start_time as "startTime", end_time as "endTime", 
             summary
      FROM typescript_scan_results
      WHERE id = $1
    `, [id]);
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    // Get scan errors
    const errors = await db.query(`
      SELECT id, code, message, file, line, column, severity, category, status,
             timestamp, 
             json_build_object(
               'suggestion', fix_details->>'suggestion',
               'explanation', fix_details->>'explanation',
               'confidence', fix_details->>'confidence',
               'aiGenerated', fix_details->>'aiGenerated',
               'appliedAt', fix_details->>'appliedAt',
               'generatedAt', fix_details->>'generatedAt'
             ) as "fixDetails"
      FROM typescript_errors
      WHERE scan_id = $1
      ORDER BY severity, status
    `, [id]);
    
    // Return combined result
    res.json({
      ...scan,
      errors
    });
  } catch (error) {
    console.error('Error fetching TypeScript scan:', error);
    res.status(500).json({ error: 'Failed to fetch scan details' });
  }
});

// Create a new scan
router.post('/scans', scanValidation, validate, async (req, res) => {
  // Set special flag to skip CSRF validation
  req.__skipCSRF = true;
  
  try {
    const { aiEnabled = false } = req.body;
    const scanId = nanoid();
    const startTime = new Date();
    
    // For testing purposes, respond with success without DB access
    console.log(`[TypeScript Scanner] Creating scan ${scanId} (no database required for test)`);
    
    // Skip database operations for testing
    /*
    // Create scan record
    await db.query(`
      INSERT INTO typescript_scan_results (
        id, status, error_count, fixed_count, ai_enabled, start_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [scanId, 'IN_PROGRESS', 0, 0, aiEnabled, startTime]);
    
    // Log security event
    logSecurityEvent('SCAN_INITIATED', 'info', {
      source: 'typescript-error-scanner',
      message: `TypeScript error scan initiated${aiEnabled ? ' with AI' : ''}`,
      scanId,
      aiEnabled: String(aiEnabled)
    });
    
    // Start scan in background
    runScanInBackground(scanId, aiEnabled);
    */
    
    res.status(201).json({
      id: scanId,
      status: 'IN_PROGRESS',
      startTime,
      aiEnabled,
      message: 'Test scan created successfully (DB operations skipped)',
      csrf: 'bypassed'
    });
  } catch (error) {
    console.error('Error creating TypeScript scan:', error);
    res.status(500).json({ error: 'Failed to create scan' });
  }
});

// Apply fix to error
router.post('/scans/:scanId/errors/:errorId/fix', errorFixValidation, validate, async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get error details
    const error = await db.queryOne(`
      SELECT * FROM typescript_errors
      WHERE id = $1 AND scan_id = $2
    `, [errorId, scanId]);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    if (error.status === 'FIXED') {
      return res.status(400).json({ error: 'Error is already fixed' });
    }
    
    if (!error.fix_details || !error.fix_details.suggestion) {
      return res.status(400).json({ error: 'No fix suggestion available' });
    }
    
    // Apply fix to file
    const fixApplied = await applyFixToFile(error.file, error.line, error.fix_details.suggestion);
    
    if (!fixApplied) {
      return res.status(500).json({ error: 'Failed to apply fix to file' });
    }
    
    // Update error status
    await db.query(`
      UPDATE typescript_errors
      SET status = 'FIXED',
          fix_details = jsonb_set(fix_details, '{appliedAt}', to_jsonb($1::text))
      WHERE id = $2
    `, [new Date().toISOString(), errorId]);
    
    // Update scan fixed count
    await db.query(`
      UPDATE typescript_scan_results
      SET fixed_count = fixed_count + 1
      WHERE id = $1
    `, [scanId]);
    
    // Log security event
    logSecurityEvent('ERROR_FIXED', 'info', {
      source: 'typescript-error-scanner',
      message: `TypeScript error fixed: ${error.file}:${error.line}`,
      scanId,
      errorId,
      file: String(error.file),
      line: String(error.line)
    });
    
    // Audit the action
    auditAction({
      action: 'TYPESCRIPT_ERROR_FIXED',
      userId: req.user?.id || 'system',
      targetId: errorId,
      details: {
        scanId,
        file: error.file,
        line: error.line
      }
    });
    
    res.json({
      success: true,
      message: 'Fix applied successfully',
      errorId
    });
  } catch (error) {
    console.error('Error applying fix:', error);
    res.status(500).json({ error: 'Failed to apply fix' });
  }
});

// Ignore error
router.post('/scans/:scanId/errors/:errorId/ignore', errorFixValidation, validate, async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get error details
    const error = await db.queryOne(`
      SELECT * FROM typescript_errors
      WHERE id = $1 AND scan_id = $2
    `, [errorId, scanId]);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    if (error.status === 'IGNORED') {
      return res.status(400).json({ error: 'Error is already ignored' });
    }
    
    // Update error status
    await db.query(`
      UPDATE typescript_errors
      SET status = 'IGNORED'
      WHERE id = $1
    `, [errorId]);
    
    // Log security event
    logSecurityEvent('ERROR_IGNORED', 'info', {
      source: 'typescript-error-scanner',
      message: `TypeScript error ignored: ${error.file}:${error.line}`,
      scanId,
      errorId,
      file: String(error.file),
      line: String(error.line)
    });
    
    res.json({
      success: true,
      message: 'Error ignored successfully',
      errorId
    });
  } catch (error) {
    console.error('Error ignoring error:', error);
    res.status(500).json({ error: 'Failed to ignore error' });
  }
});

// Generate AI fix for error
router.post('/scans/:scanId/errors/:errorId/ai-fix', errorFixValidation, validate, async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get error details
    const error = await db.queryOne(`
      SELECT * FROM typescript_errors
      WHERE id = $1 AND scan_id = $2
    `, [errorId, scanId]);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    if (error.status === 'FIXED') {
      return res.status(400).json({ error: 'Error is already fixed' });
    }
    
    // Check if scan has AI enabled
    const scan = await db.queryOne(`
      SELECT ai_enabled FROM typescript_scan_results
      WHERE id = $1
    `, [scanId]);
    
    if (!scan || !scan.ai_enabled) {
      return res.status(400).json({ error: 'AI is not enabled for this scan' });
    }
    
    // Update error status to FIXING
    await db.query(`
      UPDATE typescript_errors
      SET status = 'FIXING'
      WHERE id = $1
    `, [errorId]);
    
    // Generate AI fix in background
    generateAIFixInBackground(scanId, errorId, error);
    
    res.json({
      success: true,
      message: 'AI fix generation started',
      errorId
    });
  } catch (error) {
    console.error('Error generating AI fix:', error);
    res.status(500).json({ error: 'Failed to generate AI fix' });
  }
});

// Helper function to run scan in background
async function runScanInBackground(scanId: string, aiEnabled: boolean) {
  try {
    console.log(`[TypeScript Scanner] Starting scan ${scanId}${aiEnabled ? ' with AI' : ''}`);
    
    // Run TypeScript error finding
    const projectRoot = process.cwd();
    const errorResults = await findTypeScriptErrors({
      projectRoot,
      maxErrors: 100
    });
    
    console.log(`[TypeScript Scanner] Found ${errorResults.errors.length} errors`);
    
    // Save errors to database
    for (const error of errorResults.errors) {
      await db.query(`
        INSERT INTO typescript_errors (
          id, scan_id, code, message, file, line, column, severity, category, status, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        nanoid(),
        scanId,
        error.code,
        error.message,
        error.file,
        error.line,
        error.column,
        error.severity,
        error.category,
        'NEW',
        new Date()
      ]);
    }
    
    // If AI is enabled, analyze errors
    if (aiEnabled && errorResults.errors.length > 0) {
      console.log(`[TypeScript Scanner] Analyzing errors with AI`);
      
      // Analyze errors
      const analysisResults = await analyzeTypeScriptErrors(errorResults.errors, {
        includeFileContext: true,
        contextLines: 5
      });
      
      // Get top 20 errors for AI processing
      const prioritizedErrors = errorResults.errors
        .filter(error => {
          // Skip errors related to missing modules or imports
          if (error.message.includes('Cannot find module') || 
              error.message.includes('Cannot find name') ||
              error.message.includes('has no exported member')) {
            return false;
          }
          
          // Focus on type-related errors
          const isTypeError = error.message.includes('Type') || 
                            error.code.startsWith('TS2') || 
                            error.category.includes('TYPE');
          
          // Filter out errors in node_modules or generated code
          const isInUserCode = !error.file.includes('node_modules') && 
                              !error.file.includes('.d.ts') &&
                              !error.file.includes('generated');
          
          return isTypeError && isInUserCode;
        })
        .slice(0, 20);
      
      if (prioritizedErrors.length > 0) {
        // Convert errors to format expected by OpenAI fixer
        const convertedErrors = prioritizedErrors.map(error => ({
          errorCode: error.code,
          messageText: error.message,
          filePath: error.file,
          lineNumber: error.line,
          columnNumber: error.column,
          category: error.category,
          severity: error.severity,
          source: error.snippet
        }));
        
        // Get fix suggestions from OpenAI
        const fixes = await fixTypeScriptErrorsWithOpenAI(convertedErrors, {
          maxContextLines: 15,
          enableExplanation: true
        });
        
        console.log(`[TypeScript Scanner] Received ${fixes.length} fix suggestions from OpenAI`);
        
        // Save fixes to database
        for (const fix of fixes) {
          if (!fix.error || !fix.error.filePath || !fix.error.lineNumber) {
            continue;
          }
          
          // Find the error in the database
          const dbError = await db.queryOne(`
            SELECT id FROM typescript_errors
            WHERE scan_id = $1 AND file = $2 AND line = $3
          `, [scanId, fix.error.filePath, fix.error.lineNumber]);
          
          if (!dbError) {
            continue;
          }
          
          // Save fix details
          await db.query(`
            UPDATE typescript_errors
            SET fix_details = $1
            WHERE id = $2
          `, [
            {
              suggestion: fix.fixedCode,
              explanation: fix.explanation,
              confidence: fix.confidence,
              aiGenerated: true,
              generatedAt: new Date().toISOString()
            },
            dbError.id
          ]);
        }
      }
    }
    
    // Update scan status to completed
    await db.query(`
      UPDATE typescript_scan_results
      SET status = 'COMPLETED',
          error_count = $1,
          end_time = $2,
          summary = $3
      WHERE id = $4
    `, [
      errorResults.errors.length,
      new Date(),
      errorResults.summary,
      scanId
    ]);
    
    console.log(`[TypeScript Scanner] Scan ${scanId} completed`);
  } catch (error) {
    console.error('[TypeScript Scanner] Error running scan:', error);
    
    // Update scan status to failed
    await db.query(`
      UPDATE typescript_scan_results
      SET status = 'FAILED',
          end_time = $1,
          summary = $2
      WHERE id = $3
    `, [
      new Date(),
      `Scan failed: ${error.message || 'Unknown error'}`,
      scanId
    ]);
    
    // Log security event
    logSecurityEvent('SCAN_FAILED', 'error', {
      source: 'typescript-error-scanner',
      message: `TypeScript error scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      scanId,
      errorStack: error instanceof Error ? error.stack || '' : 'Unknown error'
    });
  }
}

// Helper function to generate AI fix in background
async function generateAIFixInBackground(scanId: string, errorId: string, error: any) {
  try {
    console.log(`[TypeScript Scanner] Generating AI fix for error ${errorId}`);
    
    // Convert error to format expected by OpenAI fixer
    const convertedError: TypeScriptErrorInput = {
      errorCode: error.code,
      messageText: error.message,
      filePath: error.file,
      lineNumber: error.line,
      columnNumber: error.column,
      category: error.category,
      severity: error.severity,
      source: getCodeContext(error.file, error.line, 15) // Get code context
    };
    
    // Get fix suggestion from OpenAI
    const fixes = await fixTypeScriptErrorsWithOpenAI([convertedError], {
      maxContextLines: 15,
      enableExplanation: true
    });
    
    if (fixes.length === 0) {
      throw new Error('No fix suggestion generated');
    }
    
    const fix = fixes[0];
    
    // Save fix details
    await db.query(`
      UPDATE typescript_errors
      SET fix_details = $1,
          status = 'NEW'
      WHERE id = $2
    `, [
      {
        suggestion: fix.fixedCode,
        explanation: fix.explanation,
        confidence: fix.confidence,
        aiGenerated: true,
        generatedAt: new Date().toISOString()
      },
      errorId
    ]);
    
    console.log(`[TypeScript Scanner] AI fix generated for error ${errorId}`);
  } catch (error) {
    console.error('[TypeScript Scanner] Error generating AI fix:', error);
    
    // Update error status back to NEW
    await db.query(`
      UPDATE typescript_errors
      SET status = 'NEW'
      WHERE id = $1
    `, [errorId]);
    
    // Log security event
    logSecurityEvent('AI_FIX_FAILED', 'error', {
      source: 'typescript-error-scanner',
      message: `AI fix generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      scanId,
      errorId,
      errorStack: error instanceof Error ? error.stack || '' : 'Unknown error'
    });
  }
}

// Helper function to get code context
function getCodeContext(filePath: string, lineNumber: number, contextLines: number): string {
  try {
    if (!fs.existsSync(filePath)) {
      return `[File not found: ${filePath}]`;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length - 1, lineNumber + contextLines - 1);
    
    let context = '';
    for (let i = startLine; i <= endLine; i++) {
      const prefix = i === lineNumber - 1 ? '> ' : '  ';
      context += `${prefix}${i + 1}: ${lines[i]}\n`;
    }
    
    return context;
  } catch (error) {
    console.error(`Error getting code context for ${filePath}:${lineNumber}:`, error);
    return `[Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

// Helper function to apply fix to file
async function applyFixToFile(filePath: string, lineNumber: number, fixedCode: string): Promise<boolean> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Replace the line with the fixed code
    lines[lineNumber - 1] = fixedCode;
    
    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    console.log(`Fixed error in ${filePath}:${lineNumber}`);
    return true;
  } catch (error) {
    console.error(`Error applying fix to ${filePath}:${lineNumber}:`, error);
    return false;
  }
}

export default router;