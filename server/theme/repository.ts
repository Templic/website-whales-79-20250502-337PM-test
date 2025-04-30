/**
 * Theme Repository
 * 
 * This module provides data access functions for the theme system.
 * It encapsulates all database operations related to themes, theme versions, and user preferences.
 */

import { db } from '../db';
import { eq, and, or, desc, isNull, sql } from 'drizzle-orm';
import { 
  themes, 
  themeVersions, 
  userThemePreferences, 
  sharedThemes,
  themeAnalytics,
  themeFeedback,
  themeTemplates,
  type Theme,
  type ThemeVersion,
  type UserThemePreference,
  type SharedTheme,
  type InsertTheme,
  type InsertThemeVersion,
  type InsertUserThemePreference,
  type InsertSharedTheme,
  type InsertThemeFeedback
} from '@shared/theme/schema';

export class ThemeRepository {
  /**
   * Create a new theme
   */
  async createTheme(data: InsertTheme): Promise<Theme> {
    const [theme] = await db.insert(themes).values(data).returning();
    return theme;
  }

  /**
   * Update an existing theme
   */
  async updateTheme(id: number, data: Partial<InsertTheme>): Promise<Theme | undefined> {
    const [theme] = await db
      .update(themes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();
    
    return theme;
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
   * List all themes
   */
  async listThemes(options: {
    limit?: number;
    offset?: number;
    userId?: number;
    publicOnly?: boolean;
    featured?: boolean;
  } = {}): Promise<Theme[]> {
    const { limit = 50, offset = 0, userId, publicOnly = false, featured = false } = options;
    
    let query = db.select().from(themes);
    
    if (userId) {
      query = query.where(eq(themes.userId, userId));
    }
    
    if (publicOnly) {
      query = query.where(eq(themes.isPublic, true));
    }
    
    if (featured) {
      query = query.where(eq(themes.isFeatured, true));
    }
    
    query = query.limit(limit).offset(offset).orderBy(desc(themes.updatedAt));
    
    return query;
  }

  /**
   * Delete a theme
   */
  async deleteTheme(id: number): Promise<boolean> {
    const [theme] = await db
      .delete(themes)
      .where(eq(themes.id, id))
      .returning({ id: themes.id });
    
    return !!theme;
  }

  /**
   * Create a new theme version
   */
  async createThemeVersion(data: InsertThemeVersion): Promise<ThemeVersion> {
    const [version] = await db.insert(themeVersions).values(data).returning();
    return version;
  }

  /**
   * Get the current active version of a theme
   */
  async getActiveThemeVersion(themeId: number): Promise<ThemeVersion | undefined> {
    const [version] = await db
      .select()
      .from(themeVersions)
      .where(and(
        eq(themeVersions.themeId, themeId),
        eq(themeVersions.isActive, true)
      ));
    
    return version;
  }

  /**
   * List all versions of a theme
   */
  async listThemeVersions(themeId: number): Promise<ThemeVersion[]> {
    return db
      .select()
      .from(themeVersions)
      .where(eq(themeVersions.themeId, themeId))
      .orderBy(desc(themeVersions.createdAt));
  }

  /**
   * Set a theme version as active
   */
  async setThemeVersionActive(versionId: number, themeId: number): Promise<boolean> {
    // First, set all versions for this theme as inactive
    await db
      .update(themeVersions)
      .set({ isActive: false })
      .where(eq(themeVersions.themeId, themeId));
    
    // Then set the specified version as active
    const [version] = await db
      .update(themeVersions)
      .set({ isActive: true })
      .where(eq(themeVersions.id, versionId))
      .returning({ id: themeVersions.id });
    
    return !!version;
  }

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
   * Set user theme preferences
   */
  async setUserThemePreferences(data: InsertUserThemePreference): Promise<UserThemePreference> {
    // Check if user already has preferences
    const existing = await this.getUserThemePreferences(data.userId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(userThemePreferences)
        .set({ ...data, lastUpdated: new Date() })
        .where(eq(userThemePreferences.userId, data.userId))
        .returning();
      
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(userThemePreferences)
        .values(data)
        .returning();
      
      return created;
    }
  }

  /**
   * Share a theme with another user
   */
  async shareTheme(data: InsertSharedTheme): Promise<SharedTheme> {
    const [shared] = await db.insert(sharedThemes).values(data).returning();
    return shared;
  }

  /**
   * Get shared theme by share code
   */
  async getSharedThemeByCode(shareCode: string): Promise<{
    shared: SharedTheme;
    theme: Theme;
    version: ThemeVersion;
  } | undefined> {
    const [result] = await db
      .select({
        shared: sharedThemes,
        theme: themes,
        version: themeVersions
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
          or(
            isNull(sharedThemes.expiresAt),
            sql`${sharedThemes.expiresAt} > NOW()`
          )
        )
      );
    
    return result;
  }

  /**
   * Revoke a shared theme
   */
  async revokeSharedTheme(id: number): Promise<boolean> {
    const [shared] = await db
      .update(sharedThemes)
      .set({ isRevoked: true })
      .where(eq(sharedThemes.id, id))
      .returning({ id: sharedThemes.id });
    
    return !!shared;
  }

  /**
   * Increment theme analytics
   */
  async incrementThemeViews(themeId: number): Promise<void> {
    // Get existing analytics or create if not exists
    const [existing] = await db
      .select()
      .from(themeAnalytics)
      .where(eq(themeAnalytics.themeId, themeId));
    
    if (existing) {
      await db
        .update(themeAnalytics)
        .set({ 
          views: sql`${themeAnalytics.views} + 1`,
          lastUpdated: new Date()
        })
        .where(eq(themeAnalytics.themeId, themeId));
    } else {
      await db
        .insert(themeAnalytics)
        .values({
          themeId,
          views: 1,
          downloads: 0,
          favorites: 0,
          usageCount: 0
        });
    }
  }

  /**
   * Increment theme downloads
   */
  async incrementThemeDownloads(themeId: number): Promise<void> {
    // Update theme table
    await db
      .update(themes)
      .set({ 
        totalDownloads: sql`${themes.totalDownloads} + 1` 
      })
      .where(eq(themes.id, themeId));
    
    // Update analytics
    const [existing] = await db
      .select()
      .from(themeAnalytics)
      .where(eq(themeAnalytics.themeId, themeId));
    
    if (existing) {
      await db
        .update(themeAnalytics)
        .set({ 
          downloads: sql`${themeAnalytics.downloads} + 1`,
          lastUpdated: new Date()
        })
        .where(eq(themeAnalytics.themeId, themeId));
    } else {
      await db
        .insert(themeAnalytics)
        .values({
          themeId,
          views: 0,
          downloads: 1,
          favorites: 0,
          usageCount: 0
        });
    }
  }

  /**
   * Add feedback for a theme
   */
  async addThemeFeedback(data: InsertThemeFeedback): Promise<void> {
    await db.insert(themeFeedback).values(data);
  }

  /**
   * Get theme feedback
   */
  async getThemeFeedback(themeId: number, options: {
    limit?: number;
    offset?: number;
    publicOnly?: boolean;
  } = {}): Promise<any[]> {
    const { limit = 20, offset = 0, publicOnly = true } = options;
    
    let query = db
      .select()
      .from(themeFeedback)
      .where(eq(themeFeedback.themeId, themeId));
    
    if (publicOnly) {
      query = query.where(eq(themeFeedback.isPublic, true));
    }
    
    return query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(themeFeedback.createdAt));
  }

  /**
   * List theme templates
   */
  async listThemeTemplates(options: {
    limit?: number;
    offset?: number;
    category?: string;
  } = {}): Promise<any[]> {
    const { limit = 20, offset = 0, category } = options;
    
    let query = db
      .select()
      .from(themeTemplates)
      .where(eq(themeTemplates.isPublic, true));
    
    if (category) {
      query = query.where(eq(themeTemplates.category, category));
    }
    
    return query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(themeTemplates.createdAt));
  }
}

// Export a singleton instance
export const themeRepository = new ThemeRepository();