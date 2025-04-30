import { db } from './db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  // Admin utility tables
  dataAuditLogs, dataRepairTasks, dataImportExportJobs,
  batchOperations, schemaMigrations, dataAutoFixes,
  
  // Admin utility types
  type DataAuditLog, type InsertDataAuditLog,
  type DataRepairTask, type InsertDataRepairTask,
  type DataImportExportJob, type InsertDataImportExportJob,
  type BatchOperation, type InsertBatchOperation,
  type SchemaMigration, type InsertSchemaMigration,
  type DataAutoFix, type InsertDataAutoFix,
  
  // User table reference
  users
} from '../shared/schema';

export interface IAdminStorage {
  // Data Audit methods
  createAuditLog(log: InsertDataAuditLog): Promise<DataAuditLog>;
  getAuditLogs(filters?: { userId?: string; action?: string; tableAffected?: string; fromDate?: Date; toDate?: Date; }): Promise<DataAuditLog[]>;
  getAuditLogById(id: number): Promise<DataAuditLog | null>;
  getAuditLogsByRecordId(recordId: string, tableAffected?: string): Promise<DataAuditLog[]>;
  getAuditLogsByUserId(userId: string): Promise<DataAuditLog[]>;
  
  // Data Repair methods
  createRepairTask(task: InsertDataRepairTask): Promise<DataRepairTask>;
  getRepairTasks(filters?: { status?: string; tableAffected?: string; }): Promise<DataRepairTask[]>;
  getRepairTaskById(id: number): Promise<DataRepairTask | null>;
  updateRepairTask(id: number, updates: Partial<InsertDataRepairTask>): Promise<DataRepairTask>;
  assignRepairTask(id: number, userId: string): Promise<DataRepairTask>;
  changeRepairTaskStatus(id: number, status: string): Promise<DataRepairTask>;
  
  // Import/Export methods
  createImportExportJob(job: InsertDataImportExportJob): Promise<DataImportExportJob>;
  getImportExportJobs(filters?: { jobType?: string; status?: string; tableAffected?: string; }): Promise<DataImportExportJob[]>;
  getImportExportJobById(id: number): Promise<DataImportExportJob | null>;
  updateImportExportJob(id: number, updates: Partial<InsertDataImportExportJob>): Promise<DataImportExportJob>;
  updateImportJobStatus(id: number, status: string, recordCount?: number, validationErrors?: Record<string, any>): Promise<DataImportExportJob>;
  
  // Batch Operations methods
  createBatchOperation(operation: InsertBatchOperation): Promise<BatchOperation>;
  getBatchOperations(filters?: { operationType?: string; status?: string; tableAffected?: string; }): Promise<BatchOperation[]>;
  getBatchOperationById(id: number): Promise<BatchOperation | null>;
  updateBatchOperation(id: number, updates: Partial<InsertBatchOperation>): Promise<BatchOperation>;
  changeBatchOperationStatus(id: number, status: string): Promise<BatchOperation>;
  
  // Schema Migrations methods
  createSchemaMigration(migration: InsertSchemaMigration): Promise<SchemaMigration>;
  getSchemaMigrations(filters?: { status?: string; }): Promise<SchemaMigration[]>;
  getSchemaMigrationById(id: number): Promise<SchemaMigration | null>;
  getSchemaMigrationByVersion(version: string): Promise<SchemaMigration | null>;
  updateSchemaMigration(id: number, updates: Partial<InsertSchemaMigration>): Promise<SchemaMigration>;
  applySchemaMigration(id: number, userId: string): Promise<SchemaMigration>;
  
  // Data Auto Fixes methods
  createAutoFix(fix: InsertDataAutoFix): Promise<DataAutoFix>;
  getAutoFixes(filters?: { isActive?: boolean; tableAffected?: string; }): Promise<DataAutoFix[]>;
  getAutoFixById(id: number): Promise<DataAutoFix | null>;
  updateAutoFix(id: number, updates: Partial<InsertDataAutoFix>): Promise<DataAutoFix>;
  toggleAutoFix(id: number, isActive: boolean): Promise<DataAutoFix>;
  recordAutoFixRun(id: number, success: boolean): Promise<DataAutoFix>;
}

export class DatabaseStorage implements IAdminStorage {
  // Data Audit methods
  async createAuditLog(log: InsertDataAuditLog): Promise<DataAuditLog> {
    const [result] = await db.insert(dataAuditLogs).values(log).returning();
    return result;
  }

  async getAuditLogs(filters?: { userId?: string; action?: string; tableAffected?: string; fromDate?: Date; toDate?: Date; }): Promise<DataAuditLog[]> {
    let query = db.select().from(dataAuditLogs).orderBy(desc(dataAuditLogs.timestamp));
    
    if (filters) {
      if (filters.userId) {
        query = query.where(eq(dataAuditLogs.userId, filters.userId));
      }
      if (filters.action) {
        query = query.where(eq(dataAuditLogs.action, filters.action));
      }
      if (filters.tableAffected) {
        query = query.where(eq(dataAuditLogs.tableAffected, filters.tableAffected));
      }
      if (filters.fromDate) {
        query = query.where(sql`${dataAuditLogs.timestamp} >= ${filters.fromDate}`);
      }
      if (filters.toDate) {
        query = query.where(sql`${dataAuditLogs.timestamp} <= ${filters.toDate}`);
      }
    }
    
    return await query;
  }

  async getAuditLogById(id: number): Promise<DataAuditLog | null> {
    const [result] = await db.select().from(dataAuditLogs).where(eq(dataAuditLogs.id, id));
    return result || null;
  }

  async getAuditLogsByRecordId(recordId: string, tableAffected?: string): Promise<DataAuditLog[]> {
    let query = db.select().from(dataAuditLogs)
      .where(eq(dataAuditLogs.recordId, recordId))
      .orderBy(desc(dataAuditLogs.timestamp));
      
    if (tableAffected) {
      query = query.where(eq(dataAuditLogs.tableAffected, tableAffected));
    }
    
    return await query;
  }

  async getAuditLogsByUserId(userId: string): Promise<DataAuditLog[]> {
    return await db.select().from(dataAuditLogs)
      .where(eq(dataAuditLogs.userId, userId))
      .orderBy(desc(dataAuditLogs.timestamp));
  }
  
  // Data Repair methods
  async createRepairTask(task: InsertDataRepairTask): Promise<DataRepairTask> {
    const [result] = await db.insert(dataRepairTasks).values(task).returning();
    return result;
  }

  async getRepairTasks(filters?: { status?: string; tableAffected?: string; }): Promise<DataRepairTask[]> {
    let query = db.select().from(dataRepairTasks).orderBy(desc(dataRepairTasks.createdAt));
    
    if (filters) {
      if (filters.status) {
        query = query.where(eq(dataRepairTasks.status, filters.status));
      }
      if (filters.tableAffected) {
        query = query.where(eq(dataRepairTasks.tableAffected, filters.tableAffected));
      }
    }
    
    return await query;
  }

  async getRepairTaskById(id: number): Promise<DataRepairTask | null> {
    const [result] = await db.select().from(dataRepairTasks).where(eq(dataRepairTasks.id, id));
    return result || null;
  }

  async updateRepairTask(id: number, updates: Partial<InsertDataRepairTask>): Promise<DataRepairTask> {
    const now = new Date();
    const [result] = await db.update(dataRepairTasks)
      .set({ ...updates, updatedAt: now })
      .where(eq(dataRepairTasks.id, id))
      .returning();
    return result;
  }

  async assignRepairTask(id: number, userId: string): Promise<DataRepairTask> {
    const now = new Date();
    const [result] = await db.update(dataRepairTasks)
      .set({ 
        assignedTo: userId, 
        status: 'in_progress',
        updatedAt: now 
      })
      .where(eq(dataRepairTasks.id, id))
      .returning();
    return result;
  }

  async changeRepairTaskStatus(id: number, status: string): Promise<DataRepairTask> {
    const now = new Date();
    const updates: any = { status, updatedAt: now };
    
    // If marked as completed, set the completedAt date
    if (status === 'completed') {
      updates.completedAt = now;
    }
    
    const [result] = await db.update(dataRepairTasks)
      .set(updates)
      .where(eq(dataRepairTasks.id, id))
      .returning();
    return result;
  }
  
  // Import/Export methods
  async createImportExportJob(job: InsertDataImportExportJob): Promise<DataImportExportJob> {
    const [result] = await db.insert(dataImportExportJobs).values(job).returning();
    return result;
  }

  async getImportExportJobs(filters?: { jobType?: string; status?: string; tableAffected?: string; }): Promise<DataImportExportJob[]> {
    let query = db.select().from(dataImportExportJobs).orderBy(desc(dataImportExportJobs.createdAt));
    
    if (filters) {
      if (filters.jobType) {
        query = query.where(eq(dataImportExportJobs.jobType, filters.jobType));
      }
      if (filters.status) {
        query = query.where(eq(dataImportExportJobs.status, filters.status));
      }
      if (filters.tableAffected) {
        query = query.where(eq(dataImportExportJobs.tableAffected, filters.tableAffected));
      }
    }
    
    return await query;
  }

  async getImportExportJobById(id: number): Promise<DataImportExportJob | null> {
    const [result] = await db.select().from(dataImportExportJobs).where(eq(dataImportExportJobs.id, id));
    return result || null;
  }

  async updateImportExportJob(id: number, updates: Partial<InsertDataImportExportJob>): Promise<DataImportExportJob> {
    const now = new Date();
    const [result] = await db.update(dataImportExportJobs)
      .set({ ...updates, updatedAt: now })
      .where(eq(dataImportExportJobs.id, id))
      .returning();
    return result;
  }

  async updateImportJobStatus(id: number, status: string, recordCount?: number, validationErrors?: Record<string, any>): Promise<DataImportExportJob> {
    const now = new Date();
    const updates: any = { status, updatedAt: now };
    
    if (recordCount !== undefined) {
      updates.recordCount = recordCount;
    }
    
    if (validationErrors) {
      updates.validationErrors = validationErrors;
    }
    
    // If job is completed, set completedAt
    if (status === 'completed') {
      updates.completedAt = now;
    }
    
    const [result] = await db.update(dataImportExportJobs)
      .set(updates)
      .where(eq(dataImportExportJobs.id, id))
      .returning();
    return result;
  }
  
  // Batch Operations methods
  async createBatchOperation(operation: InsertBatchOperation): Promise<BatchOperation> {
    const [result] = await db.insert(batchOperations).values(operation).returning();
    return result;
  }

  async getBatchOperations(filters?: { operationType?: string; status?: string; tableAffected?: string; }): Promise<BatchOperation[]> {
    let query = db.select().from(batchOperations).orderBy(desc(batchOperations.createdAt));
    
    if (filters) {
      if (filters.operationType) {
        query = query.where(eq(batchOperations.operationType, filters.operationType));
      }
      if (filters.status) {
        query = query.where(eq(batchOperations.status, filters.status));
      }
      if (filters.tableAffected) {
        query = query.where(eq(batchOperations.tableAffected, filters.tableAffected));
      }
    }
    
    return await query;
  }

  async getBatchOperationById(id: number): Promise<BatchOperation | null> {
    const [result] = await db.select().from(batchOperations).where(eq(batchOperations.id, id));
    return result || null;
  }

  async updateBatchOperation(id: number, updates: Partial<InsertBatchOperation>): Promise<BatchOperation> {
    const now = new Date();
    const [result] = await db.update(batchOperations)
      .set({ ...updates, updatedAt: now })
      .where(eq(batchOperations.id, id))
      .returning();
    return result;
  }

  async changeBatchOperationStatus(id: number, status: string): Promise<BatchOperation> {
    const now = new Date();
    const updates: any = { status, updatedAt: now };
    
    // If batch operation is completed, set completedAt
    if (status === 'completed' || status === 'failed' || status === 'reverted') {
      updates.completedAt = now;
    }
    
    const [result] = await db.update(batchOperations)
      .set(updates)
      .where(eq(batchOperations.id, id))
      .returning();
    return result;
  }
  
  // Schema Migrations methods
  async createSchemaMigration(migration: InsertSchemaMigration): Promise<SchemaMigration> {
    const [result] = await db.insert(schemaMigrations).values(migration).returning();
    return result;
  }

  async getSchemaMigrations(filters?: { status?: string; }): Promise<SchemaMigration[]> {
    let query = db.select().from(schemaMigrations).orderBy(desc(schemaMigrations.createdAt));
    
    if (filters && filters.status) {
      query = query.where(eq(schemaMigrations.status, filters.status));
    }
    
    return await query;
  }

  async getSchemaMigrationById(id: number): Promise<SchemaMigration | null> {
    const [result] = await db.select().from(schemaMigrations).where(eq(schemaMigrations.id, id));
    return result || null;
  }

  async getSchemaMigrationByVersion(version: string): Promise<SchemaMigration | null> {
    const [result] = await db.select().from(schemaMigrations).where(eq(schemaMigrations.version, version));
    return result || null;
  }

  async updateSchemaMigration(id: number, updates: Partial<InsertSchemaMigration>): Promise<SchemaMigration> {
    const now = new Date();
    const [result] = await db.update(schemaMigrations)
      .set({ ...updates, updatedAt: now })
      .where(eq(schemaMigrations.id, id))
      .returning();
    return result;
  }

  async applySchemaMigration(id: number, userId: string): Promise<SchemaMigration> {
    const now = new Date();
    const [result] = await db.update(schemaMigrations)
      .set({ 
        status: 'applied', 
        appliedAt: now, 
        appliedBy: userId,
        updatedAt: now 
      })
      .where(eq(schemaMigrations.id, id))
      .returning();
    return result;
  }
  
  // Data Auto Fixes methods
  async createAutoFix(fix: InsertDataAutoFix): Promise<DataAutoFix> {
    const [result] = await db.insert(dataAutoFixes).values(fix).returning();
    return result;
  }

  async getAutoFixes(filters?: { isActive?: boolean; tableAffected?: string; }): Promise<DataAutoFix[]> {
    let query = db.select().from(dataAutoFixes).orderBy(desc(dataAutoFixes.createdAt));
    
    if (filters) {
      if (filters.isActive !== undefined) {
        query = query.where(eq(dataAutoFixes.isActive, filters.isActive));
      }
      if (filters.tableAffected) {
        query = query.where(eq(dataAutoFixes.tableAffected, filters.tableAffected));
      }
    }
    
    return await query;
  }

  async getAutoFixById(id: number): Promise<DataAutoFix | null> {
    const [result] = await db.select().from(dataAutoFixes).where(eq(dataAutoFixes.id, id));
    return result || null;
  }

  async updateAutoFix(id: number, updates: Partial<InsertDataAutoFix>): Promise<DataAutoFix> {
    const now = new Date();
    const [result] = await db.update(dataAutoFixes)
      .set({ ...updates, updatedAt: now })
      .where(eq(dataAutoFixes.id, id))
      .returning();
    return result;
  }

  async toggleAutoFix(id: number, isActive: boolean): Promise<DataAutoFix> {
    const now = new Date();
    const [result] = await db.update(dataAutoFixes)
      .set({ isActive, updatedAt: now })
      .where(eq(dataAutoFixes.id, id))
      .returning();
    return result;
  }

  async recordAutoFixRun(id: number, success: boolean): Promise<DataAutoFix> {
    const now = new Date();
    const updates: Record<string, any> = { 
      lastRun: now,
      updatedAt: now 
    };
    
    if (success) {
      updates.successCount = sql`${dataAutoFixes.successCount} + 1`;
    } else {
      updates.failCount = sql`${dataAutoFixes.failCount} + 1`;
    }
    
    const [result] = await db.update(dataAutoFixes)
      .set(updates)
      .where(eq(dataAutoFixes.id, id))
      .returning();
    return result;
  }
}

// Export the storage instance
export const adminStorage = new DatabaseStorage();