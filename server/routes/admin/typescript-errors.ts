import { Router } from 'express';
import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as child_process from 'child_process';
import { validateRequest } from '../../middleware/validateRequest';
import { requireAdmin } from '../../middleware/auth';
import { db } from '../../db';
import { securityEvents } from '../../security/securityEvents';
import { securityAudit } from '../../security/securityAudit';

const router = Router();

// Database tables for TypeScript errors
const TYPESCRIPT_SCANS_TABLE = 'typescript_scans';
const TYPESCRIPT_ERRORS_TABLE = 'typescript_errors';

// Schema for starting a new scan
const startScanSchema = z.object({
  aiEnabled: z.boolean().default(false),
});

// Schema for error status update
const updateErrorStatusSchema = z.object({
  status: z.enum(['NEW', 'FIXING', 'FIXED', 'IGNORED']),
});

// Set up middleware
router.use(requireAdmin);

/**
 * Get all TypeScript error scans
 */
router.get('/scans', async (req, res) => {
  try {
    // Query all scans with count of errors
    const scans = await db.query(`
      SELECT 
        s.id, 
        s.start_time AS "startTime", 
        s.end_time AS "endTime", 
        s.status, 
        s.ai_enabled AS "aiEnabled", 
        s.summary,
        COUNT(e.id) AS "errorCount",
        SUM(CASE WHEN e.status = 'FIXED' THEN 1 ELSE 0 END) AS "fixedCount"
      FROM ${TYPESCRIPT_SCANS_TABLE} s
      LEFT JOIN ${TYPESCRIPT_ERRORS_TABLE} e ON s.id = e.scan_id
      GROUP BY s.id
      ORDER BY s.start_time DESC
      LIMIT 20
    `);
    
    // Audit the action
    securityAudit.log({
      action: 'TYPESCRIPT_SCAN_LIST_VIEW',
      actor: req.user?.id || 'unknown',
      target: 'typescript_scans',
      details: { count: scans.length },
    });
    
    return res.json(scans);
  } catch (error: any) {
    console.error('Error fetching TypeScript scans:', error.message);
    return res.status(500).json({ error: 'Failed to fetch TypeScript error scans' });
  }
});

/**
 * Get details of a specific scan
 */
router.get('/scans/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    // Get scan details
    const scan = await db.queryOne(`
      SELECT 
        s.id, 
        s.start_time AS "startTime", 
        s.end_time AS "endTime", 
        s.status, 
        s.ai_enabled AS "aiEnabled", 
        s.summary
      FROM ${TYPESCRIPT_SCANS_TABLE} s
      WHERE s.id = $1
    `, [scanId]);
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    // Get associated errors
    const errors = await db.query(`
      SELECT 
        e.id, 
        e.code, 
        e.message, 
        e.file, 
        e.line, 
        e.column, 
        e.severity, 
        e.category, 
        e.status,
        e.created_at AS "timestamp",
        e.fix_details AS "fixDetails"
      FROM ${TYPESCRIPT_ERRORS_TABLE} e
      WHERE e.scan_id = $1
      ORDER BY 
        CASE 
          WHEN e.severity = 'CRITICAL' THEN 1
          WHEN e.severity = 'HIGH' THEN 2
          WHEN e.severity = 'MEDIUM' THEN 3
          WHEN e.severity = 'LOW' THEN 4
          ELSE 5
        END,
        e.created_at DESC
    `, [scanId]);
    
    // Count all errors and fixed errors
    const errorCount = errors.length;
    const fixedCount = errors.filter(e => e.status === 'FIXED').length;
    
    // Audit the action
    securityAudit.log({
      action: 'TYPESCRIPT_SCAN_VIEW',
      actor: req.user?.id || 'unknown',
      target: 'typescript_scans',
      details: { scanId, errorCount },
    });
    
    return res.json({
      ...scan,
      errorCount,
      fixedCount,
      errors
    });
  } catch (error: any) {
    console.error('Error fetching scan details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch scan details' });
  }
});

/**
 * Start a new TypeScript error scan
 */
router.post('/scans', validateRequest(startScanSchema), async (req, res) => {
  try {
    const { aiEnabled } = req.body;
    const scanId = uuidv4();
    const startTime = new Date();
    
    // Create new scan record
    await db.execute(`
      INSERT INTO ${TYPESCRIPT_SCANS_TABLE} (
        id, 
        start_time, 
        status, 
        ai_enabled, 
        summary
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      scanId,
      startTime.toISOString(),
      'IN_PROGRESS',
      aiEnabled,
      'TypeScript error scan initiated'
    ]);
    
    // Log security event
    securityEvents.log({
      type: 'TYPESCRIPT_SCAN_STARTED',
      severity: 'INFO',
      message: `TypeScript error scan started${aiEnabled ? ' with AI' : ''}`,
      metadata: {
        scanId,
        aiEnabled,
        initiatedBy: req.user?.id || 'unknown'
      }
    });
    
    // Start scan process in background
    const scanProcess = child_process.spawn('node', [
      path.join(process.cwd(), aiEnabled ? 'fix-typescript-errors.ts' : 'run-enhanced-fixer.ts'),
      scanId
    ], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        SCAN_ID: scanId,
        AI_ENABLED: String(aiEnabled)
      }
    });
    
    // Let the process run independently
    scanProcess.unref();
    
    // Audit the action
    securityAudit.log({
      action: 'TYPESCRIPT_SCAN_STARTED',
      actor: req.user?.id || 'unknown',
      target: 'typescript_scans',
      details: { scanId, aiEnabled },
    });
    
    return res.status(201).json({
      id: scanId,
      startTime: startTime.toISOString(),
      status: 'IN_PROGRESS',
      aiEnabled,
      message: `TypeScript error scan initiated${aiEnabled ? ' with AI' : ''}`
    });
  } catch (error: any) {
    console.error('Error starting TypeScript scan:', error.message);
    return res.status(500).json({ error: 'Failed to start TypeScript error scan' });
  }
});

/**
 * Apply a suggested fix to an error
 */
router.post('/scans/:scanId/errors/:errorId/fix', async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get error details
    const error = await db.queryOne(`
      SELECT 
        e.id, 
        e.file, 
        e.line, 
        e.fix_details->'suggestion' AS "suggestion",
        e.status
      FROM ${TYPESCRIPT_ERRORS_TABLE} e
      WHERE e.id = $1 AND e.scan_id = $2
    `, [errorId, scanId]);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    if (error.status === 'FIXED') {
      return res.status(400).json({ error: 'Error is already fixed' });
    }
    
    if (!error.suggestion) {
      return res.status(400).json({ error: 'No fix suggestion available for this error' });
    }
    
    // Apply the fix to the file
    const filePath = error.file;
    const lineNumber = error.line;
    const fixedCode = error.suggestion;
    
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Source file not found' });
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      
      // Replace the line with the fixed code
      lines[lineNumber - 1] = fixedCode;
      
      // Write back to file
      fs.writeFileSync(filePath, lines.join('\n'));
      
      // Update error status
      await db.execute(`
        UPDATE ${TYPESCRIPT_ERRORS_TABLE}
        SET 
          status = 'FIXED',
          fix_details = jsonb_set(
            fix_details::jsonb,
            '{appliedAt}',
            to_jsonb($1::text)
          )
        WHERE id = $2
      `, [new Date().toISOString(), errorId]);
      
      // Log security event
      securityEvents.log({
        type: 'TYPESCRIPT_ERROR_FIXED',
        severity: 'INFO',
        message: `TypeScript error fixed: ${filePath}:${lineNumber}`,
        metadata: {
          scanId,
          errorId,
          file: filePath,
          line: lineNumber,
          appliedBy: req.user?.id || 'unknown'
        }
      });
      
      // Audit the action
      securityAudit.log({
        action: 'TYPESCRIPT_ERROR_FIXED',
        actor: req.user?.id || 'unknown',
        target: 'typescript_errors',
        details: { errorId, scanId, file: filePath, line: lineNumber },
      });
      
      return res.json({
        success: true,
        message: 'Fix applied successfully',
        errorId
      });
      
    } catch (fileError: any) {
      console.error('Error applying fix to file:', fileError.message);
      return res.status(500).json({ error: `Failed to apply fix: ${fileError.message}` });
    }
    
  } catch (error: any) {
    console.error('Error applying fix:', error.message);
    return res.status(500).json({ error: 'Failed to apply fix' });
  }
});

/**
 * Ignore an error
 */
router.post('/scans/:scanId/errors/:errorId/ignore', async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get error details to check if it exists
    const error = await db.queryOne(`
      SELECT id, status
      FROM ${TYPESCRIPT_ERRORS_TABLE}
      WHERE id = $1 AND scan_id = $2
    `, [errorId, scanId]);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    if (error.status === 'IGNORED') {
      return res.status(400).json({ error: 'Error is already ignored' });
    }
    
    // Update error status
    await db.execute(`
      UPDATE ${TYPESCRIPT_ERRORS_TABLE}
      SET status = 'IGNORED'
      WHERE id = $1
    `, [errorId]);
    
    // Log security event
    securityEvents.log({
      type: 'TYPESCRIPT_ERROR_IGNORED',
      severity: 'INFO',
      message: `TypeScript error ignored`,
      metadata: {
        scanId,
        errorId,
        ignoredBy: req.user?.id || 'unknown'
      }
    });
    
    // Audit the action
    securityAudit.log({
      action: 'TYPESCRIPT_ERROR_IGNORED',
      actor: req.user?.id || 'unknown',
      target: 'typescript_errors',
      details: { errorId, scanId },
    });
    
    return res.json({
      success: true,
      message: 'Error marked as ignored',
      errorId
    });
    
  } catch (error: any) {
    console.error('Error ignoring TypeScript error:', error.message);
    return res.status(500).json({ error: 'Failed to ignore error' });
  }
});

/**
 * Generate an AI fix for an error
 */
router.post('/scans/:scanId/errors/:errorId/ai-fix', async (req, res) => {
  try {
    const { scanId, errorId } = req.params;
    
    // Get error details
    const error = await db.queryOne(`
      SELECT 
        e.id, 
        e.code, 
        e.message, 
        e.file, 
        e.line, 
        e.column, 
        e.severity, 
        e.category,
        e.status
      FROM ${TYPESCRIPT_ERRORS_TABLE} e
      WHERE e.id = $1 AND e.scan_id = $2
    `, [errorId, scanId]);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    if (error.status !== 'NEW' && error.status !== 'FIXING') {
      return res.status(400).json({ 
        error: `Cannot generate AI fix for an error with status: ${error.status}` 
      });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    // Start the AI fix generation process
    // This will be handled asynchronously
    const fixProcess = child_process.spawn('node', [
      path.join(process.cwd(), 'generate-single-fix.ts')
    ], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        ERROR_ID: errorId,
        SCAN_ID: scanId,
        FILE_PATH: error.file,
        ERROR_LINE: String(error.line),
        ERROR_COLUMN: String(error.column),
        ERROR_CODE: error.code,
        ERROR_MESSAGE: error.message
      }
    });
    
    // Let the process run independently
    fixProcess.unref();
    
    // Update error status to FIXING
    await db.execute(`
      UPDATE ${TYPESCRIPT_ERRORS_TABLE}
      SET status = 'FIXING'
      WHERE id = $1
    `, [errorId]);
    
    // Log security event
    securityEvents.log({
      type: 'TYPESCRIPT_AI_FIX_REQUESTED',
      severity: 'INFO',
      message: `AI fix requested for TypeScript error`,
      metadata: {
        scanId,
        errorId,
        requestedBy: req.user?.id || 'unknown'
      }
    });
    
    // Audit the action
    securityAudit.log({
      action: 'TYPESCRIPT_AI_FIX_REQUESTED',
      actor: req.user?.id || 'unknown',
      target: 'typescript_errors',
      details: { errorId, scanId, file: error.file },
    });
    
    return res.json({
      success: true,
      message: 'AI fix generation initiated',
      errorId
    });
    
  } catch (error: any) {
    console.error('Error generating AI fix:', error.message);
    return res.status(500).json({ error: 'Failed to generate AI fix' });
  }
});

export default router;