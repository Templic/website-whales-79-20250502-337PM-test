/**
 * Theme Repository
 * 
 * This module provides functions for interacting with the theme database.
 * It abstracts database operations for themes, versions, and preferences.
 */

import { db } from './db';
import { 
  themes, 
  themeVersions, 
  userThemePreferences, 
  sharedThemes,
  themeAnalytics,
  themeFeedback,
  themeTemplates,
  type Theme,
  type InsertTheme,
  type ThemeVersion,
  type InsertThemeVersion,
  type UserThemePreference,
  type InsertUserThemePreference,
  type SharedTheme,
  type InsertSharedTheme,
  type ThemeFeedback,
  type InsertThemeFeedback,
  type ThemeTemplate,
} from './schema';
import { eq, and, desc, asc, gt, lt, like, isNull, inArray } from 'drizzle-orm';
import { baseTokens } from './tokens';
import { ThemeMode, ThemeContrast, ThemeMotion } from './ThemeContext';
import { type ThemeTokens } from './types';

/**
 * Theme Repository class handles all database operations for themes
 */
export class ThemeRepository {
  // Theme operations
  
  /**
   * Create a new theme
   */
  async createTheme(theme: InsertTheme, tokens: ThemeTokens): Promise<Theme> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the theme
      const [newTheme] = await tx
        .insert(themes)
        .values(theme)
        .returning();
      
      // Create initial version
      await tx
        .insert(themeVersions)
        .values({
          themeId: newTheme.id,
          version: '1.0.0',
          tokens: tokens as any,
          isActive: true,
        });
      
      // Create analytics entry
      await tx
        .insert(themeAnalytics)
        .values({
          themeId: newTheme.id,
          views: 0,
          downloads: 0,
          favorites: 0,
          usageCount: 0,
        });
      
      return newTheme;
    });
  }
  
  /**
   * Get a theme by ID
   */
  async getThemeById(id: number): Promise<Theme | undefined> {
    const [theme] = await db
      .select()
      .from(themes)
      .where(eq(themes.id, id));
    
    return theme;
  }
  
  /**
   * Get a theme with its active version
   */
  async getThemeWithActiveVersion(id: number): Promise<{ theme: Theme; version: ThemeVersion; tokens: ThemeTokens } | undefined> {
    const result = await db
      .select({
        theme: themes,
        version: themeVersions,
      })
      .from(themes)
      .innerJoin(themeVersions, and(
        eq(themes.id, themeVersions.themeId),
        eq(themeVersions.isActive, true)
      ))
      .where(eq(themes.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    const { theme, version } = result[0];
    
    // Update view count
    await this.incrementThemeViews(id);
    
    return {
      theme,
      version,
      tokens: version.tokens as unknown as ThemeTokens,
    };
  }
  
  /**
   * Update a theme
   */
  async updateTheme(id: number, themeData: Partial<InsertTheme>): Promise<Theme | undefined> {
    const [updatedTheme] = await db
      .update(themes)
      .set({
        ...themeData,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();
    
    return updatedTheme;
  }
  
  /**
   * Archive a theme
   */
  async archiveTheme(id: number): Promise<boolean> {
    const [updatedTheme] = await db
      .update(themes)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();
    
    return !!updatedTheme;
  }
  
  /**
   * Delete a theme and all associated data
   */
  async deleteTheme(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Delete theme versions
      await tx
        .delete(themeVersions)
        .where(eq(themeVersions.themeId, id));
      
      // Delete theme analytics
      await tx
        .delete(themeAnalytics)
        .where(eq(themeAnalytics.themeId, id));
      
      // Delete theme feedback
      await tx
        .delete(themeFeedback)
        .where(eq(themeFeedback.themeId, id));
      
      // Delete shared theme records
      await tx
        .delete(sharedThemes)
        .where(eq(sharedThemes.themeId, id));
      
      // Finally delete the theme
      const [deletedTheme] = await tx
        .delete(themes)
        .where(eq(themes.id, id))
        .returning();
      
      return !!deletedTheme;
    });
  }
  
  /**
   * List all themes with optional filtering and pagination
   */
  async listThemes({
    userId,
    isPublic = true,
    includeArchived = false,
    page = 1,
    pageSize = 20,
    sortBy = 'updatedAt',
    sortDirection = 'desc',
    search,
    tags,
  }: {
    userId?: number;
    isPublic?: boolean;
    includeArchived?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: keyof Theme;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    tags?: string[];
  } = {}): Promise<{ themes: Theme[]; total: number }> {
    // Build query conditions
    const conditions = [];
    
    if (userId !== undefined) {
      conditions.push(eq(themes.userId, userId));
    }
    
    if (isPublic) {
      conditions.push(eq(themes.isPublic, true));
    }
    
    if (!includeArchived) {
      conditions.push(eq(themes.isArchived, false));
    }
    
    if (search) {
      conditions.push(
        like(themes.name, `%${search}%`)
      );
    }
    
    if (tags && tags.length > 0) {
      // This assumes tags are stored as an array in the database
      // You'll need to adjust based on how your database handles arrays
      conditions.push(
        inArray(themes.tags, tags)
      );
    }
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const totalResult = await db
      .select({ count: db.fn.count() })
      .from(themes)
      .where(and(...conditions));
    
    const total = Number(totalResult[0]?.count || 0);
    
    // Main query with sorting and pagination
    const result = await db
      .select()
      .from(themes)
      .where(and(...conditions))
      .orderBy(sortDirection === 'desc' 
        ? desc(themes[sortBy as keyof typeof themes]) 
        : asc(themes[sortBy as keyof typeof themes]))
      .limit(pageSize)
      .offset(offset);
    
    return {
      themes: result,
      total,
    };
  }
  
  // Theme Version operations
  
  /**
   * Create a new version of a theme
   */
  async createThemeVersion(version: InsertThemeVersion): Promise<ThemeVersion> {
    return await db.transaction(async (tx) => {
      // Set all other versions as inactive
      await tx
        .update(themeVersions)
        .set({ isActive: false })
        .where(eq(themeVersions.themeId, version.themeId));
      
      // Insert new version
      const [newVersion] = await tx
        .insert(themeVersions)
        .values({
          ...version,
          isActive: true,
        })
        .returning();
      
      // Update theme updatedAt
      await tx
        .update(themes)
        .set({ updatedAt: new Date() })
        .where(eq(themes.id, version.themeId));
      
      return newVersion;
    });
  }
  
  /**
   * Get all versions of a theme
   */
  async getThemeVersions(themeId: number): Promise<ThemeVersion[]> {
    return await db
      .select()
      .from(themeVersions)
      .where(eq(themeVersions.themeId, themeId))
      .orderBy(desc(themeVersions.createdAt));
  }
  
  /**
   * Get a specific version of a theme
   */
  async getThemeVersion(themeId: number, versionId: number): Promise<ThemeVersion | undefined> {
    const [version] = await db
      .select()
      .from(themeVersions)
      .where(
        and(
          eq(themeVersions.themeId, themeId),
          eq(themeVersions.id, versionId)
        )
      );
    
    return version;
  }
  
  /**
   * Set a specific version as active
   */
  async setActiveVersion(themeId: number, versionId: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Set all versions as inactive
      await tx
        .update(themeVersions)
        .set({ isActive: false })
        .where(eq(themeVersions.themeId, themeId));
      
      // Set the specified version as active
      const [updatedVersion] = await tx
        .update(themeVersions)
        .set({ isActive: true })
        .where(
          and(
            eq(themeVersions.themeId, themeId),
            eq(themeVersions.id, versionId)
          )
        )
        .returning();
      
      // Update theme updatedAt
      await tx
        .update(themes)
        .set({ updatedAt: new Date() })
        .where(eq(themes.id, themeId));
      
      return !!updatedVersion;
    });
  }
  
  // User Theme Preferences operations
  
  /**
   * Get a user's theme preferences
   */
  async getUserThemePreferences(userId: number): Promise<UserThemePreference | undefined> {
    const [preferences] = await db
      .select()
      .from(userThemePreferences)
      .where(eq(userThemePreferences.userId, userId));
    
    return preferences;
  }
  
  /**
   * Set a user's theme preferences
   */
  async setUserThemePreferences(preferences: InsertUserThemePreference): Promise<UserThemePreference> {
    // Check if preferences already exist
    const existingPrefs = await this.getUserThemePreferences(preferences.userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(userThemePreferences)
        .set({
          ...preferences,
          lastUpdated: new Date(),
        })
        .where(eq(userThemePreferences.userId, preferences.userId))
        .returning();
      
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(userThemePreferences)
        .values({
          ...preferences,
          lastUpdated: new Date(),
        })
        .returning();
      
      return newPrefs;
    }
  }
  
  /**
   * Get a user's complete theme data (preferences + theme tokens)
   */
  async getUserCompleteTheme(userId: number): Promise<{
    preferences: UserThemePreference;
    themeTokens: ThemeTokens;
  }> {
    // Get user preferences
    const userPrefs = await this.getUserThemePreferences(userId);
    
    // If no preferences exist, create default preferences
    if (!userPrefs) {
      const defaultPrefs: InsertUserThemePreference = {
        userId,
        themeMode: 'light' as ThemeMode,
        themeContrast: 'default' as ThemeContrast,
        themeMotion: 'normal' as ThemeMotion,
      };
      
      const newPrefs = await this.setUserThemePreferences(defaultPrefs);
      
      return {
        preferences: newPrefs,
        themeTokens: baseTokens,
      };
    }
    
    // If there's a theme ID, get the theme tokens
    if (userPrefs.themeId) {
      const themeData = await this.getThemeWithActiveVersion(userPrefs.themeId);
      
      if (themeData) {
        return {
          preferences: userPrefs,
          themeTokens: themeData.tokens,
        };
      }
    }
    
    // If no theme or theme not found, return base tokens
    return {
      preferences: userPrefs,
      themeTokens: baseTokens,
    };
  }
  
  // Shared Theme operations
  
  /**
   * Share a theme with another user or via email
   */
  async shareTheme(sharedTheme: InsertSharedTheme): Promise<SharedTheme> {
    const [newShare] = await db
      .insert(sharedThemes)
      .values(sharedTheme)
      .returning();
    
    return newShare;
  }
  
  /**
   * Get a shared theme by share code
   */
  async getSharedThemeByCode(shareCode: string): Promise<{
    share: SharedTheme;
    theme: Theme;
    tokens: ThemeTokens;
  } | undefined> {
    const result = await db
      .select({
        share: sharedThemes,
        theme: themes,
        version: themeVersions,
      })
      .from(sharedThemes)
      .innerJoin(themes, eq(sharedThemes.themeId, themes.id))
      .innerJoin(
        themeVersions,
        and(
          eq(themeVersions.themeId, themes.id),
          eq(themeVersions.isActive, true)
        )
      )
      .where(
        and(
          eq(sharedThemes.shareCode, shareCode),
          eq(sharedThemes.isRevoked, false),
          // Check if share is not expired, or if expires_at is null (never expires)
          or(
            isNull(sharedThemes.expiresAt),
            gt(sharedThemes.expiresAt, new Date())
          )
        )
      )
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    const { share, theme, version } = result[0];
    
    // Update last accessed timestamp
    await db
      .update(sharedThemes)
      .set({ lastAccessed: new Date() })
      .where(eq(sharedThemes.id, share.id));
    
    return {
      share,
      theme,
      tokens: version.tokens as unknown as ThemeTokens,
    };
  }
  
  /**
   * List themes shared with a user
   */
  async listSharedWithUser(userId: number): Promise<SharedTheme[]> {
    return await db
      .select()
      .from(sharedThemes)
      .where(
        and(
          eq(sharedThemes.sharedWith, userId),
          eq(sharedThemes.isRevoked, false),
          or(
            isNull(sharedThemes.expiresAt),
            gt(sharedThemes.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(sharedThemes.createdAt));
  }
  
  /**
   * List themes shared by a user
   */
  async listSharedByUser(userId: number): Promise<SharedTheme[]> {
    return await db
      .select()
      .from(sharedThemes)
      .where(
        and(
          eq(sharedThemes.sharedBy, userId),
          eq(sharedThemes.isRevoked, false)
        )
      )
      .orderBy(desc(sharedThemes.createdAt));
  }
  
  /**
   * Revoke a shared theme
   */
  async revokeSharedTheme(shareId: number): Promise<boolean> {
    const [updatedShare] = await db
      .update(sharedThemes)
      .set({ isRevoked: true })
      .where(eq(sharedThemes.id, shareId))
      .returning();
    
    return !!updatedShare;
  }
  
  // Analytics operations
  
  /**
   * Increment theme view count
   */
  async incrementThemeViews(themeId: number): Promise<void> {
    await db
      .update(themeAnalytics)
      .set({ 
        views: db.raw('views + 1'),
        lastUpdated: new Date(),
      })
      .where(eq(themeAnalytics.themeId, themeId));
  }
  
  /**
   * Increment theme download count
   */
  async incrementThemeDownloads(themeId: number): Promise<void> {
    // Update downloads in analytics table
    await db
      .update(themeAnalytics)
      .set({ 
        downloads: db.raw('downloads + 1'),
        lastUpdated: new Date(),
      })
      .where(eq(themeAnalytics.themeId, themeId));
    
    // Also update total downloads in the theme table
    await db
      .update(themes)
      .set({ 
        totalDownloads: db.raw('total_downloads + 1'),
      })
      .where(eq(themes.id, themeId));
  }
  
  /**
   * Increment theme usage count
   */
  async incrementThemeUsage(themeId: number): Promise<void> {
    await db
      .update(themeAnalytics)
      .set({ 
        usageCount: db.raw('usage_count + 1'),
        lastUpdated: new Date(),
      })
      .where(eq(themeAnalytics.themeId, themeId));
  }
  
  /**
   * Get theme analytics
   */
  async getThemeAnalytics(themeId: number) {
    const [analytics] = await db
      .select()
      .from(themeAnalytics)
      .where(eq(themeAnalytics.themeId, themeId));
    
    return analytics;
  }
  
  // Feedback operations
  
  /**
   * Add feedback for a theme
   */
  async addThemeFeedback(feedback: InsertThemeFeedback): Promise<ThemeFeedback> {
    const [newFeedback] = await db
      .insert(themeFeedback)
      .values(feedback)
      .returning();
    
    return newFeedback;
  }
  
  /**
   * Get feedback for a theme
   */
  async getThemeFeedback(themeId: number, options: {
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ feedback: ThemeFeedback[]; total: number }> {
    const { isPublic = true, limit = 10, offset = 0 } = options;
    
    // Build query conditions
    const conditions = [eq(themeFeedback.themeId, themeId)];
    
    if (isPublic !== undefined) {
      conditions.push(eq(themeFeedback.isPublic, isPublic));
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: db.fn.count() })
      .from(themeFeedback)
      .where(and(...conditions));
    
    const total = Number(totalResult[0]?.count || 0);
    
    // Get feedback
    const feedback = await db
      .select()
      .from(themeFeedback)
      .where(and(...conditions))
      .orderBy(desc(themeFeedback.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { feedback, total };
  }
  
  // Template operations
  
  /**
   * Get a theme template by ID
   */
  async getTemplateById(id: number): Promise<ThemeTemplate | undefined> {
    const [template] = await db
      .select()
      .from(themeTemplates)
      .where(eq(themeTemplates.id, id));
    
    return template;
  }
  
  /**
   * List all templates with optional filtering
   */
  async listTemplates(options: {
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
    tags?: string[];
  } = {}): Promise<{ templates: ThemeTemplate[]; total: number }> {
    const { category, isPublic = true, limit = 20, offset = 0, tags } = options;
    
    // Build query conditions
    const conditions = [];
    
    if (isPublic !== undefined) {
      conditions.push(eq(themeTemplates.isPublic, isPublic));
    }
    
    if (category) {
      conditions.push(eq(themeTemplates.category, category));
    }
    
    if (tags && tags.length > 0) {
      conditions.push(inArray(themeTemplates.tags, tags));
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: db.fn.count() })
      .from(themeTemplates)
      .where(and(...conditions));
    
    const total = Number(totalResult[0]?.count || 0);
    
    // Get templates
    const templates = await db
      .select()
      .from(themeTemplates)
      .where(and(...conditions))
      .orderBy(asc(themeTemplates.name))
      .limit(limit)
      .offset(offset);
    
    return { templates, total };
  }
}

// Export singleton instance
export const themeRepository = new ThemeRepository();