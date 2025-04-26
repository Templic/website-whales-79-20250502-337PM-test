import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "../shared/schema";
import { IStorage } from "./storage";
import { ITypeScriptErrorStorage } from "./tsErrorStorage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from "./auth";
import { 
  users, type User, type InsertUser,
  posts, type Post, type InsertPost,
  comments, type Comment, type InsertComment,
  typeScriptErrors, type TypeScriptError, type InsertTypeScriptError,
  errorPatterns, type ErrorPattern, type InsertErrorPattern,
  errorFixes, type ErrorFix, type InsertErrorFix,
  errorAnalysis, type ErrorAnalysis, type InsertErrorAnalysis,
  scanResults, type ScanResult, type InsertScanResult 
} from "../shared/schema";

// Define a minimal session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage, ITypeScriptErrorStorage {
  sessionStore: any; // Fix for express-session Store type
  
  // Alias methods for compatibility with IStorage
  async createTypescriptError(error: InsertTypeScriptError): Promise<TypeScriptError> {
    return await this.createTypeScriptError(error);
  }
  
  async getTypescriptErrorById(id: number): Promise<TypeScriptError | null> {
    return await this.getTypeScriptErrorById(id);
  }
  
  async updateTypescriptError(id: number, error: Partial<InsertTypeScriptError>): Promise<TypeScriptError> {
    return await this.updateTypeScriptError(id, error);
  }
  
  async getAllTypescriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    filePath?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<TypeScriptError[]> {
    // Map the legacy filter names to the new ones
    const mappedFilters: any = {};
    if (filters) {
      mappedFilters.status = filters.status;
      mappedFilters.severity = filters.severity;
      mappedFilters.category = filters.category;
      mappedFilters.file_path = filters.filePath;
      mappedFilters.detected_after = filters.fromDate;
      mappedFilters.detected_before = filters.toDate;
    }
    return await this.getAllTypeScriptErrors(mappedFilters);
  }
  
  async getTypescriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
    fixRate: number;
  }> {
    return await this.getTypeScriptErrorStats(fromDate, toDate);
  }

  constructor() {
    // Initialize session store with PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values({
        ...user,
        id: uuidv4(),
      }).returning();
      return newUser;
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        if (error.constraint?.includes('email')) {
          throw new Error('Email address already exists');
        }
        if (error.constraint?.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  async upsertUser(userData: User): Promise<User> {
    console.log("Upserting user:", userData);
    
    if (userData.id) {
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, userData.id));
        
      if (existingUsers.length > 0) {
        // User exists, update their record
        console.log("Updating existing user:", userData.username);
        const [updatedUser] = await db
          .update(users)
          .set({
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            bio: userData.bio,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date()
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updatedUser;
      } else {
        // No user with this ID, create new user
        console.log("Creating new user:", userData.username);
        
        const [newUser] = await db
          .insert(users)
          .values({
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newUser;
      }
    } else {
      throw new Error("Missing user ID");
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // TypeScript Error Management methods
  // Error tracking methods
  async createTypeScriptError(error: InsertTypeScriptError): Promise<TypeScriptError> {
    try {
      // Map our InsertTypeScriptError to the actual database schema
      const dbError = {
        error_code: (error as any).code?.toString() || '0',
        file_path: (error as any).filePath || (error as any).file || '',
        line_number: (error as any).line || 0,
        column_number: (error as any).column || 0, 
        error_message: (error as any).message || '',
        error_context: (error as any).lineContent || '',
        category: (error as any).category || 'OTHER',
        severity: (error as any).severity || 'MEDIUM',
        status: (error as any).status || 'PENDING',
        detected_at: new Date(),
        first_detected_at: new Date(),
        occurrence_count: 1,
        last_occurrence_at: new Date(),
        metadata: JSON.stringify({
          originalError: error,
          source: 'api'
        })
      };
      
      const [newError] = await db.insert(typeScriptErrors).values(dbError).returning();
      return newError;
    } catch (error) {
      console.error('Error creating TypeScript error:', error);
      throw error;
    }
  }

  async getTypeScriptErrorById(id: number): Promise<TypeScriptError | null> {
    try {
      const [error] = await db.select().from(typeScriptErrors).where(eq(typeScriptErrors.id, id));
      return error || null;
    } catch (error) {
      console.error('Error getting TypeScript error by ID:', error);
      return null;
    }
  }

  async updateTypeScriptError(id: number, error: Partial<InsertTypeScriptError>): Promise<TypeScriptError> {
    try {
      // Map the update fields to the actual database schema
      const updateFields: any = {};
      
      if ((error as any).status) updateFields.status = (error as any).status;
      if ((error as any).severity) updateFields.severity = (error as any).severity;
      if ((error as any).category) updateFields.category = (error as any).category;
      if ((error as any).fixId) updateFields.fix_id = (error as any).fixId;
      if ((error as any).resolved_at || ((error as any).status === 'fixed')) updateFields.resolved_at = new Date();
      
      if (Object.keys(updateFields).length === 0) {
        // Nothing to update
        const error = await this.getTypeScriptErrorById(id);
        if (!error) {
          throw new Error(`TypeScript error with ID ${id} not found`);
        }
        return error;
      }
      
      const [updatedError] = await db
        .update(typeScriptErrors)
        .set(updateFields)
        .where(eq(typeScriptErrors.id, id))
        .returning();
        
      return updatedError;
    } catch (error) {
      console.error('Error updating TypeScript error:', error);
      throw error;
    }
  }

  async getAllTypeScriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    file_path?: string;
    detected_after?: Date;
    detected_before?: Date;
  }): Promise<TypeScriptError[]> {
    try {
      let query = db.select().from(typeScriptErrors);
      
      if (filters) {
        if (filters.status) {
          query = query.where(sql`${typeScriptErrors.status} = ${filters.status}`);
        }
        if (filters.severity) {
          query = query.where(sql`${typeScriptErrors.severity} = ${filters.severity}`);
        }
        if (filters.category) {
          query = query.where(sql`${typeScriptErrors.category} = ${filters.category}`);
        }
        if (filters.file_path) {
          query = query.where(sql`${typeScriptErrors.file_path} LIKE ${`%${filters.file_path}%`}`);
        }
        if (filters.detected_after) {
          query = query.where(sql`${typeScriptErrors.detected_at} >= ${filters.detected_after}`);
        }
        if (filters.detected_before) {
          query = query.where(sql`${typeScriptErrors.detected_at} <= ${filters.detected_before}`);
        }
      }
      
      return await query.orderBy(desc(typeScriptErrors.detected_at));
    } catch (error) {
      console.error('Error getting TypeScript errors:', error);
      return [];
    }
  }

  async getTypeScriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
    fixRate: number;
  }> {
    try {
      // This is a placeholder implementation
      // In a real implementation, we would use SQL aggregation queries
      const errors = await this.getAllTypeScriptErrors({
        detected_after: fromDate,
        detected_before: toDate
      });
      
      const result = {
        totalErrors: errors.length,
        bySeverity: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        topFiles: [] as Array<{ filePath: string; count: number }>,
        fixRate: 0
      };
      
      // Count by severity
      errors.forEach(error => {
        // By severity
        if (!result.bySeverity[error.severity]) {
          result.bySeverity[error.severity] = 0;
        }
        result.bySeverity[error.severity]++;
        
        // By category
        if (!result.byCategory[error.category]) {
          result.byCategory[error.category] = 0;
        }
        result.byCategory[error.category]++;
        
        // By status
        if (!result.byStatus[error.status]) {
          result.byStatus[error.status] = 0;
        }
        result.byStatus[error.status]++;
      });
      
      // Count by file
      const fileCount: Record<string, number> = {};
      errors.forEach(error => {
        if (!fileCount[error.file_path]) {
          fileCount[error.file_path] = 0;
        }
        fileCount[error.file_path]++;
      });
      
      // Convert to array and sort
      result.topFiles = Object.entries(fileCount)
        .map(([filePath, count]) => ({ filePath, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Calculate fix rate
      const fixedCount = errors.filter(error => error.status === 'fixed').length;
      result.fixRate = errors.length > 0 ? fixedCount / errors.length : 0;
      
      return result;
    } catch (error) {
      console.error('Error getting TypeScript error stats:', error);
      return {
        totalErrors: 0,
        bySeverity: {},
        byCategory: {},
        byStatus: {},
        topFiles: [],
        fixRate: 0
      };
    }
  }

  async markErrorAsFixed(id: number, fixId: number, userId: number): Promise<TypeScriptError> {
    try {
      const [updatedError] = await db
        .update(typeScriptErrors)
        .set({
          status: 'fixed',
          resolved_at: new Date(),
          fix_id: fixId,
          user_id: userId
        })
        .where(eq(typeScriptErrors.id, id))
        .returning();
      
      return updatedError;
    } catch (error) {
      console.error('Error marking TypeScript error as fixed:', error);
      throw error;
    }
  }
  
  // Error Analysis methods
  async createErrorAnalysis(analysis: InsertErrorAnalysis): Promise<ErrorAnalysis> {
    try {
      // Create a properly typed object for insertion
      const insertData: typeof analysis = {
        error_id: analysis.error_id,
        analysis_type: analysis.analysis_type || 'general',
        analysis_data: analysis.analysis_data || {},
        created_at: new Date(),
        updated_at: new Date(),
        is_ai_generated: analysis.is_ai_generated || false,
        error_code: analysis.error_code,
        suggested_fixes: analysis.suggested_fixes,
        insights: analysis.insights
      };
      
      // Insert the analysis with proper field values
      const [newAnalysis] = await db.insert(errorAnalysis).values(insertData).returning();
      return newAnalysis;
    } catch (error) {
      console.error('Error creating error analysis:', error);
      throw error;
    }
  }

  async getErrorAnalysisById(id: number): Promise<ErrorAnalysis | null> {
    try {
      const [analysis] = await db.select().from(errorAnalysis).where(eq(errorAnalysis.id, id));
      return analysis || null;
    } catch (error) {
      console.error('Error getting error analysis by ID:', error);
      return null;
    }
  }

  async getAnalysisForError(errorId: number): Promise<ErrorAnalysis | null> {
    try {
      const [analysis] = await db
        .select()
        .from(errorAnalysis)
        .where(eq(errorAnalysis.error_id, errorId))
        .orderBy(desc(errorAnalysis.created_at))
        .limit(1);
      return analysis || null;
    } catch (error) {
      console.error('Error getting analysis for error:', error);
      return null;
    }
  }

  // Scan Result methods
  async createScanResult(result: InsertScanResult): Promise<ScanResult> {
    try {
      // Create a properly typed object for insertion
      const insertData: typeof result = {
        scan_type: result.scan_type || 'full',
        total_errors: result.total_errors || 0,
        critical_errors: result.critical_errors || 0,
        high_errors: result.high_errors || 0,
        medium_errors: result.medium_errors || 0,
        low_errors: result.low_errors || 0,
        duration_ms: result.duration_ms || 0,
        scan_date: result.scan_date || new Date(),
        files_scanned: result.files_scanned || 0,
        scan_metadata: result.scan_metadata || {},
        is_incremental: result.is_incremental || false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Insert the scan result with proper field values
      const [newScanResult] = await db.insert(scanResults).values(insertData).returning();
      return newScanResult;
    } catch (error) {
      console.error('Error creating scan result:', error);
      throw error;
    }
  }

  async getScanResultById(id: number): Promise<ScanResult | null> {
    try {
      const [scanResult] = await db.select().from(scanResults).where(eq(scanResults.id, id));
      return scanResult || null;
    } catch (error) {
      console.error('Error getting scan result by ID:', error);
      return null;
    }
  }

  async getLatestScanResults(limit: number): Promise<ScanResult[]> {
    try {
      return await db
        .select()
        .from(scanResults)
        .orderBy(desc(scanResults.scan_date))
        .limit(limit);
    } catch (error) {
      console.error('Error getting latest scan results:', error);
      return [];
    }
  }

  // Error pattern methods
  async createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
    try {
      // Create a properly typed object for insertion
      const dbPattern: Partial<typeof errorPatterns.$inferInsert> = {
        name: pattern.name || `Pattern ${Date.now()}`,
        description: pattern.description || '',
        regex: pattern.regex || null,
        category: pattern.category || 'OTHER',
        severity: pattern.severity || 'MEDIUM',
        auto_fixable: pattern.auto_fixable || false,
        created_at: new Date(),
        detection_rules: pattern.detection_rules,
        created_by: pattern.created_by || null
      };
      
      const [newPattern] = await db.insert(errorPatterns).values(dbPattern).returning();
      return newPattern;
    } catch (error) {
      console.error('Error creating error pattern:', error);
      throw error;
    }
  }

  async getErrorPatternById(id: number): Promise<ErrorPattern | null> {
    try {
      const [pattern] = await db.select().from(errorPatterns).where(eq(errorPatterns.id, id));
      return pattern || null;
    } catch (error) {
      console.error('Error getting error pattern by ID:', error);
      return null;
    }
  }

  async updateErrorPattern(id: number, pattern: Partial<InsertErrorPattern>): Promise<ErrorPattern> {
    try {
      // Create a properly typed update object
      const updateFields: Partial<typeof errorPatterns.$inferInsert> = {
        updated_at: new Date()
      };
      
      // Map the incoming pattern to the database fields
      if (pattern.name) updateFields.name = pattern.name;
      if (pattern.description) updateFields.description = pattern.description;
      if (pattern.regex) updateFields.regex = pattern.regex;
      if (pattern.category) updateFields.category = pattern.category;
      if (pattern.severity) updateFields.severity = pattern.severity;
      if (pattern.auto_fixable !== undefined) {
        updateFields.auto_fixable = pattern.auto_fixable;
      }
      if (pattern.detection_rules) {
        updateFields.detection_rules = pattern.detection_rules;
      }
      
      if (Object.keys(updateFields).length === 1) {
        // Only updated_at was set, nothing else to update
        return await this.getErrorPatternById(id) as ErrorPattern;
      }
      
      const [updatedPattern] = await db
        .update(errorPatterns)
        .set(updateFields)
        .where(eq(errorPatterns.id, id))
        .returning();
        
      return updatedPattern;
    } catch (error) {
      console.error('Error updating error pattern:', error);
      throw error;
    }
  }

  async getAllErrorPatterns(): Promise<ErrorPattern[]> {
    try {
      return await db.select().from(errorPatterns).orderBy(errorPatterns.category);
    } catch (error) {
      console.error('Error getting all error patterns:', error);
      return [];
    }
  }

  async getErrorPatternsByCategory(category: string): Promise<ErrorPattern[]> {
    try {
      return await db
        .select()
        .from(errorPatterns)
        .where(sql`${errorPatterns.category} = ${category}`)
        .orderBy(errorPatterns.updated_at);
    } catch (error) {
      console.error('Error getting error patterns by category:', error);
      return [];
    }
  }

  async getAutoFixablePatterns(): Promise<ErrorPattern[]> {
    try {
      return await db
        .select()
        .from(errorPatterns)
        .where(sql`${errorPatterns.auto_fixable} = ${true}`)
        .orderBy(errorPatterns.category);
    } catch (error) {
      console.error('Error getting auto-fixable patterns:', error);
      return [];
    }
  }
  
  // Fix methods
  async createErrorFix(fix: InsertErrorFix): Promise<ErrorFix> {
    try {
      // Create a properly typed object for insertion
      const dbFix: Partial<typeof errorFixes.$inferInsert> = {
        pattern_id: fix.pattern_id || null,
        fix_title: fix.fix_title || 'Fix',
        fix_description: fix.fix_description || '',
        fix_code: fix.fix_code || '',
        fix_type: fix.fix_type || 'MANUAL',
        fix_priority: fix.fix_priority || 1,
        success_rate: fix.success_rate || 0,
        created_at: new Date(),
        created_by: fix.created_by || null
      };
      
      const [newFix] = await db.insert(errorFixes).values(dbFix).returning();
      return newFix;
    } catch (error) {
      console.error('Error creating error fix:', error);
      throw error;
    }
  }

  async getErrorFixById(id: number): Promise<ErrorFix | null> {
    try {
      const [fix] = await db.select().from(errorFixes).where(eq(errorFixes.id, id));
      return fix || null;
    } catch (error) {
      console.error('Error getting error fix by ID:', error);
      return null;
    }
  }

  async updateErrorFix(id: number, fix: Partial<InsertErrorFix>): Promise<ErrorFix> {
    try {
      // Create a properly typed update object
      const updateFields: Partial<typeof errorFixes.$inferInsert> = {
        updated_at: new Date()
      };
      
      // Map the incoming fix properties to the database fields
      if (fix.fix_title) updateFields.fix_title = fix.fix_title;
      if (fix.fix_description) updateFields.fix_description = fix.fix_description;
      if (fix.fix_code) updateFields.fix_code = fix.fix_code;
      if (fix.fix_type) updateFields.fix_type = fix.fix_type;
      if (fix.fix_priority) updateFields.fix_priority = fix.fix_priority;
      if (fix.success_rate !== undefined) updateFields.success_rate = fix.success_rate;
      
      if (Object.keys(updateFields).length === 1) {
        // Only updated_at was set, nothing else to update
        return await this.getErrorFixById(id) as ErrorFix;
      }
      
      const [updatedFix] = await db
        .update(errorFixes)
        .set(updateFields)
        .where(eq(errorFixes.id, id))
        .returning();
        
      return updatedFix;
    } catch (error) {
      console.error('Error updating error fix:', error);
      throw error;
    }
  }

  async getAllErrorFixes(): Promise<ErrorFix[]> {
    try {
      return await db.select().from(errorFixes).orderBy(errorFixes.pattern_id, errorFixes.created_at);
    } catch (error) {
      console.error('Error getting all error fixes:', error);
      return [];
    }
  }

  async getFixesByPatternId(patternId: number): Promise<ErrorFix[]> {
    try {
      return await db
        .select()
        .from(errorFixes)
        .where(eq(errorFixes.pattern_id, patternId))
        .orderBy(desc(errorFixes.success_rate), desc(errorFixes.created_at));
    } catch (error) {
      console.error('Error getting fixes by pattern ID:', error);
      return [];
    }
  }

  // The following are placeholder implementations to satisfy the interface
  // We're only focusing on TypeScript Error Management for now
  
  // Subscriber methods
  async createSubscriber(subscriber: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getAllSubscribers(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async findSubscriberByEmail(email: string): Promise<any> {
    throw new Error("Method not implemented");
  }

  // Newsletter methods
  async createNewsletter(newsletter: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getAllNewsletters(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getNewsletterById(id: number): Promise<any> {
    throw new Error("Method not implemented");
  }
  async updateNewsletter(id: number, newsletter: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async sendNewsletter(id: number): Promise<any> {
    throw new Error("Method not implemented");
  }

  // Post methods
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }
  
  async getPosts(): Promise<Post[]> {
    return await db.select()
      .from(posts)
      .where(
        and(
          eq(posts.published, true),
          eq(posts.approved, true)
        )
      )
      .orderBy(desc(posts.createdAt));
  }
  
  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }
  
  async getPostById(id: number): Promise<Post | null> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || null;
  }
  
  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }
  
  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }
  
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db.select()
      .from(comments)
      .where(
        and(
          eq(comments.postId, postId),
          eq(comments.approved, true)
        )
      )
      .orderBy(desc(comments.createdAt));
  }
  
  async approveComment(id: number): Promise<Comment> {
    const [approvedComment] = await db
      .update(comments)
      .set({ 
        approved: true,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning();
    return approvedComment;
  }
  
  async rejectComment(id: number): Promise<Comment> {
    const [rejectedComment] = await db
      .update(comments)
      .set({ 
        approved: false,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning();
    return rejectedComment;
  }

  // Missing methods to satisfy the interface
  async createPasswordResetToken(userId: number): Promise<string> {
    throw new Error("Method not implemented");
  }
  async validatePasswordResetToken(token: string): Promise<User | undefined> {
    throw new Error("Method not implemented");
  }
  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    throw new Error("Method not implemented");
  }
  async approvePost(id: number): Promise<Post> {
    throw new Error("Method not implemented");
  }
  async getUnapprovedPosts(): Promise<Post[]> {
    throw new Error("Method not implemented");
  }
  async getUnapprovedComments(): Promise<Comment[]> {
    throw new Error("Method not implemented");
  }
  async getTracks(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getAllTracks(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getAlbums(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async uploadMusic(params: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async deleteMusic(trackId: number, userId: number, userRole: any): Promise<void> {
    throw new Error("Method not implemented");
  }
  async getAllProducts(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async cleanupExpiredSessions(): Promise<void> {
    throw new Error("Method not implemented");
  }
  async getSessionAnalytics(userId: number): Promise<any> {
    throw new Error("Method not implemented");
  }
  async updateSessionActivity(sessionId: string, data: any): Promise<void> {
    throw new Error("Method not implemented");
  }
  async updateUserRole(userId: number, role: any): Promise<User> {
    throw new Error("Method not implemented");
  }
  async banUser(userId: number): Promise<User> {
    throw new Error("Method not implemented");
  }
  async unbanUser(userId: number): Promise<User> {
    throw new Error("Method not implemented");
  }
  async getSystemSettings(): Promise<any> {
    throw new Error("Method not implemented");
  }
  async updateSystemSettings(settings: any): Promise<void> {
    throw new Error("Method not implemented");
  }
  async getAdminAnalytics(fromDate?: string, toDate?: string): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getUserActivity(userId: number): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getAllContentItems(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getContentItemById(id: number): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getContentItemByKey(key: string): Promise<any> {
    throw new Error("Method not implemented");
  }
  async createContentItem(contentItem: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async updateContentItem(contentItem: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async deleteContentItem(id: number): Promise<void> {
    throw new Error("Method not implemented");
  }
  async getContentHistory(contentId: number): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async createContentVersion(contentId: number, version: any, userId: number, changeDescription?: string): Promise<any> {
    throw new Error("Method not implemented");
  }
  async restoreContentVersion(historyId: number): Promise<any> {
    throw new Error("Method not implemented");
  }
  async recordContentUsage(contentId: number, location: string, path: string): Promise<any> {
    throw new Error("Method not implemented");
  }
  async incrementContentViews(contentId: number): Promise<void> {
    throw new Error("Method not implemented");
  }
  async getContentUsageReport(contentId?: number): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getContentWorkflowHistory(contentId: number): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async updateContentStatus(contentId: number, status: string, userId: number, options?: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async createCategory(category: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getCategories(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async createFixHistory(fixHistory: InsertErrorFixHistory): Promise<ErrorFixHistory> {
    try {
      const [newFixHistory] = await db.insert(errorFixHistory).values(fixHistory).returning();
      return newFixHistory;
    } catch (error) {
      console.error('Error creating fix history:', error);
      throw error;
    }
  }
  
  async getFixHistoryByErrorId(errorId: number): Promise<ErrorFixHistory[]> {
    try {
      return await db
        .select()
        .from(errorFixHistory)
        .where(eq(errorFixHistory.error_id, errorId))
        .orderBy(desc(errorFixHistory.created_at));
    } catch (error) {
      console.error('Error getting fix history by error ID:', error);
      return [];
    }
  }
  
  async getFixHistoryStats(userId?: number, fromDate?: Date, toDate?: Date): Promise<{
    totalFixes: number;
    automaticFixes: number;
    manualFixes: number;
    fixesByDate: { date: string; count: number }[];
    fixesByType: { type: string; count: number }[];
  }> {
    try {
      // Create date filters
      const dateFilters = [];
      if (fromDate) {
        dateFilters.push(gte(errorFixHistory.created_at, fromDate));
      }
      if (toDate) {
        dateFilters.push(lte(errorFixHistory.created_at, toDate));
      }
      
      // Create user filter
      const filters = dateFilters.length > 0 ? [and(...dateFilters)] : [];
      if (userId) {
        filters.push(eq(errorFixHistory.user_id, userId));
      }
      
      // Perform query with filters
      const fixHistory = await db
        .select()
        .from(errorFixHistory)
        .where(filters.length > 0 ? and(...filters) : undefined);
      
      // Calculate stats
      const totalFixes = fixHistory.length;
      const automaticFixes = fixHistory.filter(h => h.fix_method === 'AUTO' || h.fix_method === 'AUTOMATIC').length;
      const manualFixes = totalFixes - automaticFixes;
      
      // Group by date
      const fixesByDateMap = new Map<string, number>();
      // Group by type
      const fixesByTypeMap = new Map<string, number>();
      
      for (const fix of fixHistory) {
        // Format date as YYYY-MM-DD
        const date = fix.created_at.toISOString().split('T')[0];
        fixesByDateMap.set(date, (fixesByDateMap.get(date) || 0) + 1);
        
        const type = fix.fix_method || 'UNKNOWN';
        fixesByTypeMap.set(type, (fixesByTypeMap.get(type) || 0) + 1);
      }
      
      const fixesByDate = Array.from(fixesByDateMap.entries()).map(([date, count]) => ({ date, count }));
      const fixesByType = Array.from(fixesByTypeMap.entries()).map(([type, count]) => ({ type, count }));
      
      return {
        totalFixes,
        automaticFixes,
        manualFixes,
        fixesByDate,
        fixesByType
      };
    } catch (error) {
      console.error('Error getting fix history stats:', error);
      return {
        totalFixes: 0,
        automaticFixes: 0,
        manualFixes: 0,
        fixesByDate: [],
        fixesByType: []
      };
    }
  }
  async createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    try {
      const [newAnalysis] = await db.insert(projectAnalysis).values(analysis).returning();
      return newAnalysis;
    } catch (error) {
      console.error('Error creating project analysis:', error);
      throw error;
    }
  }
  
  async getProjectAnalysisById(id: number): Promise<ProjectAnalysis | null> {
    try {
      const [analysis] = await db
        .select()
        .from(projectAnalysis)
        .where(eq(projectAnalysis.id, id));
      return analysis || null;
    } catch (error) {
      console.error('Error getting project analysis by ID:', error);
      return null;
    }
  }
  
  async updateProjectAnalysis(id: number, analysis: Partial<InsertProjectAnalysis>): Promise<ProjectAnalysis> {
    try {
      // Create a properly typed update object
      const updateFields: Partial<typeof projectAnalysis.$inferInsert> = {
        updated_at: new Date()
      };
      
      // Map the incoming analysis to database fields
      if (analysis.error_count !== undefined) updateFields.error_count = analysis.error_count;
      if (analysis.warning_count !== undefined) updateFields.warning_count = analysis.warning_count;
      if (analysis.files_analyzed !== undefined) updateFields.files_analyzed = analysis.files_analyzed;
      if (analysis.lines_of_code !== undefined) updateFields.lines_of_code = analysis.lines_of_code;
      if (analysis.status !== undefined) updateFields.status = analysis.status;
      if (analysis.summary !== undefined) updateFields.summary = analysis.summary;
      if (analysis.completion_time !== undefined) updateFields.completion_time = analysis.completion_time;
      
      if (Object.keys(updateFields).length === 1) {
        // Only updated_at was set, nothing else to update
        const [analysis] = await db
          .select()
          .from(projectAnalysis)
          .where(eq(projectAnalysis.id, id));
        return analysis;
      }
      
      const [updatedAnalysis] = await db
        .update(projectAnalysis)
        .set(updateFields)
        .where(eq(projectAnalysis.id, id))
        .returning();
        
      return updatedAnalysis;
    } catch (error) {
      console.error('Error updating project analysis:', error);
      throw error;
    }
  }
  
  async getAllProjectAnalyses(limit?: number): Promise<ProjectAnalysis[]> {
    try {
      let query = db.select().from(projectAnalysis).orderBy(desc(projectAnalysis.created_at));
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting all project analyses:', error);
      return [];
    }
  }
  
  async getLatestProjectAnalysis(): Promise<ProjectAnalysis | null> {
    try {
      const [analysis] = await db
        .select()
        .from(projectAnalysis)
        .orderBy(desc(projectAnalysis.created_at))
        .limit(1);
      
      return analysis || null;
    } catch (error) {
      console.error('Error getting latest project analysis:', error);
      return null;
    }
  }
  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    try {
      const [newFile] = await db.insert(projectFiles).values(file).returning();
      return newFile;
    } catch (error) {
      console.error('Error creating project file:', error);
      throw error;
    }
  }
  
  async updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile> {
    try {
      // Create a properly typed update object
      const updateFields: Partial<typeof projectFiles.$inferInsert> = {
        updated_at: new Date()
      };
      
      // Map the incoming file updates to database fields
      if (file.file_path !== undefined) updateFields.file_path = file.file_path;
      if (file.file_name !== undefined) updateFields.file_name = file.file_name;
      if (file.file_size !== undefined) updateFields.file_size = file.file_size;
      if (file.lines_of_code !== undefined) updateFields.lines_of_code = file.lines_of_code; 
      if (file.error_count !== undefined) updateFields.error_count = file.error_count;
      if (file.warning_count !== undefined) updateFields.warning_count = file.warning_count;
      if (file.last_modified !== undefined) updateFields.last_modified = file.last_modified;
      if (file.file_type !== undefined) updateFields.file_type = file.file_type;
      if (file.status !== undefined) updateFields.status = file.status;
      
      if (Object.keys(updateFields).length === 1) {
        // Only updated_at was set, nothing else to update
        const [file] = await db
          .select()
          .from(projectFiles)
          .where(eq(projectFiles.id, id));
        return file;
      }
      
      const [updatedFile] = await db
        .update(projectFiles)
        .set(updateFields)
        .where(eq(projectFiles.id, id))
        .returning();
        
      return updatedFile;
    } catch (error) {
      console.error('Error updating project file:', error);
      throw error;
    }
  }
  
  async getProjectFileByPath(filePath: string): Promise<ProjectFile | null> {
    try {
      const [file] = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.file_path, filePath));
      
      return file || null;
    } catch (error) {
      console.error('Error getting project file by path:', error);
      return null;
    }
  }
  
  async getAllProjectFiles(): Promise<ProjectFile[]> {
    try {
      return await db
        .select()
        .from(projectFiles)
        .orderBy(projectFiles.file_path);
    } catch (error) {
      console.error('Error getting all project files:', error);
      return [];
    }
  }
  
  async getProjectFilesWithErrors(): Promise<ProjectFile[]> {
    try {
      return await db
        .select()
        .from(projectFiles)
        .where(gt(projectFiles.error_count, 0))
        .orderBy(desc(projectFiles.error_count));
    } catch (error) {
      console.error('Error getting project files with errors:', error);
      return [];
    }
  }
  
  // Initialization methods
  private async initializeSampleData(): Promise<void> {
    console.log('Database storage initialized.');
  }

  private async createInitialUsers(): Promise<void> {
    try {
      // Check if we have any users already
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) {
        console.log('Initial users already exist.');
        return;
      }
      
      console.log('Creating initial users...');
      
      // Create an admin user - using direct database approach to handle password
      const adminId = uuidv4();
      await db.insert(users).values({
        id: adminId,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        bio: 'Administrator account',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Store password hash in a separate auth table or process (would normally be part of your auth system)
      // For this example, we're just logging that we would set the password
      console.log('Would set admin password hash in auth table or appropriate storage');
      
      // Create a regular user - using direct database approach
      const userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        firstName: 'Regular',
        lastName: 'User',
        bio: 'Regular user account',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Store password hash in a separate auth table or process
      console.log('Would set user password hash in auth table or appropriate storage');
      
      console.log('Initial users created successfully.');
    } catch (error: any) {
      console.error('Error creating initial users:', error);
    }
  }
}

// Export the storage instance
export const storage = new DatabaseStorage();