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
  sessionStore: session.Store;

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
        error_code: error.code?.toString() || '0',
        file_path: error.filePath || error.file || '',
        line_number: error.line || 0,
        column_number: error.column || 0, 
        error_message: error.message || '',
        error_context: error.lineContent || '',
        category: error.category || 'OTHER',
        severity: error.severity || 'MEDIUM',
        status: error.status || 'PENDING',
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

  async updateTypescriptError(id: number, error: any): Promise<any> {
    try {
      // Map the update fields to the actual database schema
      const updateFields: any = {};
      
      if (error.status) updateFields.status = error.status;
      if (error.severity) updateFields.severity = error.severity;
      if (error.category) updateFields.category = error.category;
      if (error.fixId) updateFields.fix_id = error.fixId;
      if (error.resolved_at || (error.status === 'FIXED')) updateFields.resolved_at = new Date();
      
      if (Object.keys(updateFields).length === 0) {
        // Nothing to update
        return await this.getTypescriptErrorById(id);
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

  async getAllTypescriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    filePath?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<any[]> {
    try {
      let query = db.select().from(typeScriptErrors);
      
      if (filters) {
        if (filters.status) {
          query = query.where(eq(typeScriptErrors.status, filters.status));
        }
        if (filters.severity) {
          query = query.where(eq(typeScriptErrors.severity, filters.severity));
        }
        if (filters.category) {
          query = query.where(eq(typeScriptErrors.category, filters.category));
        }
        if (filters.filePath) {
          query = query.where(sql`${typeScriptErrors.file_path} LIKE ${`%${filters.filePath}%`}`);
        }
        if (filters.fromDate) {
          query = query.where(sql`${typeScriptErrors.detected_at} >= ${filters.fromDate}`);
        }
        if (filters.toDate) {
          query = query.where(sql`${typeScriptErrors.detected_at} <= ${filters.toDate}`);
        }
      }
      
      return await query.orderBy(desc(typeScriptErrors.detected_at));
    } catch (error) {
      console.error('Error getting TypeScript errors:', error);
      return [];
    }
  }

  async getTypescriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
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
      const errors = await this.getAllTypescriptErrors({
        fromDate,
        toDate
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
      const fixedCount = errors.filter(error => error.status === 'FIXED').length;
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

  async markErrorAsFixed(id: number, fixId: number, userId: number): Promise<any> {
    try {
      const [updatedError] = await db
        .update(typeScriptErrors)
        .set({
          status: 'FIXED',
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
  
  // Error pattern methods
  async createErrorPattern(pattern: any): Promise<any> {
    try {
      const dbPattern = {
        name: pattern.name || `Pattern ${Date.now()}`,
        description: pattern.description || '',
        regex: pattern.regex || pattern.pattern || null,
        category: pattern.category || 'OTHER',
        severity: pattern.severity || 'MEDIUM',
        auto_fixable: pattern.autoFixable || pattern.hasAutoFix || false,
        created_at: new Date(),
        detection_rules: pattern.detectionRules ? JSON.stringify(pattern.detectionRules) : null,
        created_by: pattern.userId || null
      };
      
      const [newPattern] = await db.insert(errorPatterns).values(dbPattern).returning();
      return newPattern;
    } catch (error) {
      console.error('Error creating error pattern:', error);
      throw error;
    }
  }

  async getErrorPatternById(id: number): Promise<any> {
    try {
      const [pattern] = await db.select().from(errorPatterns).where(eq(errorPatterns.id, id));
      return pattern || null;
    } catch (error) {
      console.error('Error getting error pattern by ID:', error);
      return null;
    }
  }

  async updateErrorPattern(id: number, pattern: any): Promise<any> {
    try {
      const updateFields: any = {};
      
      if (pattern.name) updateFields.name = pattern.name;
      if (pattern.description) updateFields.description = pattern.description;
      if (pattern.regex || pattern.pattern) updateFields.regex = pattern.regex || pattern.pattern;
      if (pattern.category) updateFields.category = pattern.category;
      if (pattern.severity) updateFields.severity = pattern.severity;
      if ('autoFixable' in pattern || 'hasAutoFix' in pattern) {
        updateFields.auto_fixable = pattern.autoFixable || pattern.hasAutoFix;
      }
      if (pattern.detectionRules) {
        updateFields.detection_rules = JSON.stringify(pattern.detectionRules);
      }
      
      updateFields.updated_at = new Date();
      
      if (Object.keys(updateFields).length === 0) {
        // Nothing to update
        return await this.getErrorPatternById(id);
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

  async getAllErrorPatterns(): Promise<any[]> {
    try {
      return await db.select().from(errorPatterns).orderBy(errorPatterns.category);
    } catch (error) {
      console.error('Error getting all error patterns:', error);
      return [];
    }
  }

  async getErrorPatternsByCategory(category: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(errorPatterns)
        .where(eq(errorPatterns.category, category))
        .orderBy(errorPatterns.updated_at);
    } catch (error) {
      console.error('Error getting error patterns by category:', error);
      return [];
    }
  }

  async getAutoFixablePatterns(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(errorPatterns)
        .where(eq(errorPatterns.auto_fixable, true))
        .orderBy(errorPatterns.category);
    } catch (error) {
      console.error('Error getting auto-fixable patterns:', error);
      return [];
    }
  }
  
  // Fix methods
  async createErrorFix(fix: any): Promise<any> {
    try {
      const dbFix = {
        pattern_id: fix.patternId || null,
        fix_title: fix.title || fix.description || 'Fix',
        fix_description: fix.description || '',
        fix_code: fix.code || fix.replacementTemplate || '',
        fix_type: fix.type || fix.method || 'MANUAL',
        fix_priority: fix.priority || 1,
        success_rate: fix.successRate || 0,
        created_at: new Date(),
        created_by: fix.userId || null
      };
      
      const [newFix] = await db.insert(errorFixes).values(dbFix).returning();
      return newFix;
    } catch (error) {
      console.error('Error creating error fix:', error);
      throw error;
    }
  }

  async getErrorFixById(id: number): Promise<any> {
    try {
      const [fix] = await db.select().from(errorFixes).where(eq(errorFixes.id, id));
      return fix || null;
    } catch (error) {
      console.error('Error getting error fix by ID:', error);
      return null;
    }
  }

  async updateErrorFix(id: number, fix: any): Promise<any> {
    try {
      const updateFields: any = {};
      
      if (fix.title) updateFields.fix_title = fix.title;
      if (fix.description) updateFields.fix_description = fix.description;
      if (fix.code || fix.replacementTemplate) updateFields.fix_code = fix.code || fix.replacementTemplate;
      if (fix.type || fix.method) updateFields.fix_type = fix.type || fix.method;
      if (fix.priority) updateFields.fix_priority = fix.priority;
      if (fix.successRate !== undefined) updateFields.success_rate = fix.successRate;
      
      updateFields.updated_at = new Date();
      
      if (Object.keys(updateFields).length === 0) {
        // Nothing to update
        return await this.getErrorFixById(id);
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

  async getAllErrorFixes(): Promise<any[]> {
    try {
      return await db.select().from(errorFixes).orderBy(errorFixes.pattern_id, errorFixes.created_at);
    } catch (error) {
      console.error('Error getting all error fixes:', error);
      return [];
    }
  }

  async getFixesByPatternId(patternId: number): Promise<any[]> {
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
  async createFixHistory(fixHistory: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getFixHistoryByErrorId(errorId: number): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getFixHistoryStats(userId?: number, fromDate?: Date, toDate?: Date): Promise<any> {
    throw new Error("Method not implemented");
  }
  async createProjectAnalysis(analysis: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getProjectAnalysisById(id: number): Promise<any> {
    throw new Error("Method not implemented");
  }
  async updateProjectAnalysis(id: number, analysis: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getAllProjectAnalyses(limit?: number): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getLatestProjectAnalysis(): Promise<any> {
    throw new Error("Method not implemented");
  }
  async createProjectFile(file: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async updateProjectFile(id: number, file: any): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getProjectFileByPath(filePath: string): Promise<any> {
    throw new Error("Method not implemented");
  }
  async getAllProjectFiles(): Promise<any[]> {
    throw new Error("Method not implemented");
  }
  async getProjectFilesWithErrors(): Promise<any[]> {
    throw new Error("Method not implemented");
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
      
      // Create an admin user
      await this.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: await hashPassword('admin123'),
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        bio: 'Administrator account',
        isBanned: false
      });
      
      // Create a regular user
      await this.createUser({
        username: 'user',
        email: 'user@example.com',
        password: await hashPassword('user123'),
        role: 'user',
        firstName: 'Regular',
        lastName: 'User',
        bio: 'Regular user account',
        isBanned: false
      });
      
      console.log('Initial users created successfully.');
    } catch (error) {
      console.error('Error creating initial users:', error);
    }
  }
}

// Export the storage instance
export const storage = new DatabaseStorage();