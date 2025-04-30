/**
 * Theme API
 * 
 * This module provides a client-side API for interacting with the theme system.
 * It handles AJAX requests to the server for theme operations.
 */

import { ThemeTokens } from './types';
import { baseTokens } from './tokens';
import { ThemeMode, ThemeContrast, ThemeMotion } from './ThemeContext';

// Common fetch error handling
async function handleFetchResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || 'API request failed');
    } catch (e) {
      throw new Error(errorText || `API request failed with status ${response.status}`);
    }
  }
  
  return await response.json() as T;
}

/**
 * Theme API class for client-side theme operations
 */
export class ThemeAPI {
  private baseUrl: string;
  
  constructor(baseUrl = '/api/themes') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Get current user's theme
   */
  async getCurrentUserTheme(): Promise<{
    themeTokens: ThemeTokens;
    themeMode: ThemeMode;
    themeContrast: ThemeContrast;
    themeMotion: ThemeMotion;
    themeId?: number;
    customSettings?: Record<string, any>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/me`);
      const data = await handleFetchResponse<{
        themeTokens: ThemeTokens;
        preferences: {
          themeMode: ThemeMode;
          themeContrast: ThemeContrast;
          themeMotion: ThemeMotion;
          themeId?: number;
          customSettings?: Record<string, any>;
        };
      }>(response);
      
      return {
        themeTokens: data.themeTokens,
        themeMode: data.preferences.themeMode,
        themeContrast: data.preferences.themeContrast,
        themeMotion: data.preferences.themeMotion,
        themeId: data.preferences.themeId,
        customSettings: data.preferences.customSettings,
      };
    } catch (error) {
      console.error('Error getting current user theme:', error);
      
      // Return default theme values
      return {
        themeTokens: baseTokens,
        themeMode: 'light',
        themeContrast: 'default',
        themeMotion: 'normal',
      };
    }
  }
  
  /**
   * Set current user's theme preferences
   */
  async setThemePreferences(preferences: {
    themeMode?: ThemeMode;
    themeContrast?: ThemeContrast;
    themeMotion?: ThemeMotion;
    themeId?: number | null;
    customSettings?: Record<string, any>;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      
      await handleFetchResponse(response);
      return true;
    } catch (error) {
      console.error('Error setting theme preferences:', error);
      return false;
    }
  }
  
  /**
   * List available themes
   */
  async listThemes(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    tags?: string[];
    onlyMine?: boolean;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<{
    themes: Array<{
      id: number;
      name: string;
      description?: string;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      userId?: number;
      previewImageUrl?: string;
      tags?: string[];
      totalDownloads: number;
    }>;
    total: number;
    pages: number;
  }> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.pageSize !== undefined) {
        queryParams.append('pageSize', params.pageSize.toString());
      }
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach(tag => queryParams.append('tags', tag));
      }
      
      if (params.onlyMine !== undefined) {
        queryParams.append('onlyMine', params.onlyMine ? 'true' : 'false');
      }
      
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      
      if (params.sortDirection) {
        queryParams.append('sortDirection', params.sortDirection);
      }
      
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await fetch(url);
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error listing themes:', error);
      return {
        themes: [],
        total: 0,
        pages: 0,
      };
    }
  }
  
  /**
   * Get a theme by ID
   */
  async getTheme(id: number): Promise<{
    theme: {
      id: number;
      name: string;
      description?: string;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      userId?: number;
      previewImageUrl?: string;
      tags?: string[];
      totalDownloads: number;
    };
    tokens: ThemeTokens;
  } | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting theme ${id}:`, error);
      return undefined;
    }
  }
  
  /**
   * Create a new theme
   */
  async createTheme(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    tokens: ThemeTokens;
    tags?: string[];
  }): Promise<{
    id: number;
    name: string;
    description?: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error creating theme:', error);
      throw error;
    }
  }
  
  /**
   * Update a theme
   */
  async updateTheme(id: number, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    tags?: string[];
  }): Promise<{
    id: number;
    name: string;
    description?: string;
    isPublic: boolean;
    updatedAt: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error updating theme ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new version of a theme
   */
  async createThemeVersion(themeId: number, data: {
    tokens: ThemeTokens;
    version?: string;
    changeNotes?: string;
  }): Promise<{
    id: number;
    themeId: number;
    version: string;
    createdAt: string;
    changeNotes?: string;
    isActive: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error creating version for theme ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get versions of a theme
   */
  async getThemeVersions(themeId: number): Promise<Array<{
    id: number;
    themeId: number;
    version: string;
    createdAt: string;
    changeNotes?: string;
    isActive: boolean;
    publishedAt?: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/versions`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting versions for theme ${themeId}:`, error);
      return [];
    }
  }
  
  /**
   * Set active version of a theme
   */
  async setActiveVersion(themeId: number, versionId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/versions/${versionId}/activate`, {
        method: 'POST',
      });
      
      await handleFetchResponse(response);
      return true;
    } catch (error) {
      console.error(`Error setting active version for theme ${themeId}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a theme
   */
  async deleteTheme(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      
      await handleFetchResponse(response);
      return true;
    } catch (error) {
      console.error(`Error deleting theme ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Share a theme with a user
   */
  async shareThemeWithUser(themeId: number, data: {
    userId: number;
    accessLevel?: 'view' | 'edit' | 'admin';
    expiresAt?: string;
  }): Promise<{
    id: number;
    shareCode: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/share/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error sharing theme ${themeId} with user:`, error);
      throw error;
    }
  }
  
  /**
   * Share a theme via email
   */
  async shareThemeViaEmail(themeId: number, data: {
    email: string;
    accessLevel?: 'view' | 'edit' | 'admin';
    expiresAt?: string;
  }): Promise<{
    id: number;
    shareCode: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/share/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error sharing theme ${themeId} via email:`, error);
      throw error;
    }
  }
  
  /**
   * Get a shared theme by share code
   */
  async getSharedTheme(shareCode: string): Promise<{
    theme: {
      id: number;
      name: string;
      description?: string;
    };
    tokens: ThemeTokens;
    share: {
      id: number;
      shareCode: string;
      accessLevel: string;
      sharedBy: number;
      createdAt: string;
      expiresAt?: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/shared/${shareCode}`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting shared theme with code ${shareCode}:`, error);
      throw error;
    }
  }
  
  /**
   * List themes shared with the current user
   */
  async listSharedWithMe(): Promise<Array<{
    id: number;
    themeId: number;
    sharedBy: number;
    accessLevel: string;
    shareCode: string;
    createdAt: string;
    expiresAt?: string;
    lastAccessed?: string;
    theme: {
      id: number;
      name: string;
      description?: string;
    };
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/shared/with-me`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error listing themes shared with me:', error);
      return [];
    }
  }
  
  /**
   * List themes shared by the current user
   */
  async listSharedByMe(): Promise<Array<{
    id: number;
    themeId: number;
    sharedWith?: number;
    sharedEmail?: string;
    accessLevel: string;
    shareCode: string;
    createdAt: string;
    expiresAt?: string;
    lastAccessed?: string;
    theme: {
      id: number;
      name: string;
    };
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/shared/by-me`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error listing themes shared by me:', error);
      return [];
    }
  }
  
  /**
   * Revoke a shared theme
   */
  async revokeSharedTheme(shareId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/shared/${shareId}/revoke`, {
        method: 'POST',
      });
      
      await handleFetchResponse(response);
      return true;
    } catch (error) {
      console.error(`Error revoking shared theme ${shareId}:`, error);
      return false;
    }
  }
  
  /**
   * Analyze a theme
   */
  async analyzeTheme(themeId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/analyze`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error analyzing theme ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get theme recommendations
   */
  async getThemeRecommendations(
    themeId: number,
    focusArea?: 'color' | 'typography' | 'spacing' | 'accessibility' | 'all'
  ): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}/${themeId}/recommendations`);
      if (focusArea) {
        url.searchParams.append('focusArea', focusArea);
      }
      
      const response = await fetch(url.toString());
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting recommendations for theme ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Export a theme
   */
  async exportTheme(themeId: number): Promise<{
    name: string;
    description?: string;
    version: string;
    tokens: ThemeTokens;
    tags?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/export`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error exporting theme ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Import a theme
   */
  async importTheme(themeData: string, makePublic = false): Promise<{
    id: number;
    name: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeData,
          makePublic,
        }),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error importing theme:', error);
      throw error;
    }
  }
  
  /**
   * Create a light theme from a dark theme
   */
  async createLightFromDark(themeId: number, newName?: string): Promise<{
    id: number;
    name: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/create-light`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
        }),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error creating light theme from ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a dark theme from a light theme
   */
  async createDarkFromLight(themeId: number, newName?: string): Promise<{
    id: number;
    name: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/create-dark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
        }),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error creating dark theme from ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get theme statistics
   */
  async getThemeStatistics(themeId: number): Promise<{
    name: string;
    views: number;
    downloads: number;
    favorites: number;
    usageCount: number;
    totalDownloads: number;
    lastUpdated: string;
    createdAt: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/statistics`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting statistics for theme ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Add feedback for a theme
   */
  async addThemeFeedback(themeId: number, data: {
    rating?: number;
    comment?: string;
    isPublic?: boolean;
  }): Promise<{
    id: number;
    themeId: number;
    rating?: number;
    comment?: string;
    createdAt: string;
    isPublic: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${themeId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error adding feedback for theme ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get feedback for a theme
   */
  async getThemeFeedback(
    themeId: number,
    params: {
      page?: number;
      pageSize?: number;
      isPublic?: boolean;
    } = {}
  ): Promise<{
    feedback: Array<{
      id: number;
      themeId: number;
      userId?: number;
      rating?: number;
      comment?: string;
      createdAt: string;
      isPublic: boolean;
      helpfulCount: number;
    }>;
    total: number;
    pages: number;
  }> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.pageSize !== undefined) {
        queryParams.append('pageSize', params.pageSize.toString());
      }
      
      if (params.isPublic !== undefined) {
        queryParams.append('isPublic', params.isPublic ? 'true' : 'false');
      }
      
      const url = `${this.baseUrl}/${themeId}/feedback?${queryParams.toString()}`;
      const response = await fetch(url);
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting feedback for theme ${themeId}:`, error);
      return {
        feedback: [],
        total: 0,
        pages: 0,
      };
    }
  }
  
  /**
   * List theme templates
   */
  async listTemplates(params: {
    category?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    templates: Array<{
      id: number;
      name: string;
      description?: string;
      category?: string;
      tags?: string[];
      previewImageUrl?: string;
    }>;
    total: number;
    pages: number;
  }> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.category) {
        queryParams.append('category', params.category);
      }
      
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach(tag => queryParams.append('tags', tag));
      }
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.pageSize !== undefined) {
        queryParams.append('pageSize', params.pageSize.toString());
      }
      
      const url = `${this.baseUrl}/templates?${queryParams.toString()}`;
      const response = await fetch(url);
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Error listing templates:', error);
      return {
        templates: [],
        total: 0,
        pages: 0,
      };
    }
  }
  
  /**
   * Get a template by ID
   */
  async getTemplate(id: number): Promise<{
    id: number;
    name: string;
    description?: string;
    tokens: ThemeTokens;
    category?: string;
    tags?: string[];
    previewImageUrl?: string;
  } | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`);
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error getting template ${id}:`, error);
      return undefined;
    }
  }
  
  /**
   * Create a theme from a template
   */
  async createThemeFromTemplate(templateId: number, name: string, isPublic = false): Promise<{
    id: number;
    name: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          isPublic,
        }),
      });
      
      return await handleFetchResponse(response);
    } catch (error) {
      console.error(`Error creating theme from template ${templateId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance with default URL
export const themeAPI = new ThemeAPI();