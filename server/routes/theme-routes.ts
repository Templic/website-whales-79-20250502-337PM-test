import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertThemeSchema } from '../../shared/schema';
import { validateRequest } from '../middlewares/validation';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has admin or super_admin privileges
 */
const isAdminOrSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.session?.user?.role;
  if (userRole === 'admin' || userRole === 'super_admin') {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized. Admin privileges required.' });
};

/**
 * Middleware to check theme ownership or admin privileges
 * Admins can access any theme, regular users can only access their own
 */
const isOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const themeId = parseInt(req.params.id);
  if (isNaN(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }
  
  const theme = await storage.getThemeById(themeId);
  if (!theme) {
    return res.status(404).json({ error: 'Theme not found' });
  }
  
  const userRole = req.session?.user?.role;
  const userId = req.session?.user?.id;
  
  if (userRole === 'admin' || userRole === 'super_admin' || theme.userId === userId) {
    // Set theme on request for later use
    req.theme = theme;
    return next();
  }
  
  return res.status(403).json({ error: 'You do not have permission to access this theme' });
};

const router = express.Router();

// Get all public themes
router.get('/public', async (req, res) => {
  try {
    const themes = await storage.getPublicThemes();
    res.json(themes);
  } catch (error) {
    console.error('Error fetching public themes:', error);
    res.status(500).json({ error: 'Failed to fetch public themes' });
  }
});

// Get themes by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const themes = await storage.getThemesByUserId(userId);
    res.json(themes);
  } catch (error) {
    console.error('Error fetching user themes:', error);
    res.status(500).json({ error: 'Failed to fetch user themes' });
  }
});

// Get specific theme
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid theme ID' });
    }
    
    const theme = await storage.getThemeById(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    res.json(theme);
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

// Create new theme (admin only)
router.post('/', isAdminOrSuperAdmin, validateRequest({
  body: insertThemeSchema.extend({
    userId: z.string().optional().nullable(),
    tokens: z.record(z.any()),
    tags: z.array(z.string()).default([]),
    isPublic: z.boolean().default(false),
    parentThemeId: z.number().optional().nullable(),
    version: z.string().default('1.0.0')
  })
}), async (req, res) => {
  try {
    // Set the creator's userId if not provided
    if (!req.body.userId) {
      req.body.userId = req.session?.user?.id;
    }
    
    // If extending another theme, load its properties
    if (req.body.parentThemeId) {
      const parentTheme = await storage.getThemeById(req.body.parentThemeId);
      if (!parentTheme) {
        return res.status(404).json({ error: 'Parent theme not found' });
      }
      
      // Merge tokens from parent theme if not explicitly provided
      if (!req.body.tokens) {
        req.body.tokens = parentTheme.tokens;
      } else {
        // Deep merge parent and child tokens
        req.body.tokens = {
          ...parentTheme.tokens,
          ...req.body.tokens
        };
      }
      
      // Add inheritance information in metadata
      req.body.metadata = {
        ...(req.body.metadata || {}),
        inheritance: {
          parentId: parentTheme.id,
          parentName: parentTheme.name,
          inheritedAt: new Date(),
        }
      };
    }
    
    const newTheme = await storage.createTheme(req.body);
    
    // Record theme creation event
    await storage.recordThemeEvent({
      themeId: newTheme.id,
      eventType: 'theme_created',
      userId: req.session?.user?.id,
      metadata: { isPublic: newTheme.isPublic }
    });
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// Update theme (restricted to admins or original creator)
router.put('/:id', isOwnerOrAdmin, validateRequest({
  body: insertThemeSchema.partial().extend({
    tokens: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    version: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
}), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const theme = req.theme; // From middleware
    
    // Create a snapshot of the current theme before updating
    await storage.createThemeVersion(id, {
      version: theme.version,
      tokens: theme.tokens,
      metadata: {
        ...(theme.metadata || {}),
        snapshotAt: new Date(),
        snapshotBy: req.session?.user?.id,
        snapshotReason: req.body.metadata?.updateReason || 'regular_update'
      }
    });
    
    // Auto-increment version if significant changes are detected
    if (req.body.tokens && Object.keys(req.body.tokens).length > 0) {
      if (!req.body.version) {
        // Increment version number (simple semver-like bump)
        const currentVersion = theme.version || '1.0.0';
        const [major, minor, patch] = currentVersion.split('.').map(v => parseInt(v));
        req.body.version = `${major}.${minor}.${patch + 1}`;
      }
    }
    
    const updatedTheme = await storage.updateTheme(id, req.body);
    
    // Record theme update event
    await storage.recordThemeEvent({
      themeId: id,
      eventType: 'theme_updated',
      userId: req.session?.user?.id,
      metadata: { 
        oldVersion: theme.version,
        newVersion: updatedTheme.version,
        updateReason: req.body.metadata?.updateReason || 'general_update'
      }
    });
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Delete theme
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid theme ID' });
    }
    
    const theme = await storage.getThemeById(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check user ownership (except admins who can delete all themes)
    const userRole = req.session?.user?.role || 'user';
    const userId = req.session?.user?.id;
    
    if (userRole !== 'admin' && userRole !== 'super_admin' && theme.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this theme' });
    }
    
    await storage.deleteTheme(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting theme:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

// Record theme usage
router.post('/:id/usage', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid theme ID' });
    }
    
    const theme = await storage.getThemeById(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    const userId = req.session?.user?.id;
    await storage.recordThemeUsage(id, userId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error recording theme usage:', error);
    res.status(500).json({ error: 'Failed to record theme usage' });
  }
});

// Get theme analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid theme ID' });
    }
    
    const theme = await storage.getThemeById(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has permission to see analytics
    const userRole = req.session?.user?.role || 'user';
    const userId = req.session?.user?.id;
    
    if (userRole !== 'admin' && userRole !== 'super_admin' && theme.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view analytics for this theme' });
    }
    
    const analytics = await storage.getThemeAnalytics(id);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching theme analytics:', error);
    res.status(500).json({ error: 'Failed to fetch theme analytics' });
  }
});

// Record theme event (for tracking different interactions)
router.post('/:id/event', validateRequest({
  body: z.object({
    eventType: z.string(),
    metadata: z.record(z.any()).optional()
  })
}), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid theme ID' });
    }
    
    const { eventType, metadata } = req.body;
    const userId = req.session?.user?.id;
    
    await storage.recordThemeEvent({
      themeId: id,
      eventType,
      userId,
      metadata
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error recording theme event:', error);
    res.status(500).json({ error: 'Failed to record theme event' });
  }
});

// Get overall theme usage report (admin only)
router.get('/reports/usage', async (req, res) => {
  try {
    // Only allow admins to access this report
    const userRole = req.session?.user?.role || 'user';
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'You do not have permission to view usage reports' });
    }
    
    // Parse date parameters
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    if (req.query.from) {
      fromDate = new Date(req.query.from as string);
    }
    
    if (req.query.to) {
      toDate = new Date(req.query.to as string);
    }
    
    const report = await storage.getThemeUsageReport(fromDate, toDate);
    res.json(report);
  } catch (error) {
    console.error('Error generating theme usage report:', error);
    res.status(500).json({ error: 'Failed to generate theme usage report' });
  }
});

export default router;