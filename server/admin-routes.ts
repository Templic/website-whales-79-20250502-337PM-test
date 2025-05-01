/**
 * Admin Utilities API Routes
 * 
 * This file contains routes for admin utilities:
 * 1. Data audit logs
 * 2. Data repair tasks
 * 3. Import/export jobs
 * 4. Batch operations
 * 5. Schema migrations
 * 6. Data auto fixes
 */
import express from 'express';
import { adminStorage } from './DatabaseStorage';

const router = express.Router();

// Import centralized authentication utilities
import { isAdmin, createAuthErrorResponse } from './utils/auth-utils';
import { logSecurityEvent } from './security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from './security/advanced/SecurityFabric';

// ===============================
// Data Audit Log Routes
// ===============================
router.get('/audit-logs', isAdmin, async (req, res) => {
  try {
    const filters: Record<string, any> = {};
    
    // Parse optional query parameters
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.action) filters.action = req.query.action as string;
    if (req.query.tableAffected) filters.tableAffected = req.query.tableAffected as string;
    if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
    if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);
    
    const logs = await adminStorage.getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/audit-logs/:id', isAdmin, async (req, res) => {
  try {
    const log = await adminStorage.getAuditLogById(parseInt(req.params.id));
    
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

router.post('/audit-logs', isAdmin, async (req, res) => {
  try {
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    // Add additional fields
    const auditLog = {
      ...req.body,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    };
    
    const result = await adminStorage.createAuditLog(auditLog);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// ===============================
// Data Repair Task Routes
// ===============================
router.get('/repair-tasks', isAdmin, async (req, res) => {
  try {
    const filters: Record<string, any> = {};
    
    // Parse optional query parameters
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.tableAffected) filters.tableAffected = req.query.tableAffected as string;
    
    const tasks = await adminStorage.getRepairTasks(filters);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching repair tasks:', error);
    res.status(500).json({ error: 'Failed to fetch repair tasks' });
  }
});

router.get('/repair-tasks/:id', isAdmin, async (req, res) => {
  try {
    const task = await adminStorage.getRepairTaskById(parseInt(req.params.id));
    
    if (!task) {
      return res.status(404).json({ error: 'Repair task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching repair task:', error);
    res.status(500).json({ error: 'Failed to fetch repair task' });
  }
});

router.post('/repair-tasks', isAdmin, async (req, res) => {
  try {
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    // Add the current user as creator
    const repairTask = {
      ...req.body,
      createdBy: userId,
      createdAt: new Date()
    };
    
    const result = await adminStorage.createRepairTask(repairTask);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating repair task:', error);
    res.status(500).json({ error: 'Failed to create repair task' });
  }
});

router.put('/repair-tasks/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await adminStorage.updateRepairTask(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating repair task:', error);
    res.status(500).json({ error: 'Failed to update repair task' });
  }
});

router.post('/repair-tasks/:id/assign', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await adminStorage.assignRepairTask(id, userId);
    res.json(result);
  } catch (error) {
    console.error('Error assigning repair task:', error);
    res.status(500).json({ error: 'Failed to assign repair task' });
  }
});

router.post('/repair-tasks/:id/status', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'reverted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await adminStorage.changeRepairTaskStatus(id, status);
    res.json(result);
  } catch (error) {
    console.error('Error changing repair task status:', error);
    res.status(500).json({ error: 'Failed to change repair task status' });
  }
});

// ===============================
// Import/Export Job Routes
// ===============================
router.get('/import-export-jobs', isAdmin, async (req, res) => {
  try {
    const filters: Record<string, any> = {};
    
    // Parse optional query parameters
    if (req.query.jobType) filters.jobType = req.query.jobType as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.tableAffected) filters.tableAffected = req.query.tableAffected as string;
    
    const jobs = await adminStorage.getImportExportJobs(filters);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching import/export jobs:', error);
    res.status(500).json({ error: 'Failed to fetch import/export jobs' });
  }
});

router.get('/import-export-jobs/:id', isAdmin, async (req, res) => {
  try {
    const job = await adminStorage.getImportExportJobById(parseInt(req.params.id));
    
    if (!job) {
      return res.status(404).json({ error: 'Import/export job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching import/export job:', error);
    res.status(500).json({ error: 'Failed to fetch import/export job' });
  }
});

router.post('/import-export-jobs', isAdmin, async (req, res) => {
  try {
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    // Add the current user as creator
    const importExportJob = {
      ...req.body,
      createdBy: userId,
      createdAt: new Date(),
      status: 'pending'
    };
    
    const result = await adminStorage.createImportExportJob(importExportJob);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating import/export job:', error);
    res.status(500).json({ error: 'Failed to create import/export job' });
  }
});

router.put('/import-export-jobs/:id/status', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, recordCount, validationErrors } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await adminStorage.updateImportJobStatus(id, status, recordCount, validationErrors);
    res.json(result);
  } catch (error) {
    console.error('Error updating import/export job status:', error);
    res.status(500).json({ error: 'Failed to update import/export job status' });
  }
});

// ===============================
// Batch Operation Routes
// ===============================
router.get('/batch-operations', isAdmin, async (req, res) => {
  try {
    const filters: Record<string, any> = {};
    
    // Parse optional query parameters
    if (req.query.operationType) filters.operationType = req.query.operationType as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.tableAffected) filters.tableAffected = req.query.tableAffected as string;
    
    const operations = await adminStorage.getBatchOperations(filters);
    res.json(operations);
  } catch (error) {
    console.error('Error fetching batch operations:', error);
    res.status(500).json({ error: 'Failed to fetch batch operations' });
  }
});

router.get('/batch-operations/:id', isAdmin, async (req, res) => {
  try {
    const operation = await adminStorage.getBatchOperationById(parseInt(req.params.id));
    
    if (!operation) {
      return res.status(404).json({ error: 'Batch operation not found' });
    }
    
    res.json(operation);
  } catch (error) {
    console.error('Error fetching batch operation:', error);
    res.status(500).json({ error: 'Failed to fetch batch operation' });
  }
});

router.post('/batch-operations', isAdmin, async (req, res) => {
  try {
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    // Add the current user as creator
    const batchOperation = {
      ...req.body,
      createdBy: userId,
      createdAt: new Date(),
      status: 'pending'
    };
    
    const result = await adminStorage.createBatchOperation(batchOperation);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating batch operation:', error);
    res.status(500).json({ error: 'Failed to create batch operation' });
  }
});

router.put('/batch-operations/:id/status', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'reverted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await adminStorage.changeBatchOperationStatus(id, status);
    res.json(result);
  } catch (error) {
    console.error('Error changing batch operation status:', error);
    res.status(500).json({ error: 'Failed to change batch operation status' });
  }
});

// ===============================
// Schema Migration Routes
// ===============================
router.get('/schema-migrations', isAdmin, async (req, res) => {
  try {
    const filters: Record<string, any> = {};
    
    // Parse optional query parameters
    if (req.query.status) filters.status = req.query.status as string;
    
    const migrations = await adminStorage.getSchemaMigrations(filters);
    res.json(migrations);
  } catch (error) {
    console.error('Error fetching schema migrations:', error);
    res.status(500).json({ error: 'Failed to fetch schema migrations' });
  }
});

router.get('/schema-migrations/:id', isAdmin, async (req, res) => {
  try {
    const migration = await adminStorage.getSchemaMigrationById(parseInt(req.params.id));
    
    if (!migration) {
      return res.status(404).json({ error: 'Schema migration not found' });
    }
    
    res.json(migration);
  } catch (error) {
    console.error('Error fetching schema migration:', error);
    res.status(500).json({ error: 'Failed to fetch schema migration' });
  }
});

router.post('/schema-migrations', isAdmin, async (req, res) => {
  try {
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    // Add the current user as creator
    const schemaMigration = {
      ...req.body,
      createdBy: userId,
      createdAt: new Date(),
      status: 'draft'
    };
    
    const result = await adminStorage.createSchemaMigration(schemaMigration);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating schema migration:', error);
    res.status(500).json({ error: 'Failed to create schema migration' });
  }
});

router.put('/schema-migrations/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await adminStorage.updateSchemaMigration(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating schema migration:', error);
    res.status(500).json({ error: 'Failed to update schema migration' });
  }
});

router.post('/schema-migrations/:id/apply', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    const result = await adminStorage.applySchemaMigration(id, userId);
    res.json(result);
  } catch (error) {
    console.error('Error applying schema migration:', error);
    res.status(500).json({ error: 'Failed to apply schema migration' });
  }
});

// ===============================
// Data Auto Fix Routes
// ===============================
router.get('/auto-fixes', isAdmin, async (req, res) => {
  try {
    const filters: Record<string, any> = {};
    
    // Parse optional query parameters
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    if (req.query.tableAffected) filters.tableAffected = req.query.tableAffected as string;
    
    const autoFixes = await adminStorage.getAutoFixes(filters);
    res.json(autoFixes);
  } catch (error) {
    console.error('Error fetching auto fixes:', error);
    res.status(500).json({ error: 'Failed to fetch auto fixes' });
  }
});

router.get('/auto-fixes/:id', isAdmin, async (req, res) => {
  try {
    const autoFix = await adminStorage.getAutoFixById(parseInt(req.params.id));
    
    if (!autoFix) {
      return res.status(404).json({ error: 'Auto fix not found' });
    }
    
    res.json(autoFix);
  } catch (error) {
    console.error('Error fetching auto fix:', error);
    res.status(500).json({ error: 'Failed to fetch auto fix' });
  }
});

router.post('/auto-fixes', isAdmin, async (req, res) => {
  try {
    // @ts-ignore: User info should be available
    const userId = req.user.id;
    
    // Add the current user as creator
    const autoFix = {
      ...req.body,
      createdBy: userId,
      createdAt: new Date(),
      isActive: true,
      successCount: 0,
      failCount: 0
    };
    
    const result = await adminStorage.createAutoFix(autoFix);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating auto fix:', error);
    res.status(500).json({ error: 'Failed to create auto fix' });
  }
});

router.put('/auto-fixes/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await adminStorage.updateAutoFix(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating auto fix:', error);
    res.status(500).json({ error: 'Failed to update auto fix' });
  }
});

router.put('/auto-fixes/:id/toggle', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: 'isActive is required' });
    }
    
    const result = await adminStorage.toggleAutoFix(id, isActive);
    res.json(result);
  } catch (error) {
    console.error('Error toggling auto fix:', error);
    res.status(500).json({ error: 'Failed to toggle auto fix' });
  }
});

router.post('/auto-fixes/:id/run-result', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { success } = req.body;
    
    if (success === undefined) {
      return res.status(400).json({ error: 'success is required' });
    }
    
    const result = await adminStorage.recordAutoFixRun(id, success);
    res.json(result);
  } catch (error) {
    console.error('Error recording auto fix run:', error);
    res.status(500).json({ error: 'Failed to record auto fix run' });
  }
});

export default router;