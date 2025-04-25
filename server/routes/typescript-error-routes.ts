/**
 * @file typescript-error-routes.ts
 * @description API routes for the TypeScript error management system
 * 
 * This module provides API endpoints for managing TypeScript errors, patterns, fixes, and analysis.
 */

import { Request, Response, Router } from 'express';
import * as tsErrorStorage from '../tsErrorStorage';
import * as openAI from '../utils/openai-integration';
import * as tsTypeAnalyzer from '../utils/ts-type-analyzer';
import * as tsBatchFixer from '../utils/ts-batch-fixer';
import { findTypeScriptFiles } from '../utils/ts-type-analyzer';
import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptError, ErrorCategory, ErrorSeverity, ErrorStatus, ErrorPattern, ErrorFix } from '../types/core/error-types';

const router = Router();

// Middleware to check if the user is an admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  // In a real app, check if the user has admin role
  // For now, we'll just allow all requests in development
  next();
};

/**
 * Get all TypeScript errors
 * 
 * GET /api/typescript/errors
 */
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const { 
      query,
      filePath,
      category,
      severity,
      status,
      sort,
      sortDirection,
      limit = '20',
      offset = '0'
    } = req.query;
    
    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };
    
    if (query) filters.query = query as string;
    if (filePath) filters.filePath = filePath as string;
    if (category) filters.category = category as ErrorCategory;
    if (severity) filters.severity = severity as ErrorSeverity;
    if (status) filters.status = status as ErrorStatus;
    if (sort) filters.sort = sort as string;
    if (sortDirection) filters.sortDirection = sortDirection as 'asc' | 'desc';
    
    const result = await tsErrorStorage.searchTypescriptErrors(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching TypeScript errors:', error);
    res.status(500).json({ message: 'Failed to fetch TypeScript errors' });
  }
});

/**
 * Get a specific TypeScript error by ID
 * 
 * GET /api/typescript/errors/:id
 */
router.get('/errors/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const error = await tsErrorStorage.getTypescriptError(id);
    
    if (!error) {
      return res.status(404).json({ message: 'TypeScript error not found' });
    }
    
    res.json(error);
  } catch (error) {
    console.error('Error fetching TypeScript error:', error);
    res.status(500).json({ message: 'Failed to fetch TypeScript error' });
  }
});

/**
 * Add a new TypeScript error
 * 
 * POST /api/typescript/errors
 */
router.post('/errors', async (req: Request, res: Response) => {
  try {
    const error = req.body;
    const added = await tsErrorStorage.addTypescriptError(error);
    
    res.status(201).json(added);
  } catch (error) {
    console.error('Error adding TypeScript error:', error);
    res.status(500).json({ message: 'Failed to add TypeScript error' });
  }
});

/**
 * Update a TypeScript error
 * 
 * PATCH /api/typescript/errors/:id
 */
router.patch('/errors/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const updated = await tsErrorStorage.updateTypescriptError(id, updates);
    
    if (!updated) {
      return res.status(404).json({ message: 'TypeScript error not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating TypeScript error:', error);
    res.status(500).json({ message: 'Failed to update TypeScript error' });
  }
});

/**
 * Delete a TypeScript error
 * 
 * DELETE /api/typescript/errors/:id
 */
router.delete('/errors/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await tsErrorStorage.deleteTypescriptError(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'TypeScript error not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting TypeScript error:', error);
    res.status(500).json({ message: 'Failed to delete TypeScript error' });
  }
});

/**
 * Get TypeScript error statistics
 * 
 * GET /api/typescript/errors/stats
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await tsErrorStorage.getTypescriptErrorStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching TypeScript error stats:', error);
    res.status(500).json({ message: 'Failed to fetch TypeScript error stats' });
  }
});

/**
 * Analyze a TypeScript error using OpenAI
 * 
 * POST /api/typescript/errors/:id/analyze
 */
router.post('/errors/:id/analyze', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const error = await tsErrorStorage.getTypescriptError(id);
    
    if (!error) {
      return res.status(404).json({ message: 'TypeScript error not found' });
    }
    
    const analysis = await openAI.analyzeError(error);
    
    // Update the error with the analysis results
    const updated = await tsErrorStorage.updateTypescriptError(id, {
      category: analysis.category,
      severity: analysis.severity,
      status: 'analyzed',
      metadata: {
        ...error.metadata,
        rootCause: analysis.rootCause,
        explanation: analysis.explanation,
        cascading: analysis.cascading,
        analyzedAt: new Date().toISOString()
      }
    });
    
    res.json({
      error: updated,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing TypeScript error:', error);
    res.status(500).json({ message: 'Failed to analyze TypeScript error' });
  }
});

/**
 * Generate fixes for a TypeScript error
 * 
 * POST /api/typescript/errors/:id/generate-fixes
 */
router.post('/errors/:id/generate-fixes', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const error = await tsErrorStorage.getTypescriptError(id);
    
    if (!error) {
      return res.status(404).json({ message: 'TypeScript error not found' });
    }
    
    const fixSuggestion = await openAI.generateErrorFix(error);
    
    // Add the fix to the database
    const fix = await tsErrorStorage.addErrorFix({
      errorId: error.id,
      fixTitle: `AI-generated fix for ${error.errorCode}`,
      fixDescription: fixSuggestion.fixExplanation,
      fixCode: fixSuggestion.fixCode,
      originalCode: fixSuggestion.originalCode,
      fixScope: fixSuggestion.fixScope,
      fixType: 'semi-automatic',
      fixPriority: 5,
      successRate: fixSuggestion.confidence * 100
    });
    
    res.json({
      error,
      fix,
      confidence: fixSuggestion.confidence,
      additionalRecommendations: fixSuggestion.additionalRecommendations
    });
  } catch (error) {
    console.error('Error generating fixes for TypeScript error:', error);
    res.status(500).json({ message: 'Failed to generate fixes for TypeScript error' });
  }
});

/**
 * Apply a fix to a TypeScript error
 * 
 * POST /api/typescript/errors/:id/apply-fix/:fixId
 */
router.post('/errors/:id/apply-fix/:fixId', async (req: Request, res: Response) => {
  try {
    const errorId = parseInt(req.params.id);
    const fixId = parseInt(req.params.fixId);
    
    const error = await tsErrorStorage.getTypescriptError(errorId);
    if (!error) {
      return res.status(404).json({ message: 'TypeScript error not found' });
    }
    
    const fix = await tsErrorStorage.getErrorFix(fixId);
    if (!fix) {
      return res.status(404).json({ message: 'Fix not found' });
    }
    
    // Read the file content
    if (!fs.existsSync(error.filePath)) {
      return res.status(404).json({ message: `File ${error.filePath} not found` });
    }
    
    const fileContent = fs.readFileSync(error.filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    let fixedContent = fileContent;
    
    // Apply the fix
    try {
      switch (fix.fixScope) {
        case 'line':
          // Replace the entire line
          lines[error.lineNumber - 1] = fix.fixCode;
          fixedContent = lines.join('\n');
          break;
          
        case 'token':
          // Replace just the token at the error position
          const line = lines[error.lineNumber - 1];
          const tokenStart = error.columnNumber - 1;
          let tokenEnd = tokenStart;
          
          // Find token boundaries
          while (tokenEnd < line.length && 
                 !/[\s\(\)\[\]\{\}\:\;\,\.\<\>\=\+\-\*\/\&\|\^\!\~\?\@\#\%]/.test(line[tokenEnd])) {
            tokenEnd++;
          }
          
          const newLine = line.substring(0, tokenStart) + fix.fixCode + line.substring(tokenEnd);
          lines[error.lineNumber - 1] = newLine;
          fixedContent = lines.join('\n');
          break;
          
        case 'custom':
          // Replace the exact code specified in originalCode
          if (fix.originalCode && fileContent.includes(fix.originalCode)) {
            fixedContent = fileContent.replace(fix.originalCode, fix.fixCode);
          } else {
            return res.status(400).json({ 
              message: 'Cannot apply custom fix: originalCode not found in file' 
            });
          }
          break;
      }
      
      // Write the fixed content back to the file
      fs.writeFileSync(error.filePath, fixedContent);
      
      // Add fix history entry
      const fixHistory = await tsErrorStorage.addErrorFixHistory({
        errorId: error.id,
        fixId: fix.id,
        originalCode: fileContent,
        fixedCode: fixedContent,
        fixedAt: new Date(),
        fixMethod: 'assisted',
        fixResult: 'success'
      });
      
      // Update error status
      const updatedError = await tsErrorStorage.updateTypescriptError(error.id, {
        status: 'fixed',
        fixId: fix.id,
        resolvedAt: new Date()
      });
      
      res.json({
        error: updatedError,
        fix,
        fixHistory,
        success: true
      });
    } catch (error) {
      console.error('Error applying fix:', error);
      res.status(500).json({ message: 'Failed to apply fix', error: String(error) });
    }
  } catch (error) {
    console.error('Error in apply-fix route:', error);
    res.status(500).json({ message: 'Failed to process fix application' });
  }
});

/**
 * Get all error patterns
 * 
 * GET /api/typescript/patterns
 */
router.get('/patterns', async (_req: Request, res: Response) => {
  try {
    const patterns = await tsErrorStorage.getErrorPatternsByCategory(
      _req.query.category as ErrorCategory
    );
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching error patterns:', error);
    res.status(500).json({ message: 'Failed to fetch error patterns' });
  }
});

/**
 * Add a new error pattern
 * 
 * POST /api/typescript/patterns
 */
router.post('/patterns', isAdmin, async (req: Request, res: Response) => {
  try {
    const pattern = req.body;
    const added = await tsErrorStorage.addErrorPattern(pattern);
    
    res.status(201).json(added);
  } catch (error) {
    console.error('Error adding error pattern:', error);
    res.status(500).json({ message: 'Failed to add error pattern' });
  }
});

/**
 * Update an error pattern
 * 
 * PATCH /api/typescript/patterns/:id
 */
router.patch('/patterns/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const updated = await tsErrorStorage.updateErrorPattern(id, updates);
    
    if (!updated) {
      return res.status(404).json({ message: 'Error pattern not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating error pattern:', error);
    res.status(500).json({ message: 'Failed to update error pattern' });
  }
});

/**
 * Delete an error pattern
 * 
 * DELETE /api/typescript/patterns/:id
 */
router.delete('/patterns/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await tsErrorStorage.deleteErrorPattern(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Error pattern not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting error pattern:', error);
    res.status(500).json({ message: 'Failed to delete error pattern' });
  }
});

/**
 * Get fixes for an error
 * 
 * GET /api/typescript/errors/:id/fixes
 */
router.get('/errors/:id/fixes', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const fixes = await tsErrorStorage.getErrorFixesByError(id);
    
    res.json(fixes);
  } catch (error) {
    console.error('Error fetching fixes:', error);
    res.status(500).json({ message: 'Failed to fetch fixes' });
  }
});

/**
 * Get fix history for an error
 * 
 * GET /api/typescript/errors/:id/fix-history
 */
router.get('/errors/:id/fix-history', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const history = await tsErrorStorage.getErrorFixHistoryByError(id);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching fix history:', error);
    res.status(500).json({ message: 'Failed to fetch fix history' });
  }
});

/**
 * Analyze type hierarchy
 * 
 * GET /api/typescript/analyze/type-hierarchy
 */
router.get('/analyze/type-hierarchy', async (_req: Request, res: Response) => {
  try {
    const projectPath = './';
    const hierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(projectPath);
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Error analyzing type hierarchy:', error);
    res.status(500).json({ message: 'Failed to analyze type hierarchy' });
  }
});

/**
 * Generate type coverage report
 * 
 * GET /api/typescript/analyze/type-coverage
 */
router.get('/analyze/type-coverage', async (_req: Request, res: Response) => {
  try {
    const projectPath = './';
    const coverage = await tsTypeAnalyzer.generateTypeCoverageReport(projectPath);
    
    res.json(coverage);
  } catch (error) {
    console.error('Error generating type coverage report:', error);
    res.status(500).json({ message: 'Failed to generate type coverage report' });
  }
});

/**
 * Identify type hotspots
 * 
 * GET /api/typescript/analyze/type-hotspots
 */
router.get('/analyze/type-hotspots', async (_req: Request, res: Response) => {
  try {
    const projectPath = './';
    const coverage = await tsTypeAnalyzer.generateTypeCoverageReport(projectPath);
    const hotspots = tsTypeAnalyzer.identifyTypeHotspots(coverage);
    
    res.json(hotspots);
  } catch (error) {
    console.error('Error identifying type hotspots:', error);
    res.status(500).json({ message: 'Failed to identify type hotspots' });
  }
});

/**
 * Generate missing interfaces for a file
 * 
 * POST /api/typescript/generate-interfaces
 */
router.post('/generate-interfaces', async (req: Request, res: Response) => {
  try {
    const { filePath, missingTypes } = req.body;
    
    if (!filePath || !missingTypes || !Array.isArray(missingTypes)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    const interfaces = await tsTypeAnalyzer.generateMissingInterfaces(filePath, missingTypes);
    
    res.json(interfaces);
  } catch (error) {
    console.error('Error generating missing interfaces:', error);
    res.status(500).json({ message: 'Failed to generate missing interfaces' });
  }
});

/**
 * Apply multiple fixes to a file in batch
 * 
 * POST /api/typescript/apply-batch-fixes
 */
router.post('/apply-batch-fixes', async (req: Request, res: Response) => {
  try {
    const { fixes } = req.body;
    
    if (!fixes || !Array.isArray(fixes)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    // Load error and fix details
    const fixesWithDetails = await Promise.all(
      fixes.map(async (fix: { errorId: number; fixId: number }) => {
        const error = await tsErrorStorage.getTypescriptError(fix.errorId);
        const fixDetail = await tsErrorStorage.getErrorFix(fix.fixId);
        
        if (!error || !fixDetail) {
          throw new Error(`Error or fix not found: error=${fix.errorId}, fix=${fix.fixId}`);
        }
        
        return {
          error,
          fix: fixDetail
        };
      })
    );
    
    // Group fixes by file
    const fixesByFile: Record<string, typeof fixesWithDetails> = {};
    for (const fixWithDetails of fixesWithDetails) {
      const file = fixWithDetails.error.filePath;
      fixesByFile[file] = fixesByFile[file] || [];
      fixesByFile[file].push(fixWithDetails);
    }
    
    // Apply fixes file by file
    const results: Record<string, boolean> = {};
    for (const [file, fileFixes] of Object.entries(fixesByFile)) {
      results[file] = await tsBatchFixer.applyMultipleFixesToFile(file, fileFixes);
    }
    
    res.json({
      success: Object.values(results).every(Boolean),
      results
    });
  } catch (error) {
    console.error('Error applying batch fixes:', error);
    res.status(500).json({ message: 'Failed to apply batch fixes' });
  }
});

/**
 * Analyze batch errors for dependency-aware fixing
 * 
 * POST /api/typescript/analyze-batch-errors
 */
router.post('/analyze-batch-errors', async (req: Request, res: Response) => {
  try {
    const { errorIds } = req.body;
    
    if (!errorIds || !Array.isArray(errorIds)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    // Load errors
    const errors = await Promise.all(
      errorIds.map(async (id: number) => {
        const error = await tsErrorStorage.getTypescriptError(id);
        
        if (!error) {
          throw new Error(`Error not found: ${id}`);
        }
        
        return error;
      })
    );
    
    // Build dependency graph
    const dependencyGraph = tsBatchFixer.buildErrorDependencyGraph(errors);
    
    // Cluster errors by root cause
    const errorGroups = tsBatchFixer.clusterErrorsByRootCause(errors);
    
    res.json({
      dependencyGraph,
      errorGroups
    });
  } catch (error) {
    console.error('Error analyzing batch errors:', error);
    res.status(500).json({ message: 'Failed to analyze batch errors' });
  }
});

/**
 * Get error trends
 * 
 * GET /api/typescript/error-trends
 */
router.get('/error-trends', async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : 30;
    const trends = await tsErrorStorage.getErrorTrends(timeRange);
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching error trends:', error);
    res.status(500).json({ message: 'Failed to fetch error trends' });
  }
});

/**
 * Update fix success rates
 * 
 * POST /api/typescript/update-success-rates
 */
router.post('/update-success-rates', isAdmin, async (_req: Request, res: Response) => {
  try {
    await tsErrorStorage.updateFixSuccessRates();
    
    res.json({ message: 'Success rates updated' });
  } catch (error) {
    console.error('Error updating success rates:', error);
    res.status(500).json({ message: 'Failed to update success rates' });
  }
});

/**
 * Start a new project analysis
 * 
 * POST /api/typescript/start-analysis
 */
router.post('/start-analysis', async (req: Request, res: Response) => {
  try {
    // Create a new project analysis
    const analysis = await tsErrorStorage.addProjectAnalysis({
      projectId: 1, // Default project ID
      status: 'in_progress'
    });
    
    // Run the analysis asynchronously
    runProjectAnalysis(analysis.id).catch(error => {
      console.error('Error running project analysis:', error);
    });
    
    res.json({
      message: 'Project analysis started',
      analysisId: analysis.id
    });
  } catch (error) {
    console.error('Error starting project analysis:', error);
    res.status(500).json({ message: 'Failed to start project analysis' });
  }
});

/**
 * Get the latest project analysis
 * 
 * GET /api/typescript/latest-analysis
 */
router.get('/latest-analysis', async (_req: Request, res: Response) => {
  try {
    const analysis = await tsErrorStorage.getLatestProjectAnalysis();
    
    if (!analysis) {
      return res.status(404).json({ message: 'No project analysis found' });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    res.status(500).json({ message: 'Failed to fetch latest analysis' });
  }
});

/**
 * Run a project analysis
 */
async function runProjectAnalysis(analysisId: number): Promise<void> {
  try {
    // Update analysis to in_progress
    await tsErrorStorage.updateProjectAnalysis(analysisId, {
      status: 'in_progress'
    });
    
    const startTime = Date.now();
    
    // Analyze type hierarchy
    const projectPath = './';
    const hierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(projectPath);
    const coverage = await tsTypeAnalyzer.generateTypeCoverageReport(projectPath);
    const hotspots = tsTypeAnalyzer.identifyTypeHotspots(coverage);
    
    // Get error statistics
    const stats = await tsErrorStorage.getTypescriptErrorStats();
    
    // Update analysis with results
    const endTime = Date.now();
    await tsErrorStorage.updateProjectAnalysis(analysisId, {
      status: 'completed',
      completedAt: new Date(),
      errorCount: stats.total,
      warningCount: coverage.implicitAnyCount,
      fixedCount: stats.fixed,
      duration: endTime - startTime,
      analysisData: {
        typeFoundation: {
          coverage: coverage.coverage,
          missingTypes: hierarchy.missingTypes,
          circularDependencies: hierarchy.circularDependencies
        },
        errorHotspots: {
          files: hotspots.reduce((acc, file) => {
            acc[file] = 1;
            return acc;
          }, {} as Record<string, number>)
        },
        trends: {
          errorReduction: stats.total > 0 ? (stats.fixed / stats.total) * 100 : 0,
          fixSuccessRate: 0 // Would need to calculate from fix history
        }
      }
    });
    
    console.log(`Project analysis ${analysisId} completed successfully`);
  } catch (error) {
    console.error(`Error running project analysis ${analysisId}:`, error);
    
    // Update analysis to failed
    await tsErrorStorage.updateProjectAnalysis(analysisId, {
      status: 'failed',
      completedAt: new Date(),
      analysisData: {
        error: String(error)
      }
    });
  }
}

export default router;