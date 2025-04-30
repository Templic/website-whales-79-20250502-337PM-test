/**
 * Theme Service
 * 
 * This module provides high-level business logic for the theme system.
 * It interfaces with the repository and implements validation, formatting,
 * and other business rules.
 */

import { themeRepository } from './repository';
import { 
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
  type ThemeTemplate
} from './schema';
import { ThemeMode, ThemeContrast, ThemeMotion } from './ThemeContext';
import { baseTokens } from './tokens';
import { ThemeTokens } from './types';
import { 
  generateTheme,
  lightToDarkTheme,
  darkToLightTheme,
  exportTheme,
  importTheme
} from './themeTransformer';
import { validateThemeStructure } from './validator';
import { analyzeTheme, getThemeRecommendations } from './aiThemeAnalyzer';
import semver from 'semver';

/**
 * Theme Service class provides business logic for working with themes
 */
export class ThemeService {
  private repository = themeRepository;
  
  // Theme operations
  
  /**
   * Create a new theme
   */
  async createTheme(
    data: Omit<InsertTheme, 'updatedAt' | 'createdAt'>,
    tokens: ThemeTokens = baseTokens,
    userId?: number
  ): Promise<Theme> {
    // Validate the theme data
    if (!data.name || data.name.trim() === '') {
      throw new Error('Theme name is required');
    }
    
    // Validate the theme tokens structure
    const validationResult = validateThemeStructure(tokens);
    if (!validationResult.valid) {
      throw new Error(`Invalid theme structure: ${validationResult.errors.join(', ')}`);
    }
    
    // Create the theme
    return this.repository.createTheme(
      {
        ...data,
        userId: userId || data.userId,
      },
      tokens
    );
  }
  
  /**
   * Get a theme by ID with its active version
   */
  async getTheme(id: number): Promise<{ theme: Theme; tokens: ThemeTokens } | undefined> {
    const result = await this.repository.getThemeWithActiveVersion(id);
    
    if (!result) {
      return undefined;
    }
    
    return {
      theme: result.theme,
      tokens: result.tokens,
    };
  }
  
  /**
   * Update a theme
   */
  async updateTheme(
    id: number, 
    data: Partial<Omit<InsertTheme, 'userId'>>
  ): Promise<Theme | undefined> {
    return await this.repository.updateTheme(id, data);
  }
  
  /**
   * Delete a theme
   */
  async deleteTheme(id: number): Promise<boolean> {
    return await this.repository.deleteTheme(id);
  }
  
  /**
   * Archive a theme
   */
  async archiveTheme(id: number): Promise<boolean> {
    return await this.repository.archiveTheme(id);
  }
  
  /**
   * List themes with filtering and pagination
   */
  async listThemes(params: {
    userId?: number;
    isPublic?: boolean;
    includeArchived?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    tags?: string[];
  } = {}): Promise<{ themes: Theme[]; total: number; pages: number }> {
    const { page = 1, pageSize = 20, ...otherParams } = params;
    
    const result = await this.repository.listThemes({
      page,
      pageSize,
      ...otherParams,
    });
    
    return {
      ...result,
      pages: Math.ceil(result.total / pageSize),
    };
  }
  
  // Theme Version operations
  
  /**
   * Create a new version of a theme
   */
  async createThemeVersion(
    themeId: number,
    tokens: ThemeTokens,
    options: {
      version?: string;
      changeNotes?: string;
      autoVersion?: boolean;
    } = {}
  ): Promise<ThemeVersion> {
    const { version, changeNotes, autoVersion = true } = options;
    
    // Validate the theme tokens structure
    const validationResult = validateThemeStructure(tokens);
    if (!validationResult.valid) {
      throw new Error(`Invalid theme structure: ${validationResult.errors.join(', ')}`);
    }
    
    // Get the current theme to check if it exists
    const theme = await this.repository.getThemeById(themeId);
    if (!theme) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    // Get existing versions to determine the next version number
    let versionNumber = version;
    if (!versionNumber && autoVersion) {
      const versions = await this.repository.getThemeVersions(themeId);
      
      if (versions.length > 0) {
        // Find the highest version number
        const latestVersion = versions.reduce((latest, current) => {
          return semver.gt(current.version, latest.version) ? current : latest;
        });
        
        // Increment the patch version
        versionNumber = semver.inc(latestVersion.version, 'patch');
      } else {
        // First version
        versionNumber = '1.0.0';
      }
    }
    
    if (!versionNumber) {
      throw new Error('Version number is required');
    }
    
    // Create the new version
    return await this.repository.createThemeVersion({
      themeId,
      version: versionNumber,
      tokens: tokens as any,
      changeNotes,
    });
  }
  
  /**
   * Get all versions of a theme
   */
  async getThemeVersions(themeId: number): Promise<ThemeVersion[]> {
    return await this.repository.getThemeVersions(themeId);
  }
  
  /**
   * Set a specific version as active
   */
  async setActiveVersion(themeId: number, versionId: number): Promise<boolean> {
    return await this.repository.setActiveVersion(themeId, versionId);
  }
  
  // User Theme Preferences operations
  
  /**
   * Get a user's theme preferences
   */
  async getUserThemePreferences(userId: number): Promise<UserThemePreference | undefined> {
    return await this.repository.getUserThemePreferences(userId);
  }
  
  /**
   * Set a user's theme preferences
   */
  async setUserThemePreferences(
    userId: number,
    preferences: Omit<InsertUserThemePreference, 'userId'>
  ): Promise<UserThemePreference> {
    return await this.repository.setUserThemePreferences({
      userId,
      ...preferences,
    });
  }
  
  /**
   * Get a user's complete theme data
   */
  async getUserCompleteTheme(userId: number): Promise<{
    preferences: UserThemePreference;
    themeTokens: ThemeTokens;
  }> {
    return await this.repository.getUserCompleteTheme(userId);
  }
  
  /**
   * Set a user's selected theme
   */
  async setUserSelectedTheme(userId: number, themeId: number | null): Promise<UserThemePreference> {
    const currentPrefs = await this.repository.getUserThemePreferences(userId);
    
    const newPrefs: InsertUserThemePreference = {
      userId,
      themeId,
      themeMode: currentPrefs?.themeMode || 'light' as ThemeMode,
      themeContrast: currentPrefs?.themeContrast || 'default' as ThemeContrast,
      themeMotion: currentPrefs?.themeMotion || 'normal' as ThemeMotion,
      customSettings: currentPrefs?.customSettings || undefined,
    };
    
    return await this.repository.setUserThemePreferences(newPrefs);
  }
  
  /**
   * Set a user's theme mode
   */
  async setUserThemeMode(userId: number, mode: ThemeMode): Promise<UserThemePreference> {
    const currentPrefs = await this.repository.getUserThemePreferences(userId);
    
    const newPrefs: InsertUserThemePreference = {
      userId,
      themeId: currentPrefs?.themeId || null,
      themeMode: mode,
      themeContrast: currentPrefs?.themeContrast || 'default' as ThemeContrast,
      themeMotion: currentPrefs?.themeMotion || 'normal' as ThemeMotion,
      customSettings: currentPrefs?.customSettings || undefined,
    };
    
    return await this.repository.setUserThemePreferences(newPrefs);
  }
  
  // Sharing operations
  
  /**
   * Share a theme with another user
   */
  async shareThemeWithUser(
    themeId: number,
    sharedBy: number,
    sharedWith: number,
    accessLevel: 'view' | 'edit' | 'admin' = 'view',
    expiresAt?: Date
  ): Promise<SharedTheme> {
    return await this.repository.shareTheme({
      themeId,
      sharedBy,
      sharedWith,
      accessLevel,
      expiresAt,
    });
  }
  
  /**
   * Share a theme via email
   */
  async shareThemeViaEmail(
    themeId: number,
    sharedBy: number,
    email: string,
    accessLevel: 'view' | 'edit' | 'admin' = 'view',
    expiresAt?: Date
  ): Promise<SharedTheme> {
    return await this.repository.shareTheme({
      themeId,
      sharedBy,
      sharedEmail: email,
      accessLevel,
      expiresAt,
    });
  }
  
  /**
   * Get a shared theme by share code
   */
  async getSharedTheme(shareCode: string): Promise<{
    share: SharedTheme;
    theme: Theme;
    tokens: ThemeTokens;
  } | undefined> {
    const result = await this.repository.getSharedThemeByCode(shareCode);
    
    // If shared theme is found, increment view count
    if (result) {
      await this.repository.incrementThemeViews(result.theme.id);
    }
    
    return result;
  }
  
  /**
   * List themes shared with a user
   */
  async listSharedWithUser(userId: number): Promise<SharedTheme[]> {
    return await this.repository.listSharedWithUser(userId);
  }
  
  /**
   * Revoke a shared theme
   */
  async revokeSharedTheme(shareId: number): Promise<boolean> {
    return await this.repository.revokeSharedTheme(shareId);
  }
  
  // Theme analysis operations
  
  /**
   * Analyze a theme
   */
  async analyzeTheme(themeId: number): Promise<any> {
    const themeData = await this.repository.getThemeWithActiveVersion(themeId);
    
    if (!themeData) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    try {
      return await analyzeTheme(themeData.tokens);
    } catch (error) {
      console.error('Error analyzing theme:', error);
      throw new Error('Failed to analyze theme');
    }
  }
  
  /**
   * Get theme recommendations
   */
  async getThemeRecommendations(
    themeId: number,
    focusArea?: 'color' | 'typography' | 'spacing' | 'accessibility' | 'all'
  ): Promise<any> {
    const themeData = await this.repository.getThemeWithActiveVersion(themeId);
    
    if (!themeData) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    try {
      return await getThemeRecommendations(themeData.tokens, focusArea);
    } catch (error) {
      console.error('Error getting theme recommendations:', error);
      throw new Error('Failed to get theme recommendations');
    }
  }
  
  // Theme transformation operations
  
  /**
   * Create a light version from a dark theme
   */
  async createLightVersionFromDark(themeId: number, newName?: string): Promise<Theme> {
    const themeData = await this.repository.getThemeWithActiveVersion(themeId);
    
    if (!themeData) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    const lightTokens = darkToLightTheme(themeData.tokens);
    
    // Create a new theme with the light tokens
    return await this.createTheme(
      {
        name: newName || `${themeData.theme.name} (Light)`,
        description: `Light version of ${themeData.theme.name}`,
        isPublic: themeData.theme.isPublic,
        userId: themeData.theme.userId,
        baseTheme: String(themeId),
        tags: themeData.theme.tags,
      },
      lightTokens
    );
  }
  
  /**
   * Create a dark version from a light theme
   */
  async createDarkVersionFromLight(themeId: number, newName?: string): Promise<Theme> {
    const themeData = await this.repository.getThemeWithActiveVersion(themeId);
    
    if (!themeData) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    const darkTokens = lightToDarkTheme(themeData.tokens);
    
    // Create a new theme with the dark tokens
    return await this.createTheme(
      {
        name: newName || `${themeData.theme.name} (Dark)`,
        description: `Dark version of ${themeData.theme.name}`,
        isPublic: themeData.theme.isPublic,
        userId: themeData.theme.userId,
        baseTheme: String(themeId),
        tags: themeData.theme.tags,
      },
      darkTokens
    );
  }
  
  // Import/Export operations
  
  /**
   * Export a theme to JSON
   */
  async exportTheme(themeId: number): Promise<string> {
    const themeData = await this.repository.getThemeWithActiveVersion(themeId);
    
    if (!themeData) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    // Increment download count
    await this.repository.incrementThemeDownloads(themeId);
    
    return JSON.stringify(
      exportTheme({
        name: themeData.theme.name,
        description: themeData.theme.description || undefined,
        version: themeData.version.version,
        tokens: themeData.tokens,
        tags: themeData.theme.tags || undefined,
      }),
      null,
      2
    );
  }
  
  /**
   * Import a theme from JSON
   */
  async importTheme(
    jsonData: string,
    userId?: number,
    makePublic = false
  ): Promise<Theme> {
    try {
      const importedTheme = importTheme(jsonData);
      
      return await this.createTheme(
        {
          name: importedTheme.name,
          description: importedTheme.description,
          isPublic: makePublic,
          userId,
          tags: importedTheme.tags,
        },
        importedTheme.tokens
      );
    } catch (error) {
      console.error('Error importing theme:', error);
      throw new Error('Failed to import theme: Invalid format');
    }
  }
  
  // Theme statistics and analytics
  
  /**
   * Get theme statistics
   */
  async getThemeStatistics(themeId: number): Promise<any> {
    const [theme, analytics] = await Promise.all([
      this.repository.getThemeById(themeId),
      this.repository.getThemeAnalytics(themeId),
    ]);
    
    if (!theme || !analytics) {
      throw new Error(`Theme with ID ${themeId} not found`);
    }
    
    return {
      name: theme.name,
      views: analytics.views,
      downloads: analytics.downloads,
      favorites: analytics.favorites,
      usageCount: analytics.usageCount,
      totalDownloads: theme.totalDownloads,
      lastUpdated: theme.updatedAt,
      createdAt: theme.createdAt,
    };
  }
  
  // Feedback operations
  
  /**
   * Add feedback for a theme
   */
  async addThemeFeedback(
    themeId: number,
    feedback: Omit<InsertThemeFeedback, 'themeId'>
  ): Promise<ThemeFeedback> {
    return await this.repository.addThemeFeedback({
      themeId,
      ...feedback,
    });
  }
  
  /**
   * Get feedback for a theme
   */
  async getThemeFeedback(
    themeId: number,
    options: {
      isPublic?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ feedback: ThemeFeedback[]; total: number; pages: number }> {
    const { page = 1, pageSize = 10, ...otherOptions } = options;
    
    const result = await this.repository.getThemeFeedback(themeId, {
      ...otherOptions,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    
    return {
      ...result,
      pages: Math.ceil(result.total / pageSize),
    };
  }
  
  // Template operations
  
  /**
   * Get a theme template
   */
  async getTemplate(id: number): Promise<ThemeTemplate | undefined> {
    return await this.repository.getTemplateById(id);
  }
  
  /**
   * List theme templates
   */
  async listTemplates(options: {
    category?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ templates: ThemeTemplate[]; total: number; pages: number }> {
    const { page = 1, pageSize = 20, ...otherOptions } = options;
    
    const result = await this.repository.listTemplates({
      ...otherOptions,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    
    return {
      ...result,
      pages: Math.ceil(result.total / pageSize),
    };
  }
  
  /**
   * Create a theme from a template
   */
  async createThemeFromTemplate(
    templateId: number,
    name: string,
    userId?: number,
    isPublic = false
  ): Promise<Theme> {
    const template = await this.repository.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    return await this.createTheme(
      {
        name,
        description: `Based on ${template.name} template`,
        isPublic,
        userId,
        tags: template.tags,
      },
      template.tokens as unknown as ThemeTokens
    );
  }
}

// Export singleton instance
export const themeService = new ThemeService();