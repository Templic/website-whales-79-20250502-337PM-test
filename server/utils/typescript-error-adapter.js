/**
 * TypeScript Error Database Adapter
 * 
 * This module provides an adapter layer to bridge between the expected typescript error
 * management schema and the actual database schema. It handles the differences between
 * the schema defined in shared/schema-typescript-errors.ts and the existing database tables.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class TypeScriptErrorAdapter {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  /**
   * Creates a new scan in the database
   * 
   * @param {Object} scanData - The scan data
   * @param {boolean} scanData.aiEnabled - Whether AI is enabled for this scan
   * @returns {Promise<Object>} - The created scan
   */
  async createScan({ aiEnabled = false }) {
    const client = await this.pool.connect();
    
    try {
      const scanId = uuidv4();
      const now = new Date();
      
      await client.query(`
        INSERT INTO typescript_scan_results (
          id, status, error_count, fixed_count, ai_enabled, start_time
        ) VALUES (
          $1, 'IN_PROGRESS', 0, 0, $2, $3
        )
      `, [scanId, aiEnabled, now]);
      
      return {
        id: scanId,
        status: 'IN_PROGRESS',
        errorCount: 0,
        fixedCount: 0,
        aiEnabled,
        startTime: now,
        endTime: null,
        summary: null
      };
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves a scan by its ID
   * 
   * @param {string} scanId - The scan ID
   * @returns {Promise<Object|null>} - The scan or null if not found
   */
  async getScan(scanId) {
    const client = await this.pool.connect();
    
    try {
      const { rows } = await client.query(`
        SELECT * FROM typescript_scan_results WHERE id = $1
      `, [scanId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const scan = rows[0];
      
      return {
        id: scan.id,
        status: scan.status,
        errorCount: scan.error_count,
        fixedCount: scan.fixed_count,
        aiEnabled: scan.ai_enabled,
        startTime: scan.start_time,
        endTime: scan.end_time,
        summary: scan.summary
      };
    } finally {
      client.release();
    }
  }

  /**
   * Gets all scans with basic details
   * 
   * @returns {Promise<Array>} - Array of all scans
   */
  async getAllScans() {
    const client = await this.pool.connect();
    
    try {
      const { rows } = await client.query(`
        SELECT * FROM typescript_scan_results ORDER BY start_time DESC
      `);
      
      return rows.map(scan => ({
        id: scan.id,
        status: scan.status,
        errorCount: scan.error_count,
        fixedCount: scan.fixed_count,
        aiEnabled: scan.ai_enabled,
        startTime: scan.start_time,
        endTime: scan.end_time,
        summary: scan.summary
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Updates a scan's status and optional fields
   * 
   * @param {string} scanId - The ID of the scan to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated scan
   */
  async updateScan(scanId, { status, errorCount, fixedCount, endTime, summary }) {
    const client = await this.pool.connect();
    
    try {
      // Build SET clause dynamically based on provided fields
      const updates = [];
      const values = [scanId];
      let paramIndex = 2;
      
      if (status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      
      if (errorCount !== undefined) {
        updates.push(`error_count = $${paramIndex++}`);
        values.push(errorCount);
      }
      
      if (fixedCount !== undefined) {
        updates.push(`fixed_count = $${paramIndex++}`);
        values.push(fixedCount);
      }
      
      if (endTime) {
        updates.push(`end_time = $${paramIndex++}`);
        values.push(endTime);
      }
      
      if (summary) {
        updates.push(`summary = $${paramIndex++}`);
        values.push(summary);
      }
      
      if (updates.length === 0) {
        // Nothing to update
        return this.getScan(scanId);
      }
      
      const query = `
        UPDATE typescript_scan_results
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const { rows } = await client.query(query, values);
      
      if (rows.length === 0) {
        throw new Error(`Scan with ID ${scanId} not found`);
      }
      
      const scan = rows[0];
      
      return {
        id: scan.id,
        status: scan.status,
        errorCount: scan.error_count,
        fixedCount: scan.fixed_count,
        aiEnabled: scan.ai_enabled,
        startTime: scan.start_time,
        endTime: scan.end_time,
        summary: scan.summary
      };
    } finally {
      client.release();
    }
  }

  /**
   * Adds an error to a scan
   * 
   * @param {string} scanId - The scan ID
   * @param {Object} errorData - The error data
   * @returns {Promise<Object>} - The added error with ID
   */
  async addError(scanId, errorData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if scan exists
      const scanCheck = await client.query(`
        SELECT id FROM typescript_scan_results WHERE id = $1
      `, [scanId]);
      
      if (scanCheck.rows.length === 0) {
        throw new Error(`Scan with ID ${scanId} not found`);
      }
      
      // Insert the error
      const { rows: errorRows } = await client.query(`
        INSERT INTO typescript_errors (
          error_code, file_path, line_number, column_number, 
          error_message, error_context, category, severity,
          status, detected_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW()
        ) RETURNING *
      `, [
        errorData.code,
        errorData.file,
        errorData.line,
        errorData.column,
        errorData.message,
        errorData.context || '',
        errorData.category || 'other',
        errorData.severity || 'medium'
      ]);
      
      if (errorRows.length === 0) {
        throw new Error('Error insertion failed');
      }
      
      const errorId = errorRows[0].id;
      
      // Associate error with scan
      await client.query(`
        INSERT INTO typescript_scan_errors (
          scan_id, error_id
        ) VALUES (
          $1, $2
        )
      `, [scanId, errorId]);
      
      // Update scan error count
      await client.query(`
        UPDATE typescript_scan_results
        SET error_count = error_count + 1
        WHERE id = $1
      `, [scanId]);
      
      await client.query('COMMIT');
      
      return {
        id: errorId,
        scanId,
        code: errorRows[0].error_code,
        file: errorRows[0].file_path,
        line: errorRows[0].line_number,
        column: errorRows[0].column_number,
        message: errorRows[0].error_message,
        context: errorRows[0].error_context,
        category: errorRows[0].category,
        severity: errorRows[0].severity,
        status: errorRows[0].status,
        timestamp: errorRows[0].detected_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gets all errors for a scan
   * 
   * @param {string} scanId - The scan ID
   * @returns {Promise<Array>} - Array of errors
   */
  async getErrorsForScan(scanId) {
    const client = await this.pool.connect();
    
    try {
      const { rows } = await client.query(`
        SELECT e.* 
        FROM typescript_errors e
        JOIN typescript_scan_errors se ON e.id = se.error_id
        WHERE se.scan_id = $1
      `, [scanId]);
      
      return rows.map(error => ({
        id: error.id,
        scanId,
        code: error.error_code,
        file: error.file_path,
        line: error.line_number,
        column: error.column_number,
        message: error.error_message,
        context: error.error_context,
        category: error.category,
        severity: error.severity,
        status: error.status,
        timestamp: error.detected_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Adds a fix for an error
   * 
   * @param {number} errorId - The error ID
   * @param {Object} fixData - The fix data
   * @returns {Promise<Object>} - The created fix
   */
  async addFix(errorId, fixData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if error exists
      const errorCheck = await client.query(`
        SELECT id FROM typescript_errors WHERE id = $1
      `, [errorId]);
      
      if (errorCheck.rows.length === 0) {
        throw new Error(`Error with ID ${errorId} not found`);
      }
      
      // Insert into error_analysis
      const analysisData = {
        analysis_type: 'typescript_error',
        confidence_score: fixData.confidence || 50,
        is_ai_generated: fixData.aiGenerated || false,
        suggested_fix: fixData.fixedCode
      };
      
      const { rows: analysisRows } = await client.query(`
        INSERT INTO error_analysis (
          error_id, analysis_type, analysis_data, confidence_score,
          suggested_fix, is_ai_generated, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW()
        ) RETURNING *
      `, [
        errorId,
        analysisData.analysis_type,
        JSON.stringify({ explanation: fixData.explanation || '' }),
        analysisData.confidence_score,
        analysisData.suggested_fix,
        analysisData.is_ai_generated
      ]);
      
      // Insert into error_fix_history
      const fixMethod = fixData.aiGenerated ? 'ai' : 'manual';
      
      const { rows: historyRows } = await client.query(`
        INSERT INTO error_fix_history (
          error_id, fix_method, fix_details, applied_code
        ) VALUES (
          $1, $2, $3, $4
        ) RETURNING *
      `, [
        errorId,
        fixMethod,
        fixData.explanation || '',
        fixData.fixedCode
      ]);
      
      // Update error status
      await client.query(`
        UPDATE typescript_errors
        SET status = 'fixed'
        WHERE id = $1
      `, [errorId]);
      
      // Get scan ID for this error
      const { rows: scanRows } = await client.query(`
        SELECT scan_id FROM typescript_scan_errors WHERE error_id = $1
      `, [errorId]);
      
      if (scanRows.length > 0) {
        // Update scan fixed count
        await client.query(`
          UPDATE typescript_scan_results
          SET fixed_count = fixed_count + 1
          WHERE id = $1
        `, [scanRows[0].scan_id]);
      }
      
      await client.query('COMMIT');
      
      return {
        id: historyRows[0].id,
        errorId: errorId,
        fixMethod: historyRows[0].fix_method,
        explanation: historyRows[0].fix_details,
        fixedCode: historyRows[0].applied_code,
        confidence: analysisRows[0].confidence_score,
        aiGenerated: analysisRows[0].is_ai_generated,
        createdAt: historyRows[0].fixed_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gets fixes for an error
   * 
   * @param {number} errorId - The error ID
   * @returns {Promise<Array>} - Array of fixes
   */
  async getFixesForError(errorId) {
    const client = await this.pool.connect();
    
    try {
      const { rows } = await client.query(`
        SELECT h.*, a.confidence_score, a.is_ai_generated
        FROM error_fix_history h
        LEFT JOIN error_analysis a ON h.error_id = a.error_id
        WHERE h.error_id = $1
        ORDER BY h.fixed_at DESC
      `, [errorId]);
      
      return rows.map(row => ({
        id: row.id,
        errorId: row.error_id,
        fixMethod: row.fix_method,
        explanation: row.fix_details,
        fixedCode: row.applied_code,
        confidence: row.confidence_score,
        aiGenerated: row.is_ai_generated,
        createdAt: row.fixed_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Closes the database connection pool
   */
  async close() {
    await this.pool.end();
  }
}

export default new TypeScriptErrorAdapter();