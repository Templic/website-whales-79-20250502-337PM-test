/**
 * TypeScript Error Management Routes
 * 
 * RESTful API endpoints for the TypeScript Error Management System.
 */

import { Router } from 'express';
import { tsErrorStorage } from '../tsErrorStorage';
import { analyzeProject } from '../utils/ts-error-analyzer';
import { fixAllErrors, findFixesForError, applyFix, fixBatchErrors } from '../utils/ts-error-fixer';
import { z } from 'zod';
import { TypescriptError } from '../../shared/schema';

// Create a router
export const typescriptErrorRouter = Router();

// Validation schemas
const errorQuerySchema = z.object({
  filePath: z.string().optional(),
  errorCode: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().transform(Number).optional(),
  patternId: z.string().transform(Number).optional(),
  fromDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
  toDate: z.string().optional().transform(s => s ? new Date(s) : undefined)
});

const errorPatternQuerySchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional()
});

const errorFixQuerySchema = z.object({
  patternId: z.string().transform(Number).optional(),
  autoFixable: z.string().transform(s => s === 'true').optional()
});

const runAnalysisSchema = z.object({
  userId: z.number().optional(),
  includeAllErrors: z.boolean().optional().default(false)
});

const runFixSchema = z.object({
  userId: z.number().optional(),
  autoFixOnly: z.boolean().optional().default(true)
});

const batchFixSchema = z.object({
  errorIds: z.array(z.number()),
  userId: z.number().optional(),
  autoFixOnly: z.boolean().optional().default(true)
});

const applyFixSchema = z.object({
  errorId: z.number(),
  fixId: z.number(),
  userId: z.number().optional()
});

// Get all TypeScript errors
typescriptErrorRouter.get('/', async (req, res) => {
  try {
    const parsedQuery = errorQuerySchema.safeParse(req.query);
    
    if (!parsedQuery.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: parsedQuery.error.errors
      });
    }
    
    const errors = await tsErrorStorage.getAllTypescriptErrors(parsedQuery.data);
    return res.json(errors);
  } catch (error) {
    console.error('Error fetching TypeScript errors:', error);
    return res.status(500).json({ error: 'Failed to fetch TypeScript errors' });
  }
});

// Get TypeScript error statistics
typescriptErrorRouter.get('/stats', async (req, res) => {
  try {
    const fromDate = req.query.fromDate 
      ? new Date(req.query.fromDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    
    const stats = await tsErrorStorage.getTypescriptErrorStats(fromDate);
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching TypeScript error statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch TypeScript error statistics' });
  }
});

// Get a specific TypeScript error
typescriptErrorRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid error ID' });
    }
    
    const error = await tsErrorStorage.getTypescriptError(id);
    if (!error) {
      return res.status(404).json({ error: 'TypeScript error not found' });
    }
    
    return res.json(error);
  } catch (error) {
    console.error('Error fetching TypeScript error:', error);
    return res.status(500).json({ error: 'Failed to fetch TypeScript error' });
  }
});

// Run a TypeScript analysis
typescriptErrorRouter.post('/analyze', async (req, res) => {
  try {
    const parsedBody = runAnalysisSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: parsedBody.error.errors
      });
    }
    
    const result = await analyzeProject();
    
    return res.json({
      message: 'Analysis completed successfully',
      result
    });
  } catch (error) {
    console.error('Error running TypeScript analysis:', error);
    return res.status(500).json({ error: 'Failed to run TypeScript analysis' });
  }
});

// Fix all TypeScript errors
typescriptErrorRouter.post('/fix', async (req, res) => {
  try {
    const parsedBody = runFixSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: parsedBody.error.errors
      });
    }
    
    const { userId = 1, autoFixOnly } = parsedBody.data;
    const result = await fixAllErrors(userId, autoFixOnly);
    
    return res.json({
      message: 'Fix operation completed successfully',
      result
    });
  } catch (error) {
    console.error('Error fixing TypeScript errors:', error);
    return res.status(500).json({ error: 'Failed to fix TypeScript errors' });
  }
});

// Fix a batch of TypeScript errors
typescriptErrorRouter.post('/batch-fix', async (req, res) => {
  try {
    const parsedBody = batchFixSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: parsedBody.error.errors
      });
    }
    
    const { errorIds, userId = 1, autoFixOnly } = parsedBody.data;
    
    if (errorIds.length === 0) {
      return res.status(400).json({ error: 'No error IDs provided for batch fix' });
    }
    
    const result = await fixBatchErrors(errorIds, userId, autoFixOnly);
    
    return res.json({
      message: 'Batch fix operation completed successfully',
      result
    });
  } catch (error) {
    console.error('Error fixing batch of TypeScript errors:', error);
    return res.status(500).json({ error: 'Failed to fix batch of TypeScript errors' });
  }
});

// Get fixes for a specific error
typescriptErrorRouter.get('/:id/fixes', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid error ID' });
    }
    
    const error = await tsErrorStorage.getTypescriptError(id);
    if (!error) {
      return res.status(404).json({ error: 'TypeScript error not found' });
    }
    
    // Convert to TypeScriptError format for the fixer
    const tsError = {
      filePath: error.filePath,
      line: error.lineNumber,
      column: error.columnNumber,
      code: error.errorCode.replace(/^TS/, ''),
      message: error.errorMessage,
      category: error.category,
      severity: error.severity,
      context: error.errorContext
    };
    
    const fixes = await findFixesForError(tsError);
    return res.json(fixes);
  } catch (error) {
    console.error('Error fetching fixes for TypeScript error:', error);
    return res.status(500).json({ error: 'Failed to fetch fixes for TypeScript error' });
  }
});

// Apply a fix to a specific error
typescriptErrorRouter.post('/:id/fix', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid error ID' });
    }
    
    const parsedBody = applyFixSchema.safeParse({
      ...req.body,
      errorId: id
    });
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: parsedBody.error.errors
      });
    }
    
    const { errorId, fixId, userId = 1 } = parsedBody.data;
    
    // Get the error
    const error = await tsErrorStorage.getTypescriptError(errorId);
    if (!error) {
      return res.status(404).json({ error: 'TypeScript error not found' });
    }
    
    // Convert to TypeScriptError format for the fixer
    const tsError = {
      filePath: error.filePath,
      line: error.lineNumber,
      column: error.columnNumber,
      code: error.errorCode.replace(/^TS/, ''),
      message: error.errorMessage,
      category: error.category,
      severity: error.severity,
      context: error.errorContext
    };
    
    // Get available fixes
    const fixes = await findFixesForError(tsError);
    const fix = fixes.find(f => f.id === fixId);
    
    if (!fix) {
      return res.status(404).json({ error: 'Fix not found for this error' });
    }
    
    // Apply the fix
    const result = await applyFix(
      error.filePath,
      error.lineNumber,
      error.columnNumber,
      fix,
      errorId,
      userId
    );
    
    return res.json({
      message: result.success 
        ? 'Fix applied successfully' 
        : 'Failed to apply fix',
      result
    });
  } catch (error) {
    console.error('Error applying fix to TypeScript error:', error);
    return res.status(500).json({ error: 'Failed to apply fix to TypeScript error' });
  }
});

// Get fix history for a specific error
typescriptErrorRouter.get('/:id/history', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid error ID' });
    }
    
    const error = await tsErrorStorage.getTypescriptError(id);
    if (!error) {
      return res.status(404).json({ error: 'TypeScript error not found' });
    }
    
    const history = await tsErrorStorage.getFixHistoryForError(id);
    return res.json(history);
  } catch (error) {
    console.error('Error fetching fix history:', error);
    return res.status(500).json({ error: 'Failed to fetch fix history' });
  }
});

// Update a TypeScript error
typescriptErrorRouter.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid error ID' });
    }
    
    const error = await tsErrorStorage.getTypescriptError(id);
    if (!error) {
      return res.status(404).json({ error: 'TypeScript error not found' });
    }
    
    const updatedError = await tsErrorStorage.updateTypescriptError(id, req.body);
    return res.json(updatedError);
  } catch (error) {
    console.error('Error updating TypeScript error:', error);
    return res.status(500).json({ error: 'Failed to update TypeScript error' });
  }
});

// Get all error patterns
typescriptErrorRouter.get('/patterns', async (req, res) => {
  try {
    const parsedQuery = errorPatternQuerySchema.safeParse(req.query);
    
    if (!parsedQuery.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: parsedQuery.error.errors
      });
    }
    
    const patterns = parsedQuery.data.category
      ? await tsErrorStorage.getErrorPatternsByCategory(parsedQuery.data.category)
      : await tsErrorStorage.getAllErrorPatterns();
    
    return res.json(patterns);
  } catch (error) {
    console.error('Error fetching error patterns:', error);
    return res.status(500).json({ error: 'Failed to fetch error patterns' });
  }
});

// Create a new error pattern
typescriptErrorRouter.post('/patterns', async (req, res) => {
  try {
    const newPattern = await tsErrorStorage.createErrorPattern(req.body);
    return res.status(201).json(newPattern);
  } catch (error) {
    console.error('Error creating error pattern:', error);
    return res.status(500).json({ error: 'Failed to create error pattern' });
  }
});

// Get all error fixes
typescriptErrorRouter.get('/fixes', async (req, res) => {
  try {
    const parsedQuery = errorFixQuerySchema.safeParse(req.query);
    
    if (!parsedQuery.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: parsedQuery.error.errors
      });
    }
    
    const fixes = parsedQuery.data.patternId
      ? await tsErrorStorage.getFixesByPatternId(parsedQuery.data.patternId)
      : await tsErrorStorage.getAllErrorFixes();
    
    return res.json(fixes);
  } catch (error) {
    console.error('Error fetching error fixes:', error);
    return res.status(500).json({ error: 'Failed to fetch error fixes' });
  }
});

// Create a new error fix
typescriptErrorRouter.post('/fixes', async (req, res) => {
  try {
    const newFix = await tsErrorStorage.createErrorFix(req.body);
    return res.status(201).json(newFix);
  } catch (error) {
    console.error('Error creating error fix:', error);
    return res.status(500).json({ error: 'Failed to create error fix' });
  }
});

// Export the router
export default typescriptErrorRouter;