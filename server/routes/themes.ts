/**
 * Theme API Routes
 * 
 * This module provides the API routes for theme management,
 * including CRUD operations, sharing, and versioning.
 */

import express from 'express';
import { themeService } from '../../shared/theme/service';
import { z } from 'zod';
import { 
  insertThemeSchema, 
  insertThemeVersionSchema, 
  insertSharedThemeSchema, 
  insertThemeFeedbackSchema 
} from '../../shared/theme/schema';

// Create router
const router = express.Router();

// Authentication middleware (placeholder)
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In a real app, this would check the user's authentication status
  // For now, we'll just attach a mock user ID
  if (!req.user) {
    req.user = { id: 1, username: 'testuser' };
  }
  next();
};

/**
 * Get current user's theme preferences and tokens
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userTheme = await themeService.getUserCompleteTheme(userId);
    
    res.json({
      themeTokens: userTheme.themeTokens,
      preferences: {
        themeMode: userTheme.preferences.themeMode,
        themeContrast: userTheme.preferences.themeContrast,
        themeMotion: userTheme.preferences.themeMotion,
        themeId: userTheme.preferences.themeId,
        customSettings: userTheme.preferences.customSettings,
      },
    });
  } catch (error) {
    console.error('Error getting user theme:', error);
    res.status(500).json({ message: 'Failed to retrieve user theme' });
  }
});

/**
 * Update user theme preferences
 */
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const schema = z.object({
      themeId: z.number().nullable().optional(),
      themeMode: z.enum(['light', 'dark', 'system', 'blackout']).optional(),
      themeContrast: z.enum(['default', 'low', 'high', 'maximum']).optional(),
      themeMotion: z.enum(['normal', 'reduced', 'none']).optional(),
      customSettings: z.record(z.any()).optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    // If themeId is specified, update the selected theme
    if (validatedData.themeId !== undefined) {
      await themeService.setUserSelectedTheme(userId, validatedData.themeId);
    }
    
    // If any other preferences are specified, update them
    if (validatedData.themeMode || validatedData.themeContrast || 
        validatedData.themeMotion || validatedData.customSettings) {
      const preferencesData: any = {};
      
      if (validatedData.themeMode) preferencesData.themeMode = validatedData.themeMode;
      if (validatedData.themeContrast) preferencesData.themeContrast = validatedData.themeContrast;
      if (validatedData.themeMotion) preferencesData.themeMotion = validatedData.themeMotion;
      if (validatedData.customSettings) preferencesData.customSettings = validatedData.customSettings;
      
      await themeService.setUserThemePreferences(userId, preferencesData);
    }
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating theme preferences:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid preference data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update theme preferences' });
  }
});

/**
 * Get all themes with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const schema = z.object({
      page: z.coerce.number().positive().default(1),
      pageSize: z.coerce.number().positive().default(20),
      search: z.string().optional(),
      tags: z.array(z.string()).optional(),
      onlyMine: z.coerce.boolean().optional(),
      sortBy: z.string().optional(),
      sortDirection: z.enum(['asc', 'desc']).optional(),
    });
    
    // Parse query parameters
    const query: any = { ...req.query };
    
    // Handle tags as an array
    if (req.query.tags) {
      query.tags = Array.isArray(req.query.tags) 
        ? req.query.tags 
        : [req.query.tags as string];
    }
    
    const validatedQuery = schema.parse(query);
    
    // If onlyMine is true, require authentication
    if (validatedQuery.onlyMine) {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required to filter by user themes' });
      }
      
      validatedQuery.userId = req.user.id;
    }
    
    const result = await themeService.listThemes(validatedQuery);
    
    res.json(result);
  } catch (error) {
    console.error('Error listing themes:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to list themes' });
  }
});

/**
 * Get a specific theme by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json(theme);
  } catch (error) {
    console.error(`Error getting theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve theme' });
  }
});

/**
 * Create a new theme
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const schema = insertThemeSchema.extend({
      tokens: z.record(z.any()).required(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const newTheme = await themeService.createTheme(
      {
        name: validatedData.name,
        description: validatedData.description,
        isPublic: validatedData.isPublic,
        tags: validatedData.tags,
        previewImageUrl: validatedData.previewImageUrl,
        userId,
      },
      validatedData.tokens
    );
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid theme data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create theme' });
  }
});

/**
 * Update a theme
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the theme
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    if (theme.theme.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this theme' });
    }
    
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      previewImageUrl: z.string().url().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const updatedTheme = await themeService.updateTheme(id, validatedData);
    
    if (!updatedTheme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json(updatedTheme);
  } catch (error) {
    console.error(`Error updating theme ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid theme data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update theme' });
  }
});

/**
 * Delete a theme
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the theme
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    if (theme.theme.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this theme' });
    }
    
    const deleted = await themeService.deleteTheme(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error(`Error deleting theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete theme' });
  }
});

/**
 * Create a new version of a theme
 */
router.post('/:id/versions', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the theme
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    if (theme.theme.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to create versions for this theme' });
    }
    
    const schema = z.object({
      tokens: z.record(z.any()).required(),
      version: z.string().optional(),
      changeNotes: z.string().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const newVersion = await themeService.createThemeVersion(
      id,
      validatedData.tokens,
      {
        version: validatedData.version,
        changeNotes: validatedData.changeNotes,
      }
    );
    
    res.status(201).json(newVersion);
  } catch (error) {
    console.error(`Error creating version for theme ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid version data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create theme version' });
  }
});

/**
 * Get all versions of a theme
 */
router.get('/:id/versions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    const versions = await themeService.getThemeVersions(id);
    
    res.json(versions);
  } catch (error) {
    console.error(`Error getting versions for theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve theme versions' });
  }
});

/**
 * Set a version as active
 */
router.post('/:id/versions/:versionId/activate', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);
    const userId = req.user?.id;
    
    if (isNaN(id) || isNaN(versionId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the theme
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    if (theme.theme.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this theme' });
    }
    
    const activated = await themeService.setActiveVersion(id, versionId);
    
    if (!activated) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    res.json({ message: 'Version activated successfully' });
  } catch (error) {
    console.error(`Error activating version ${req.params.versionId} for theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to activate version' });
  }
});

/**
 * Share a theme with a user
 */
router.post('/:id/share/user', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the theme
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    if (theme.theme.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to share this theme' });
    }
    
    const schema = z.object({
      userId: z.number().positive(),
      accessLevel: z.enum(['view', 'edit', 'admin']).optional(),
      expiresAt: z.string().datetime().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const shareData = await themeService.shareThemeWithUser(
      id,
      userId,
      validatedData.userId,
      validatedData.accessLevel,
      validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    );
    
    res.status(201).json({
      id: shareData.id,
      shareCode: shareData.shareCode,
    });
  } catch (error) {
    console.error(`Error sharing theme ${req.params.id} with user:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid share data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to share theme' });
  }
});

/**
 * Share a theme via email
 */
router.post('/:id/share/email', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the theme
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    if (theme.theme.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to share this theme' });
    }
    
    const schema = z.object({
      email: z.string().email(),
      accessLevel: z.enum(['view', 'edit', 'admin']).optional(),
      expiresAt: z.string().datetime().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const shareData = await themeService.shareThemeViaEmail(
      id,
      userId,
      validatedData.email,
      validatedData.accessLevel,
      validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    );
    
    res.status(201).json({
      id: shareData.id,
      shareCode: shareData.shareCode,
    });
  } catch (error) {
    console.error(`Error sharing theme ${req.params.id} via email:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid share data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to share theme' });
  }
});

/**
 * Get a shared theme
 */
router.get('/shared/:shareCode', async (req, res) => {
  try {
    const shareCode = req.params.shareCode;
    
    const sharedTheme = await themeService.getSharedTheme(shareCode);
    
    if (!sharedTheme) {
      return res.status(404).json({ message: 'Shared theme not found or access revoked' });
    }
    
    res.json(sharedTheme);
  } catch (error) {
    console.error(`Error getting shared theme with code ${req.params.shareCode}:`, error);
    res.status(500).json({ message: 'Failed to retrieve shared theme' });
  }
});

/**
 * List themes shared with the current user
 */
router.get('/shared/with-me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const sharedThemes = await themeService.listSharedWithUser(userId);
    
    res.json(sharedThemes);
  } catch (error) {
    console.error('Error listing themes shared with user:', error);
    res.status(500).json({ message: 'Failed to list shared themes' });
  }
});

/**
 * List themes shared by the current user
 */
router.get('/shared/by-me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const sharedThemes = await themeService.listSharedByUser(userId);
    
    res.json(sharedThemes);
  } catch (error) {
    console.error('Error listing themes shared by user:', error);
    res.status(500).json({ message: 'Failed to list shared themes' });
  }
});

/**
 * Revoke a shared theme
 */
router.post('/shared/:shareId/revoke', requireAuth, async (req, res) => {
  try {
    const shareId = parseInt(req.params.shareId);
    const userId = req.user?.id;
    
    if (isNaN(shareId)) {
      return res.status(400).json({ message: 'Invalid share ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user owns the share (authorization should be handled in service)
    
    const revoked = await themeService.revokeSharedTheme(shareId);
    
    if (!revoked) {
      return res.status(404).json({ message: 'Shared theme not found' });
    }
    
    res.json({ message: 'Share revoked successfully' });
  } catch (error) {
    console.error(`Error revoking shared theme ${req.params.shareId}:`, error);
    res.status(500).json({ message: 'Failed to revoke shared theme' });
  }
});

/**
 * Analyze a theme
 */
router.get('/:id/analyze', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    // Check if the theme exists and is accessible
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const analysis = await themeService.analyzeTheme(id);
    
    res.json(analysis);
  } catch (error) {
    console.error(`Error analyzing theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to analyze theme' });
  }
});

/**
 * Get theme recommendations
 */
router.get('/:id/recommendations', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    // Check if the theme exists and is accessible
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const focusArea = req.query.focusArea as 'color' | 'typography' | 'spacing' | 'accessibility' | 'all' | undefined;
    
    const recommendations = await themeService.getThemeRecommendations(id, focusArea);
    
    res.json(recommendations);
  } catch (error) {
    console.error(`Error getting recommendations for theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to get theme recommendations' });
  }
});

/**
 * Export a theme
 */
router.get('/:id/export', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    // Check if the theme exists and is accessible
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    // For non-public themes, require authentication
    if (!theme.theme.isPublic) {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required to export non-public theme' });
      }
      
      // Check if user has access
      if (theme.theme.userId !== userId) {
        // ToDo: Check if theme is shared with this user
      }
    }
    
    const exportData = await themeService.exportTheme(id);
    
    // Return as JSON
    res.json(JSON.parse(exportData));
  } catch (error) {
    console.error(`Error exporting theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to export theme' });
  }
});

/**
 * Import a theme
 */
router.post('/import', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const schema = z.object({
      themeData: z.string(),
      makePublic: z.boolean().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const newTheme = await themeService.importTheme(
      validatedData.themeData,
      userId,
      validatedData.makePublic
    );
    
    res.status(201).json({
      id: newTheme.id,
      name: newTheme.name,
    });
  } catch (error) {
    console.error('Error importing theme:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid import data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to import theme' });
  }
});

/**
 * Create a light theme from a dark theme
 */
router.post('/:id/create-light', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if the theme exists and is accessible
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const schema = z.object({
      name: z.string().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const newTheme = await themeService.createLightVersionFromDark(id, validatedData.name);
    
    res.status(201).json({
      id: newTheme.id,
      name: newTheme.name,
    });
  } catch (error) {
    console.error(`Error creating light theme from ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create light theme' });
  }
});

/**
 * Create a dark theme from a light theme
 */
router.post('/:id/create-dark', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if the theme exists and is accessible
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const schema = z.object({
      name: z.string().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const newTheme = await themeService.createDarkVersionFromLight(id, validatedData.name);
    
    res.status(201).json({
      id: newTheme.id,
      name: newTheme.name,
    });
  } catch (error) {
    console.error(`Error creating dark theme from ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create dark theme' });
  }
});

/**
 * Get theme statistics
 */
router.get('/:id/statistics', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    // Check if the theme exists and is accessible
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const statistics = await themeService.getThemeStatistics(id);
    
    res.json(statistics);
  } catch (error) {
    console.error(`Error getting statistics for theme ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to get theme statistics' });
  }
});

/**
 * Add feedback for a theme
 */
router.post('/:id/feedback', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if the theme exists
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const schema = insertThemeFeedbackSchema.omit({ themeId: true }).extend({
      // Add additional validation if needed
    });
    
    const validatedData = schema.parse(req.body);
    
    const feedbackData = {
      ...validatedData,
      userId,
    };
    
    const feedback = await themeService.addThemeFeedback(id, feedbackData);
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error(`Error adding feedback for theme ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid feedback data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to add feedback' });
  }
});

/**
 * Get feedback for a theme
 */
router.get('/:id/feedback', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    // Check if the theme exists
    const theme = await themeService.getTheme(id);
    
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const schema = z.object({
      page: z.coerce.number().positive().default(1),
      pageSize: z.coerce.number().positive().default(10),
      isPublic: z.coerce.boolean().optional(),
    });
    
    const validatedQuery = schema.parse(req.query);
    
    // Check if requesting non-public feedback requires authentication
    if (validatedQuery.isPublic === false) {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required to view non-public feedback' });
      }
      
      // Check if user has access (theme owner)
      if (theme.theme.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view non-public feedback for this theme' });
      }
    }
    
    const feedback = await themeService.getThemeFeedback(id, validatedQuery);
    
    res.json(feedback);
  } catch (error) {
    console.error(`Error getting feedback for theme ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to get feedback' });
  }
});

/**
 * List theme templates
 */
router.get('/templates', async (req, res) => {
  try {
    const schema = z.object({
      page: z.coerce.number().positive().default(1),
      pageSize: z.coerce.number().positive().default(20),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
    });
    
    // Parse query parameters
    const query: any = { ...req.query };
    
    // Handle tags as an array
    if (req.query.tags) {
      query.tags = Array.isArray(req.query.tags) 
        ? req.query.tags 
        : [req.query.tags as string];
    }
    
    const validatedQuery = schema.parse(query);
    
    const templates = await themeService.listTemplates(validatedQuery);
    
    res.json(templates);
  } catch (error) {
    console.error('Error listing theme templates:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to list theme templates' });
  }
});

/**
 * Get a theme template
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    const template = await themeService.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error(`Error getting template ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve template' });
  }
});

/**
 * Create a theme from a template
 */
router.post('/templates/:id/create', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const schema = z.object({
      name: z.string().min(1),
      isPublic: z.boolean().optional(),
    });
    
    const validatedData = schema.parse(req.body);
    
    const newTheme = await themeService.createThemeFromTemplate(
      id,
      validatedData.name,
      userId,
      validatedData.isPublic
    );
    
    res.status(201).json({
      id: newTheme.id,
      name: newTheme.name,
    });
  } catch (error) {
    console.error(`Error creating theme from template ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create theme from template' });
  }
});

export default router;