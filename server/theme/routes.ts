/**
 * Theme API Routes
 * 
 * This module defines the HTTP routes for the theme system.
 * It exposes RESTful endpoints for managing themes, theme versions, and user preferences.
 */

import express from 'express';
import { z } from 'zod';
import { themeRepository } from './repository';
import { themeService } from './service';
import { 
  insertThemeSchema,
  insertThemeVersionSchema,
  insertUserThemePreferencesSchema,
  insertSharedThemeSchema,
  insertThemeFeedbackSchema
} from '@shared/theme/schema';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();

// ---------------- Theme Routes ----------------

/**
 * GET /api/themes
 * List all themes with optional filtering
 */
router.get('/themes', async (req, res) => {
  try {
    const themes = await themeRepository.listThemes({
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      publicOnly: req.query.publicOnly === 'true',
      featured: req.query.featured === 'true'
    });
    
    res.json(themes);
  } catch (error) {
    console.error('Error listing themes:', error);
    res.status(500).json({ error: 'Failed to list themes' });
  }
});

/**
 * GET /api/themes/:id
 * Get a specific theme by ID
 */
router.get('/themes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const theme = await themeRepository.getThemeById(id);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Increment view count for analytics
    await themeRepository.incrementThemeViews(id);
    
    res.json(theme);
  } catch (error) {
    console.error('Error getting theme:', error);
    res.status(500).json({ error: 'Failed to get theme' });
  }
});

/**
 * POST /api/themes
 * Create a new theme
 */
router.post('/themes', validateRequest({ body: insertThemeSchema }), async (req, res) => {
  try {
    const theme = await themeRepository.createTheme(req.body);
    res.status(201).json(theme);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

/**
 * PUT /api/themes/:id
 * Update an existing theme
 */
router.put('/themes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const theme = await themeRepository.updateTheme(id, req.body);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    res.json(theme);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

/**
 * DELETE /api/themes/:id
 * Delete a theme
 */
router.delete('/themes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await themeRepository.deleteTheme(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting theme:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

// ---------------- Theme Version Routes ----------------

/**
 * GET /api/themes/:themeId/versions
 * List all versions of a theme
 */
router.get('/themes/:themeId/versions', async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    const versions = await themeRepository.listThemeVersions(themeId);
    res.json(versions);
  } catch (error) {
    console.error('Error listing theme versions:', error);
    res.status(500).json({ error: 'Failed to list theme versions' });
  }
});

/**
 * GET /api/themes/:themeId/versions/active
 * Get the active version of a theme
 */
router.get('/themes/:themeId/versions/active', async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    const version = await themeRepository.getActiveThemeVersion(themeId);
    
    if (!version) {
      return res.status(404).json({ error: 'No active version found for this theme' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error getting active theme version:', error);
    res.status(500).json({ error: 'Failed to get active theme version' });
  }
});

/**
 * POST /api/themes/:themeId/versions
 * Create a new version for a theme
 */
router.post('/themes/:themeId/versions', validateRequest({ body: insertThemeVersionSchema }), async (req, res) => {
  try {
    const version = await themeRepository.createThemeVersion(req.body);
    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating theme version:', error);
    res.status(500).json({ error: 'Failed to create theme version' });
  }
});

/**
 * PUT /api/themes/:themeId/versions/:versionId/activate
 * Set a version as the active version for a theme
 */
router.put('/themes/:themeId/versions/:versionId/activate', async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    const versionId = parseInt(req.params.versionId);
    
    const success = await themeRepository.setThemeVersionActive(versionId, themeId);
    
    if (!success) {
      return res.status(404).json({ error: 'Theme version not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error activating theme version:', error);
    res.status(500).json({ error: 'Failed to activate theme version' });
  }
});

// ---------------- User Preferences Routes ----------------

/**
 * GET /api/users/:userId/theme-preferences
 * Get a user's theme preferences
 */
router.get('/users/:userId/theme-preferences', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const preferences = await themeRepository.getUserThemePreferences(userId);
    
    if (!preferences) {
      return res.status(404).json({ error: 'No theme preferences found for this user' });
    }
    
    res.json(preferences);
  } catch (error) {
    console.error('Error getting user theme preferences:', error);
    res.status(500).json({ error: 'Failed to get user theme preferences' });
  }
});

/**
 * PUT /api/users/:userId/theme-preferences
 * Set a user's theme preferences
 */
router.put('/users/:userId/theme-preferences', validateRequest({ body: insertUserThemePreferencesSchema }), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const preferences = await themeRepository.setUserThemePreferences({
      ...req.body,
      userId
    });
    
    res.json(preferences);
  } catch (error) {
    console.error('Error setting user theme preferences:', error);
    res.status(500).json({ error: 'Failed to set user theme preferences' });
  }
});

// ---------------- Theme Sharing Routes ----------------

/**
 * POST /api/themes/:themeId/share
 * Share a theme with another user
 */
router.post('/themes/:themeId/share', validateRequest({ body: insertSharedThemeSchema }), async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    const shared = await themeRepository.shareTheme({
      ...req.body,
      themeId
    });
    
    res.status(201).json(shared);
  } catch (error) {
    console.error('Error sharing theme:', error);
    res.status(500).json({ error: 'Failed to share theme' });
  }
});

/**
 * GET /api/shared-themes/:shareCode
 * Get a shared theme by its share code
 */
router.get('/shared-themes/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;
    const shared = await themeRepository.getSharedThemeByCode(shareCode);
    
    if (!shared) {
      return res.status(404).json({ error: 'Shared theme not found or has expired' });
    }
    
    res.json(shared);
  } catch (error) {
    console.error('Error getting shared theme:', error);
    res.status(500).json({ error: 'Failed to get shared theme' });
  }
});

/**
 * PUT /api/shared-themes/:id/revoke
 * Revoke a shared theme
 */
router.put('/shared-themes/:id/revoke', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await themeRepository.revokeSharedTheme(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Shared theme not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking shared theme:', error);
    res.status(500).json({ error: 'Failed to revoke shared theme' });
  }
});

// ---------------- Theme Analytics Routes ----------------

/**
 * POST /api/themes/:themeId/download
 * Record a theme download
 */
router.post('/themes/:themeId/download', async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    await themeRepository.incrementThemeDownloads(themeId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording theme download:', error);
    res.status(500).json({ error: 'Failed to record theme download' });
  }
});

// ---------------- Theme Feedback Routes ----------------

/**
 * POST /api/themes/:themeId/feedback
 * Add feedback for a theme
 */
router.post('/themes/:themeId/feedback', validateRequest({ body: insertThemeFeedbackSchema }), async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    await themeRepository.addThemeFeedback({
      ...req.body,
      themeId
    });
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error adding theme feedback:', error);
    res.status(500).json({ error: 'Failed to add theme feedback' });
  }
});

/**
 * GET /api/themes/:themeId/feedback
 * Get feedback for a theme
 */
router.get('/themes/:themeId/feedback', async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);
    const feedback = await themeRepository.getThemeFeedback(themeId, {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      publicOnly: req.query.publicOnly !== 'false'
    });
    
    res.json(feedback);
  } catch (error) {
    console.error('Error getting theme feedback:', error);
    res.status(500).json({ error: 'Failed to get theme feedback' });
  }
});

// ---------------- Theme Templates Routes ----------------

/**
 * GET /api/theme-templates
 * List all theme templates
 */
router.get('/theme-templates', async (req, res) => {
  try {
    const templates = await themeRepository.listThemeTemplates({
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      category: req.query.category as string
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Error listing theme templates:', error);
    res.status(500).json({ error: 'Failed to list theme templates' });
  }
});

// ---------------- Advanced Service Routes ----------------

/**
 * POST /api/themes/with-version
 * Create a new theme with an initial version in one operation
 */
router.post('/themes/with-version', async (req, res) => {
  try {
    const { theme: themeData, version: versionData } = req.body;
    
    // Validate theme data
    const validatedTheme = await insertThemeSchema.parseAsync(themeData);
    
    // Validate version data (without themeId which will be added by the service)
    const { themeId, ...versionWithoutThemeId } = await insertThemeVersionSchema.parseAsync(versionData);
    
    const result = await themeService.createThemeWithVersion(
      validatedTheme,
      versionWithoutThemeId
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating theme with version:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ error: 'Failed to create theme with version' });
    }
  }
});

/**
 * POST /api/themes/:id/clone
 * Clone a theme
 */
router.post('/themes/:id/clone', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const { name, userId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required for cloned theme' });
    }
    
    const result = await themeService.cloneTheme(themeId, name, userId);
    
    if (!result) {
      return res.status(404).json({ error: 'Theme not found or error creating clone' });
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error cloning theme:', error);
    res.status(500).json({ error: 'Failed to clone theme' });
  }
});

/**
 * GET /api/themes/search
 * Search for themes
 */
router.get('/themes/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const themes = await themeService.searchThemes(query, {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      publicOnly: req.query.publicOnly === 'true'
    });
    
    res.json(themes);
  } catch (error) {
    console.error('Error searching themes:', error);
    res.status(500).json({ error: 'Failed to search themes' });
  }
});

/**
 * GET /api/users/:userId/recommended-themes
 * Get recommended themes for a user
 */
router.get('/users/:userId/recommended-themes', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const themes = await themeService.getRecommendedThemes(userId, limit);
    res.json(themes);
  } catch (error) {
    console.error('Error getting recommended themes:', error);
    res.status(500).json({ error: 'Failed to get recommended themes' });
  }
});

export default router;