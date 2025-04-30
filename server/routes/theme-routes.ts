import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertThemeSchema } from '@shared/schema';

const router = Router();

// Middleware to check if user has admin or super_admin privileges
const isAdminOrSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  next();
};

// Middleware to check theme ownership or admin privileges
// Admins can access any theme, regular users can only access their own
const isOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    const theme = await storage.getThemeById(themeId);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Allow access if user is admin/super_admin or the theme owner
    if (
      req.user.role === 'admin' || 
      req.user.role === 'super_admin' ||
      theme.userId === req.user.id
    ) {
      return next();
    }
    
    // If theme is not public and user is not owner/admin, deny access
    if (!theme.isPublic) {
      return res.status(403).json({ error: 'You do not have permission to access this theme' });
    }
    
    // Allow read-only access to public themes
    if (req.method === 'GET') {
      return next();
    }
    
    // Deny write access to non-owners
    return res.status(403).json({ error: 'You do not have permission to modify this theme' });
    
  } catch (error) {
    console.error('Error in isOwnerOrAdmin middleware:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get all public themes
router.get('/public', async (req, res) => {
  try {
    const themes = await storage.getPublicThemes();
    res.json(themes);
  } catch (error) {
    console.error('Error fetching public themes:', error);
    res.status(500).json({ error: 'Error fetching themes' });
  }
});

// Get theme showcase with filters, pagination and stats
router.get('/showcase', async (req, res) => {
  try {
    const category = req.query.category as string;
    const tag = req.query.tag as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const includeUsageStats = req.query.includeUsageStats !== 'false';
    const includePreviewImages = req.query.includePreviewImages !== 'false';
    
    const result = await storage.getThemeShowcase({
      category,
      tag,
      limit,
      offset,
      includeUsageStats,
      includePreviewImages
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching theme showcase:', error);
    res.status(500).json({ error: 'Error fetching theme showcase' });
  }
});

// Get all theme categories
router.get('/categories', async (req, res) => {
  try {
    // Extract unique categories from themes
    const themes = await storage.getAllThemes();
    const categories = new Set<string>();
    
    themes.forEach(theme => {
      if (theme.metadata?.category) {
        categories.add(theme.metadata.category);
      }
    });
    
    res.json(Array.from(categories));
  } catch (error) {
    console.error('Error fetching theme categories:', error);
    res.status(500).json({ error: 'Error fetching theme categories' });
  }
});

// Get all theme tags
router.get('/tags', async (req, res) => {
  try {
    // Extract unique tags from themes
    const themes = await storage.getAllThemes();
    const tags = new Set<string>();
    
    themes.forEach(theme => {
      if (theme.tags && Array.isArray(theme.tags)) {
        theme.tags.forEach(tag => tags.add(tag));
      }
    });
    
    res.json(Array.from(tags));
  } catch (error) {
    console.error('Error fetching theme tags:', error);
    res.status(500).json({ error: 'Error fetching theme tags' });
  }
});

// Get all themes (admin only)
router.get('/', isAdminOrSuperAdmin, async (req, res) => {
  try {
    const themes = await storage.getAllThemes();
    res.json(themes);
  } catch (error) {
    console.error('Error fetching all themes:', error);
    res.status(500).json({ error: 'Error fetching themes' });
  }
});

// Get user's themes
router.get('/user', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const themes = await storage.getThemesByUserId(req.user.id);
    res.json(themes);
  } catch (error) {
    console.error(`Error fetching themes for user ${req.user.id}:`, error);
    res.status(500).json({ error: 'Error fetching themes' });
  }
});

// Get theme by ID
router.get('/:id', async (req, res) => {
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    const theme = await storage.getThemeById(themeId);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if theme is public or user has access
    if (
      theme.isPublic || 
      (req.isAuthenticated() && (
        req.user.role === 'admin' || 
        req.user.role === 'super_admin' ||
        theme.userId === req.user.id
      ))
    ) {
      return res.json(theme);
    }
    
    // Otherwise, deny access
    return res.status(403).json({ error: 'You do not have permission to access this theme' });
  } catch (error) {
    console.error(`Error fetching theme ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error fetching theme' });
  }
});

// Get child themes
router.get('/:id/children', async (req, res) => {
  const parentId = parseInt(req.params.id);
  
  if (isNaN(parentId)) {
    return res.status(400).json({ error: 'Invalid parent theme ID' });
  }
  
  try {
    const themes = await storage.getThemesByParentId(parentId);
    res.json(themes);
  } catch (error) {
    console.error(`Error fetching child themes for parent ${parentId}:`, error);
    res.status(500).json({ error: 'Error fetching child themes' });
  }
});

// Get related themes
router.get('/:id/related', async (req, res) => {
  const themeId = parseInt(req.params.id);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    const themes = await storage.getRelatedThemes(themeId, limit);
    res.json(themes);
  } catch (error) {
    console.error(`Error fetching related themes for ${themeId}:`, error);
    res.status(500).json({ error: 'Error fetching related themes' });
  }
});

// Get theme versions
router.get('/:id/versions', isOwnerOrAdmin, async (req, res) => {
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    const versions = await storage.getThemeVersions(themeId);
    res.json(versions);
  } catch (error) {
    console.error(`Error fetching versions for theme ${themeId}:`, error);
    res.status(500).json({ error: 'Error fetching theme versions' });
  }
});

// Get specific theme version
router.get('/:id/versions/:versionId', isOwnerOrAdmin, async (req, res) => {
  const themeId = parseInt(req.params.id);
  const versionId = parseInt(req.params.versionId);
  
  if (isNaN(themeId) || isNaN(versionId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  
  try {
    const version = await storage.getThemeVersion(themeId, versionId);
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(version);
  } catch (error) {
    console.error(`Error fetching version ${versionId} for theme ${themeId}:`, error);
    res.status(500).json({ error: 'Error fetching theme version' });
  }
});

// Restore theme to a specific version
router.post('/:id/versions/:versionId/restore', isOwnerOrAdmin, async (req, res) => {
  const themeId = parseInt(req.params.id);
  const versionId = parseInt(req.params.versionId);
  
  if (isNaN(themeId) || isNaN(versionId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  
  try {
    // Get the version to restore
    const version = await storage.getThemeVersion(themeId, versionId);
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    // Get the current theme
    const theme = await storage.getThemeById(themeId);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Update the theme with the version's tokens
    const updatedTheme = await storage.updateTheme(themeId, {
      tokens: version.tokens,
      version: version.version,
      metadata: {
        ...theme.metadata,
        restoredFrom: {
          versionId: version.id,
          version: version.version,
          timestamp: new Date()
        }
      }
    });
    
    // Create a new version to record this restore operation
    await storage.createThemeVersion(themeId, {
      version: `${version.version}-restored`,
      tokens: version.tokens,
      metadata: {
        restoredFrom: version.id,
        restoredBy: req.user.id,
        restoredAt: new Date(),
        snapshotReason: `Restored from version ${version.version}`
      }
    });
    
    res.json({
      success: true,
      theme: updatedTheme
    });
  } catch (error) {
    console.error(`Error restoring theme ${themeId} to version ${versionId}:`, error);
    res.status(500).json({ error: 'Error restoring theme version' });
  }
});

// Get theme analytics
router.get('/:id/analytics', isOwnerOrAdmin, async (req, res) => {
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    const analytics = await storage.getThemeAnalytics(themeId);
    res.json(analytics || { themeId, applications: 0, views: 0 });
  } catch (error) {
    console.error(`Error fetching analytics for theme ${themeId}:`, error);
    res.status(500).json({ error: 'Error fetching theme analytics' });
  }
});

// Record theme usage
router.post('/:id/usage', async (req, res) => {
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    const userId = req.isAuthenticated() ? req.user.id : undefined;
    await storage.recordThemeUsage(themeId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error recording usage for theme ${themeId}:`, error);
    res.status(500).json({ error: 'Error recording theme usage' });
  }
});

// Create a new theme (admin only)
router.post('/', isAdminOrSuperAdmin, async (req, res) => {
  try {
    // Parse and validate request body
    const themeData = insertThemeSchema.parse(req.body);
    
    // Set the current user as the theme creator
    const themeWithUser = {
      ...themeData,
      userId: req.user.id
    };
    
    // Create the theme
    const newTheme = await storage.createTheme(themeWithUser);
    
    // Create initial version
    await storage.createThemeVersion(newTheme.id, {
      version: newTheme.version || '1.0.0',
      tokens: newTheme.tokens,
      metadata: {
        createdBy: req.user.id,
        createdAt: new Date(),
        snapshotReason: 'Initial creation'
      }
    });
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid theme data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Error creating theme' });
  }
});

// Update a theme
router.put('/:id', isOwnerOrAdmin, async (req, res) => {
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    // Get current theme data
    const currentTheme = await storage.getThemeById(themeId);
    
    if (!currentTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if tokens are changing
    const tokensChanged = JSON.stringify(currentTheme.tokens) !== JSON.stringify(req.body.tokens);
    
    // If tokens changed or version changed, create a version record
    if (tokensChanged || currentTheme.version !== req.body.version) {
      await storage.createThemeVersion(themeId, {
        version: currentTheme.version,
        tokens: currentTheme.tokens,
        metadata: {
          updatedBy: req.user.id,
          updatedAt: new Date(),
          snapshotReason: 'Pre-update snapshot'
        }
      });
    }
    
    // Update the theme
    const updatedTheme = await storage.updateTheme(themeId, {
      ...req.body,
      updatedAt: new Date()
    });
    
    res.json(updatedTheme);
  } catch (error) {
    console.error(`Error updating theme ${themeId}:`, error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid theme data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Error updating theme' });
  }
});

// Delete a theme (soft delete by setting isArchived flag)
router.delete('/:id', isOwnerOrAdmin, async (req, res) => {
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    // Soft delete by updating isArchived flag
    await storage.updateTheme(themeId, { 
      isArchived: true,
      metadata: {
        archivedBy: req.user.id,
        archivedAt: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting theme ${themeId}:`, error);
    res.status(500).json({ error: 'Error deleting theme' });
  }
});

// Permanently delete a theme (super_admin only)
router.delete('/:id/permanent', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin privileges required' });
  }
  
  const themeId = parseInt(req.params.id);
  
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  try {
    // Record the deletion event before deleting
    await storage.recordSystemEvent({
      eventType: 'theme_permanently_deleted',
      userId: req.user.id,
      metadata: {
        themeId,
        deletedAt: new Date(),
        reason: req.body.reason || 'Not specified'
      }
    });
    
    // Permanently delete the theme
    await storage.deleteTheme(themeId);
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error permanently deleting theme ${themeId}:`, error);
    res.status(500).json({ error: 'Error permanently deleting theme' });
  }
});

// Get usage report for all themes (admin only)
router.get('/reports/usage', isAdminOrSuperAdmin, async (req, res) => {
  try {
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
    
    const report = await storage.getThemeUsageReport(fromDate, toDate);
    res.json(report);
  } catch (error) {
    console.error('Error generating theme usage report:', error);
    res.status(500).json({ error: 'Error generating theme usage report' });
  }
});

export default router;