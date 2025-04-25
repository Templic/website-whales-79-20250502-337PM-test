/**
 * @file typescript-error-routes.ts
 * @description API routes for TypeScript error management
 * 
 * This module provides routes for scanning, analyzing, and fixing TypeScript errors.
 */

import { Router } from 'express';
import * as tsErrorFinder from '../utils/ts-error-finder';
import * as tsTypeAnalyzer from '../utils/ts-type-analyzer';
import * as tsTypeVisualizer from '../utils/ts-type-visualizer';
import * as tsBatchFixer from '../utils/ts-batch-fixer';
import * as openAI from '../utils/openai-integration';
import * as tsErrorStorage from '../tsErrorStorage';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

/**
 * Scan project for TypeScript errors
 * 
 * @route POST /api/typescript-errors/scan
 */
router.post('/scan', async (req, res) => {
  try {
    const { projectRoot, recursive, severity, userId } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Scan for errors
    const result = await tsErrorFinder.findTypeScriptErrors(projectRoot, {
      recursive: recursive !== false,
      severity: severity || 'high'
    });
    
    // Create project analysis record
    const analysisId = await tsErrorFinder.createProjectAnalysis(result, userId ? Number(userId) : undefined);
    
    return res.json({
      success: true,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      fileCount: result.fileCount,
      processingTimeMs: result.processingTimeMs,
      analysisId,
      addedErrors: result.addedErrors
    });
  } catch (error) {
    console.error('Error scanning for TypeScript errors:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Scan a specific file for TypeScript errors
 * 
 * @route POST /api/typescript-errors/scan-file
 */
router.post('/scan-file', async (req, res) => {
  try {
    const { filePath, severity } = req.body;
    
    // Validate required parameters
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Scan file for errors
    const result = await tsErrorFinder.findErrorsInFile(filePath, {
      severity: severity || 'high'
    });
    
    return res.json({
      success: true,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      processingTimeMs: result.processingTimeMs,
      addedErrors: result.addedErrors
    });
  } catch (error) {
    console.error('Error scanning file for TypeScript errors:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get project compilation status
 * 
 * @route POST /api/typescript-errors/status
 */
router.post('/status', async (req, res) => {
  try {
    const { projectRoot } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Get compilation status
    const status = await tsErrorFinder.getProjectCompilationStatus({
      projectRoot
    });
    
    return res.json({
      ...status,
      message: status.success 
        ? 'Project compiles successfully' 
        : `Project has ${status.errorCount} errors and ${status.warningCount} warnings`
    });
  } catch (error) {
    console.error('Error checking project compilation status:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Analyze TypeScript type hierarchy
 * 
 * @route POST /api/typescript-errors/analyze-types
 */
router.post('/analyze-types', async (req, res) => {
  try {
    const { projectRoot, outputDir } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Analyze type hierarchy
    const hierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(projectRoot);
    
    // Generate visualizations if requested
    if (outputDir) {
      const fullPath = path.isAbsolute(outputDir) 
        ? outputDir 
        : path.join(projectRoot, outputDir);
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      // Generate visualization report
      tsTypeVisualizer.createTypeVisualizationReport(hierarchy, fullPath);
      
      // Generate JSON data
      fs.writeFileSync(
        path.join(fullPath, 'type-hierarchy.json'),
        JSON.stringify(hierarchy, null, 2)
      );
    }
    
    // Return summary (without full type details to keep response size manageable)
    return res.json({
      success: true,
      summary: {
        typeCount: hierarchy.typeCount,
        interfaceCount: hierarchy.interfaceCount,
        enumCount: hierarchy.enumCount,
        typeAliasCount: hierarchy.typeAliasCount,
        genericTypeCount: hierarchy.genericTypeCount,
        circularDependencies: hierarchy.circularDependencies,
        orphanedTypes: hierarchy.orphanedTypes.length,
        missingTypes: hierarchy.missingTypes,
        largestTypes: hierarchy.largestTypes
      },
      visualizationPath: outputDir ? path.join(outputDir, 'index.html') : undefined
    });
  } catch (error) {
    console.error('Error analyzing TypeScript type hierarchy:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate type coverage report
 * 
 * @route POST /api/typescript-errors/type-coverage
 */
router.post('/type-coverage', async (req, res) => {
  try {
    const { projectRoot } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Generate type coverage report
    const coverage = await tsTypeAnalyzer.generateTypeCoverageReport(projectRoot);
    
    // Identify hotspots
    const hotspots = tsTypeAnalyzer.identifyTypeHotspots(coverage);
    
    // Return summary (without full file details to keep response size manageable)
    return res.json({
      success: true,
      summary: {
        totalNodes: coverage.totalNodes,
        anyTypeCount: coverage.anyTypeCount,
        implicitAnyCount: coverage.implicitAnyCount,
        unknownTypeCount: coverage.unknownTypeCount,
        explicitTypeCount: coverage.explicitTypeCount,
        coverage: coverage.coverage,
        missingTypeDeclarations: coverage.missingTypeDeclarations.length,
        hotspots
      }
    });
  } catch (error) {
    console.error('Error generating TypeScript type coverage report:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Analyze a TypeScript error using OpenAI
 * 
 * @route POST /api/typescript-errors/:id/analyze
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the error
    const error = await tsErrorStorage.getTypescriptError(Number(id));
    if (!error) {
      return res.status(404).json({
        success: false,
        message: `Error with ID ${id} not found`
      });
    }
    
    // Analyze the error
    const analysis = await openAI.analyzeError(error);
    
    // Update the error with the analysis results
    await tsErrorStorage.updateTypescriptError(Number(id), {
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
    
    return res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing TypeScript error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate a fix for a TypeScript error using OpenAI
 * 
 * @route POST /api/typescript-errors/:id/fix
 */
router.post('/:id/fix', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the error
    const error = await tsErrorStorage.getTypescriptError(Number(id));
    if (!error) {
      return res.status(404).json({
        success: false,
        message: `Error with ID ${id} not found`
      });
    }
    
    // Generate a fix
    const fixSuggestion = await openAI.generateErrorFix(error);
    
    // Add the fix to the database
    const fix = await tsErrorStorage.addErrorFix({
      errorId: Number(id),
      fixTitle: `AI-generated fix for ${error.errorCode}`,
      fixDescription: fixSuggestion.fixExplanation,
      fixCode: fixSuggestion.fixCode,
      originalCode: fixSuggestion.originalCode,
      fixScope: fixSuggestion.fixScope,
      fixType: 'semi-automatic',
      fixPriority: 5,
      successRate: fixSuggestion.confidence * 100
    });
    
    return res.json({
      success: true,
      fix,
      suggestion: fixSuggestion
    });
  } catch (error) {
    console.error('Error generating fix for TypeScript error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Apply a fix to a TypeScript error
 * 
 * @route POST /api/typescript-errors/:id/apply-fix/:fixId
 */
router.post('/:id/apply-fix/:fixId', async (req, res) => {
  try {
    const { id, fixId } = req.params;
    
    // Get the error
    const error = await tsErrorStorage.getTypescriptError(Number(id));
    if (!error) {
      return res.status(404).json({
        success: false,
        message: `Error with ID ${id} not found`
      });
    }
    
    // Get the fix
    const fix = await tsErrorStorage.getErrorFix(Number(fixId));
    if (!fix) {
      return res.status(404).json({
        success: false,
        message: `Fix with ID ${fixId} not found`
      });
    }
    
    // Make sure the fix is for this error
    if (fix.errorId !== Number(id)) {
      return res.status(400).json({
        success: false,
        message: `Fix ${fixId} is not associated with error ${id}`
      });
    }
    
    // Apply the fix
    try {
      // Read the file
      const fileContent = fs.readFileSync(error.filePath, 'utf-8');
      let fixedContent: string;
      
      // Apply the fix based on fix scope
      switch (fix.fixScope) {
        case 'line':
          const lines = fileContent.split('\n');
          lines[error.lineNumber - 1] = fix.fixCode;
          fixedContent = lines.join('\n');
          break;
          
        case 'token':
          const tokenLines = fileContent.split('\n');
          const line = tokenLines[error.lineNumber - 1];
          const tokenStart = error.columnNumber - 1;
          let tokenEnd = tokenStart;
          
          // Find token boundaries
          while (tokenEnd < line.length && 
                 !/[\s\(\)\[\]\{\}\:\;\,\.\<\>\=\+\-\*\/\&\|\^\!\~\?\@\#\%]/.test(line[tokenEnd])) {
            tokenEnd++;
          }
          
          const newLine = line.substring(0, tokenStart) + fix.fixCode + line.substring(tokenEnd);
          tokenLines[error.lineNumber - 1] = newLine;
          fixedContent = tokenLines.join('\n');
          break;
          
        case 'custom':
          if (fix.originalCode && fileContent.includes(fix.originalCode)) {
            fixedContent = fileContent.replace(fix.originalCode, fix.fixCode);
          } else {
            return res.status(400).json({
              success: false,
              message: 'Cannot apply custom fix: originalCode not found in file'
            });
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported fix scope: ${fix.fixScope}`
          });
      }
      
      // Write the fixed content back to the file
      fs.writeFileSync(error.filePath, fixedContent);
      
      // Add fix history entry
      await tsErrorStorage.addErrorFixHistory({
        errorId: Number(id),
        fixId: Number(fixId),
        originalCode: fileContent,
        fixedCode: fixedContent,
        fixedAt: new Date(),
        fixMethod: 'assisted',
        fixResult: 'success'
      });
      
      // Update error status
      await tsErrorStorage.updateTypescriptError(Number(id), {
        status: 'fixed',
        fixId: Number(fixId),
        resolvedAt: new Date()
      });
      
      return res.json({
        success: true,
        message: `Fix applied to ${error.filePath}`
      });
    } catch (err) {
      console.error('Error applying fix:', err);
      return res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  } catch (error) {
    console.error('Error applying fix:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Apply batch fixes to multiple errors
 * 
 * @route POST /api/typescript-errors/batch-fix
 */
router.post('/batch-fix', async (req, res) => {
  try {
    const { errorIds, options } = req.body;
    
    // Validate required parameters
    if (!errorIds || !Array.isArray(errorIds) || errorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Error IDs are required'
      });
    }
    
    // Create a fix transaction for rollback capability
    const transaction = await tsBatchFixer.createFixTransaction(errorIds);
    
    // Apply batch fixes
    const result = await tsBatchFixer.applyBatchFixes(errorIds, options);
    
    return res.json({
      success: result.success,
      transactionId: transaction.id,
      fixedErrors: result.fixedErrors,
      failedErrors: result.failedErrors,
      errorMessages: result.errorMessages
    });
  } catch (error) {
    console.error('Error applying batch fixes:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Roll back a batch fix transaction
 * 
 * @route POST /api/typescript-errors/rollback-transaction
 */
router.post('/rollback-transaction', async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    // Validate required parameters
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }
    
    // Roll back the transaction
    const result = await tsBatchFixer.rollbackFixTransaction(transactionId);
    
    return res.json({
      success: result.success,
      restoredFiles: result.restoredFiles,
      errorMessage: result.errorMessage
    });
  } catch (error) {
    console.error('Error rolling back transaction:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate missing type definitions
 * 
 * @route POST /api/typescript-errors/generate-missing-types
 */
router.post('/generate-missing-types', async (req, res) => {
  try {
    const { projectRoot, outputPath } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Analyze type hierarchy
    const hierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(projectRoot);
    
    // Get missing types
    const missingTypes = hierarchy.missingTypes;
    
    if (missingTypes.length === 0) {
      return res.json({
        success: true,
        message: 'No missing types found',
        generatedTypes: []
      });
    }
    
    // Generate definitions for missing types
    const generatedTypes: Record<string, string> = {};
    
    for (const typeName of missingTypes.slice(0, 10)) { // Limit to 10 types to avoid excessive API calls
      try {
        // Find usages of the type in the codebase
        const usages: string[] = [];
        
        // Get type coverage report to find missing type usages
        const coverage = await tsTypeAnalyzer.generateTypeCoverageReport(projectRoot);
        
        // Find declarations with this type
        const relatedDeclarations = coverage.missingTypeDeclarations
          .filter(decl => decl.name.includes(typeName))
          .map(decl => `${decl.filePath}:${decl.line}:${decl.column} - ${decl.name}`);
        
        usages.push(...relatedDeclarations);
        
        // Generate type definition
        const typeDefinition = await openAI.generateMissingType(typeName, usages);
        generatedTypes[typeName] = typeDefinition;
      } catch (err) {
        console.error(`Error generating type for ${typeName}:`, err);
        generatedTypes[typeName] = `// Error generating type: ${err instanceof Error ? err.message : String(err)}\n` + 
                                  `export type ${typeName} = any; // Generated as a fallback`;
      }
    }
    
    // Write generated types to a file if outputPath is provided
    if (outputPath) {
      const fullPath = path.isAbsolute(outputPath) 
        ? outputPath 
        : path.join(projectRoot, outputPath);
      
      // Create directory if it doesn't exist
      const outputDir = path.dirname(fullPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Generate the type definitions file
      const typeDefContent = `/**
 * Generated type definitions
 * 
 * This file contains auto-generated type definitions for types
 * that were referenced but not defined in the codebase.
 * 
 * Generated on: ${new Date().toISOString()}
 */

${Object.entries(generatedTypes)
  .map(([typeName, definition]) => definition)
  .join('\n\n')}
`;
      
      fs.writeFileSync(fullPath, typeDefContent);
    }
    
    return res.json({
      success: true,
      message: `Generated ${Object.keys(generatedTypes).length} of ${missingTypes.length} missing types`,
      generatedTypes,
      outputPath: outputPath || undefined
    });
  } catch (error) {
    console.error('Error generating missing types:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;