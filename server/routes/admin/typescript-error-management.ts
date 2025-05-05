/**
 * TypeScript Error Management API Routes
 * 
 * This module provides a set of API endpoints for managing TypeScript errors.
 * It uses the TypeScriptErrorAdapter to interact with the database.
 */

import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middlewares/validationMiddleware';
import typescriptErrorAdapter from '../../utils/typescript-error-adapter';
import { findTypeScriptErrors } from '../../utils/ts-error-finder';
import { analyzeTypeScriptErrors } from '../../utils/ts-error-analyzer';
import { fixTypeScriptErrorsWithOpenAI } from '../../utils/openai-enhanced-fixer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Simple test endpoint that doesn't require any validation or database access
router.get('/test', (req, res) => {
  // Set special flag to skip CSRF validation (similar to the Content API)
  req.__skipCSRF = true;
  
  console.log('[TypeScript Error Management API] Test endpoint called with CSRF bypass');
  res.json({
    success: true,
    message: 'TypeScript Error Management API is working',
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
  param('errorId').isInt().toInt()
];

// Get all scans
router.get('/scans', async (req, res) => {
  try {
    // Set special flag to skip CSRF validation
    req.__skipCSRF = true;
    
    const scans = await typescriptErrorAdapter.getAllScans();
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
    
    const scan = await typescriptErrorAdapter.getScan(id);
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    const errors = await typescriptErrorAdapter.getErrorsForScan(id);
    
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
  try {
    // Set special flag to skip CSRF validation
    req.__skipCSRF = true;
    
    const { aiEnabled = false } = req.body;
    
    const scan = await typescriptErrorAdapter.createScan({ aiEnabled });
    
    // Start scan in background
    runScanInBackground(scan.id, aiEnabled);
    
    res.status(201).json({
      ...scan,
      message: 'Scan initiated successfully'
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
    
    // Get error fixes
    const fixes = await typescriptErrorAdapter.getFixesForError(errorId);
    
    if (!fixes || fixes.length === 0) {
      return res.status(400).json({ error: 'No fix available for this error' });
    }
    
    // Get the latest fix
    const latestFix = fixes[0];
    
    if (!latestFix.fixedCode) {
      return res.status(400).json({ error: 'Fix has no code solution' });
    }
    
    // Get errors for this scan to find the file and line info
    const errors = await typescriptErrorAdapter.getErrorsForScan(scanId);
    const error = errors.find(e => e.id === errorId);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found in scan' });
    }
    
    // Apply fix to file
    const fixApplied = await applyFixToFile(error.file, error.line, latestFix.fixedCode);
    
    if (!fixApplied) {
      return res.status(500).json({ error: 'Failed to apply fix to file' });
    }
    
    res.json({
      success: true,
      message: 'Fix applied successfully',
      errorId,
      fixId: latestFix.id
    });
  } catch (error) {
    console.error('Error applying fix:', error);
    res.status(500).json({ error: 'Failed to apply fix' });
  }
});

// Generate AI fix for error
router.post('/scans/:scanId/errors/:errorId/ai-fix', errorFixValidation, validate, async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get errors for this scan
    const errors = await typescriptErrorAdapter.getErrorsForScan(scanId);
    const error = errors.find(e => e.id === errorId);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found in scan' });
    }
    
    // Check if this error already has a fix
    const existingFixes = await typescriptErrorAdapter.getFixesForError(errorId);
    
    if (existingFixes && existingFixes.length > 0) {
      return res.status(400).json({ 
        error: 'Error already has a fix suggestion',
        fixId: existingFixes[0].id
      });
    }
    
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
    console.log(`[TypeScript Error Management] Starting scan ${scanId}${aiEnabled ? ' with AI' : ''}`);
    
    // Run TypeScript error finding
    const projectRoot = process.cwd();
    const errorResults = await findTypeScriptErrors({
      projectRoot,
      maxErrors: 100
    });
    
    console.log(`[TypeScript Error Management] Found ${errorResults.errors.length} errors`);
    
    // Save errors to database
    for (const error of errorResults.errors) {
      await typescriptErrorAdapter.addError(scanId, {
        code: error.code,
        file: error.file,
        line: error.line,
        column: error.column,
        message: error.message,
        context: error.context || '',
        category: error.category || 'other',
        severity: error.severity || 'medium'
      });
    }
    
    // If AI is enabled, analyze errors
    if (aiEnabled && errorResults.errors.length > 0) {
      console.log(`[TypeScript Error Management] Analyzing errors with AI`);
      
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
        
        console.log(`[TypeScript Error Management] Received ${fixes.length} fix suggestions from OpenAI`);
        
        // Save fixes to database
        for (const fix of fixes) {
          if (!fix.error || !fix.error.filePath || !fix.error.lineNumber) {
            continue;
          }
          
          // Find the matching error from our database
          const matchingErrors = await typescriptErrorAdapter.getErrorsForScan(scanId);
          const dbError = matchingErrors.find(e => 
            e.file === fix.error.filePath && 
            e.line === fix.error.lineNumber
          );
          
          if (!dbError) {
            continue;
          }
          
          // Save fix
          await typescriptErrorAdapter.addFix(dbError.id, {
            fixedCode: fix.fixedCode,
            explanation: fix.explanation,
            confidence: fix.confidence || 50,
            aiGenerated: true
          });
        }
      }
    }
    
    // Update scan status to completed
    await typescriptErrorAdapter.updateScan(scanId, {
      status: 'COMPLETED',
      errorCount: errorResults.errors.length,
      endTime: new Date(),
      summary: errorResults.summary
    });
    
    console.log(`[TypeScript Error Management] Scan ${scanId} completed`);
  } catch (error) {
    console.error('[TypeScript Error Management] Error running scan:', error);
    
    // Update scan status to failed
    await typescriptErrorAdapter.updateScan(scanId, {
      status: 'FAILED',
      endTime: new Date(),
      summary: `Scan failed: ${error.message || 'Unknown error'}`
    });
  }
}

// Helper function to generate AI fix in background
async function generateAIFixInBackground(scanId: string, errorId: number, error: any) {
  try {
    console.log(`[TypeScript Error Management] Generating AI fix for error ${errorId}`);
    
    // Get file content
    const filePath = error.file;
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Get context lines
    const contextStart = Math.max(0, error.line - 10);
    const contextEnd = Math.min(lines.length, error.line + 10);
    const contextLines = lines.slice(contextStart, contextEnd);
    
    // Convert error to format expected by OpenAI fixer
    const convertedError = {
      errorCode: error.code,
      messageText: error.message,
      filePath: error.file,
      lineNumber: error.line,
      columnNumber: error.column,
      category: error.category,
      severity: error.severity,
      source: contextLines.join('\n')
    };
    
    // Generate AI fix
    const fixes = await fixTypeScriptErrorsWithOpenAI([convertedError], {
      maxContextLines: 20,
      enableExplanation: true
    });
    
    if (!fixes || fixes.length === 0) {
      console.error(`No fix generated for error ${errorId}`);
      return;
    }
    
    const fix = fixes[0];
    
    // Save fix to database
    await typescriptErrorAdapter.addFix(errorId, {
      fixedCode: fix.fixedCode,
      explanation: fix.explanation,
      confidence: fix.confidence || 50,
      aiGenerated: true
    });
    
    console.log(`[TypeScript Error Management] AI fix generated for error ${errorId}`);
  } catch (error) {
    console.error(`[TypeScript Error Management] Error generating AI fix for error ${errorId}:`, error);
  }
}

// Helper function to apply a fix to a file
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