import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertThemeSchema } from '../../shared/schema';
import { validateRequest } from '../middlewares/validation';

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

// Create new theme
router.post('/', validateRequest({
  body: insertThemeSchema.extend({
    userId: z.string().optional().nullable(),
    tokens: z.record(z.any()),
    tags: z.array(z.string()).default([])
  })
}), async (req, res) => {
  try {
    const newTheme = await storage.createTheme(req.body);
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// Update theme
router.put('/:id', validateRequest({
  body: insertThemeSchema.partial().extend({
    tokens: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional()
  })
}), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid theme ID' });
    }
    
    const theme = await storage.getThemeById(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check user ownership (except admins who can edit all themes)
    const userRole = req.session?.user?.role || 'user';
    const userId = req.session?.user?.id;
    
    if (userRole !== 'admin' && userRole !== 'super_admin' && theme.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to edit this theme' });
    }
    
    const updatedTheme = await storage.updateTheme(id, req.body);
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