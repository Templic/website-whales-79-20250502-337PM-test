/**
 * Theme Service
 * 
 * This module provides business logic services for the theme system.
 * It handles operations that require coordination between multiple repositories
 * or complex business rules.
 */

import { themeRepository } from './repository';
import type { 
  Theme,
  ThemeVersion,
  InsertTheme,
  InsertThemeVersion
} from '@shared/theme/schema';
import { ThemeTokens } from '@shared/theme/tokens';

export class ThemeService {
  /**
   * Create a new theme with an initial version
   */
  async createThemeWithVersion(
    themeData: InsertTheme,
    versionData: Omit<InsertThemeVersion, 'themeId'>
  ): Promise<{ theme: Theme; version: ThemeVersion }> {
    // Create the theme
    const theme = await themeRepository.createTheme(themeData);
    
    // Create the initial version
    const version = await themeRepository.createThemeVersion({
      ...versionData,
      themeId: theme.id,
      version: '1.0.0', // Initial version
      isActive: true
    });
    
    return { theme, version };
  }
  
  /**
   * Clone a theme (create a copy with a new name)
   */
  async cloneTheme(themeId: number, newName: string, userId?: number): Promise<{ theme: Theme; version: ThemeVersion } | null> {
    // Get the original theme
    const originalTheme = await themeRepository.getThemeById(themeId);
    if (!originalTheme) {
      return null;
    }
    
    // Get the active version of the original theme
    const originalVersion = await themeRepository.getActiveThemeVersion(themeId);
    if (!originalVersion) {
      return null;
    }
    
    // Create a new theme based on the original
    const newTheme = await themeRepository.createTheme({
      name: newName,
      description: `Clone of ${originalTheme.name}`,
      isPublic: false,
      userId: userId || originalTheme.userId,
      baseTheme: originalTheme.id.toString(),
      tags: originalTheme.tags
    });
    
    // Create a new version based on the original
    const newVersion = await themeRepository.createThemeVersion({
      themeId: newTheme.id,
      version: '1.0.0',
      tokens: originalVersion.tokens,
      changeNotes: `Cloned from ${originalTheme.name} v${originalVersion.version}`,
      isActive: true
    });
    
    return { theme: newTheme, version: newVersion };
  }
  
  /**
   * Create a new version of a theme
   */
  async createNewThemeVersion(
    themeId: number,
    tokens: ThemeTokens,
    versionNumber: string,
    changeNotes?: string,
    setActive: boolean = true
  ): Promise<ThemeVersion | null> {
    // Get the theme to make sure it exists
    const theme = await themeRepository.getThemeById(themeId);
    if (!theme) {
      return null;
    }
    
    // Create the new version
    const version = await themeRepository.createThemeVersion({
      themeId,
      version: versionNumber,
      tokens,
      changeNotes,
      isActive: false
    });
    
    // Set as active if requested
    if (setActive) {
      await themeRepository.setThemeVersionActive(version.id, themeId);
    }
    
    return version;
  }
  
  /**
   * Search for themes by name or tags
   */
  async searchThemes(query: string, options: {
    limit?: number;
    offset?: number;
    userId?: number;
    publicOnly?: boolean;
  } = {}): Promise<Theme[]> {
    // Get all themes first (we'll filter them in memory for now)
    // In a real app, this would use a database query with proper indexing
    const allThemes = await themeRepository.listThemes({
      ...options,
      limit: options.limit || 100, // Higher limit for search
    });
    
    // Filter themes by the search query
    const normalizedQuery = query.toLowerCase();
    const filteredThemes = allThemes.filter(theme => {
      // Match on name
      if (theme.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Match on description
      if (theme.description?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Match on tags
      if (theme.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
        return true;
      }
      
      return false;
    });
    
    // Apply limit and offset
    return filteredThemes.slice(
      options.offset || 0,
      (options.offset || 0) + (options.limit || filteredThemes.length)
    );
  }
  
  /**
   * Get recommended themes for a user based on their preferences and history
   */
  async getRecommendedThemes(userId: number, limit: number = 5): Promise<Theme[]> {
    // This is a simplified implementation
    // In a real app, this would use more sophisticated recommendation algorithms
    
    // Get user preferences
    const preferences = await themeRepository.getUserThemePreferences(userId);
    
    // Get featured themes as a fallback
    const featuredThemes = await themeRepository.listThemes({
      featured: true,
      limit,
      publicOnly: true
    });
    
    // If we have user preferences and they have a preferred theme
    if (preferences?.themeId) {
      // Try to find similar themes to the user's preferred theme
      const preferredTheme = await themeRepository.getThemeById(preferences.themeId);
      
      if (preferredTheme?.tags?.length) {
        // Find themes with similar tags
        const allThemes = await themeRepository.listThemes({
          publicOnly: true,
          limit: 20 // Get more themes to filter from
        });
        
        // Filter themes that have at least one tag in common
        const similarThemes = allThemes.filter(theme => 
          theme.id !== preferences.themeId && // Don't include the current theme
          theme.tags?.some(tag => preferredTheme.tags.includes(tag))
        );
        
        // If we found any similar themes, return those
        if (similarThemes.length > 0) {
          return similarThemes.slice(0, limit);
        }
      }
    }
    
    // Fallback to featured themes
    return featuredThemes;
  }
  
  /**
   * Delete a theme and all related data
   */
  async deleteThemeCompletely(themeId: number): Promise<boolean> {
    // In a real implementation, this would be done with a transaction
    // and possibly cascade delete in the database
    
    try {
      // Delete the theme (should cascade to other tables)
      const success = await themeRepository.deleteTheme(themeId);
      return success;
    } catch (error) {
      console.error('Error completely deleting theme:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const themeService = new ThemeService();