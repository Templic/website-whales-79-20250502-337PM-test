import { Router } from 'express';
import { db } from '../db';
import { themes, themeHistories, themeVersions, themeUsage, themeAnalytics } from '../../shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import crypto from 'crypto';
import { hasPermission } from '../utils/auth';

const router = Router();

// Helper to check theme ownership or admin status
function canModifyTheme(theme, userId, userRole) {
  return (theme.userId === userId) || userRole === 'admin' || userRole === 'super_admin';
}

// Helper to log theme history
async function logThemeHistory(themeId: number, action: string, userId: string | null, changes: any = null) {
  try {
    await db.insert(themeHistories).values({
      themeId,
      action,
      userId,
      timestamp: new Date(),
      changes,
    });
  } catch (error) {
    console.error('Error logging theme history:', error);
  }
}

// Helper to generate a version string
function generateVersionString(): string {
  const now = new Date();
  return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}-${crypto.randomBytes(2).toString('hex')}`;
}

// Helper to calculate changes between two themes
function calculateChanges(oldTheme: any, newTheme: any): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes = [];
  const fieldsToTrack = [
    'name', 'description', 'primaryColor', 'accentColor', 
    'backgroundColor', 'textColor', 'borderRadius', 'fontFamily',
    'isPublic', 'tokens', 'tags'
  ];
  
  for (const field of fieldsToTrack) {
    // Skip fields that don't exist in both objects
    if (!(field in oldTheme) || !(field in newTheme)) continue;
    
    // For arrays and objects, stringify for comparison
    const oldValue = typeof oldTheme[field] === 'object' ? JSON.stringify(oldTheme[field]) : oldTheme[field];
    const newValue = typeof newTheme[field] === 'object' ? JSON.stringify(newTheme[field]) : newTheme[field];
    
    if (oldValue !== newValue) {
      changes.push({
        field,
        oldValue: oldTheme[field],
        newValue: newTheme[field]
      });
    }
  }
  
  return changes;
}

// Admin-only middleware
function adminOnly(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Get all themes (public + user's own)
router.get('/', async (req, res) => {
  try {
    // Get all public themes
    const publicThemes = await db.select().from(themes).where(eq(themes.isPublic, true));
    
    // If user is authenticated, get their private themes too
    let userThemes = [];
    if (req.isAuthenticated()) {
      userThemes = await db.select().from(themes).where(
        and(
          eq(themes.userId, req.user.id),
          eq(themes.isPublic, false)
        )
      );
    }
    
    // Combine and send
    const allThemes = [...publicThemes, ...userThemes];
    res.json(allThemes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single theme
router.get('/:id', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if theme is accessible
    if (!theme.isPublic && (!req.isAuthenticated() || (theme.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin'))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(theme);
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new theme
router.post('/', async (req, res) => {
  try {
    // Validation
    const insertThemeSchema = createInsertSchema(themes);
    const result = insertThemeSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ errors: result.error.errors });
    }
    
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Set user ID if not provided
    const themeData = {
      ...result.data,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert the theme
    const [newTheme] = await db.insert(themes).values(themeData).returning();
    
    // Log creation in history
    await logThemeHistory(newTheme.id, 'create', req.user.id);
    
    // Create initial version
    await db.insert(themeVersions).values({
      themeId: newTheme.id,
      version: generateVersionString(),
      tokens: newTheme.tokens || {},
      metadata: {
        creator: req.user.id,
        action: 'create',
      },
    });
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a theme
router.put('/:id', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Fetch the current theme
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check permissions
    if (!req.isAuthenticated() || !canModifyTheme(theme, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Validate the updates
    const updateThemeSchema = createInsertSchema(themes).partial();
    const result = updateThemeSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ errors: result.error.errors });
    }
    
    // Calculate changes for history
    const changes = calculateChanges(theme, req.body);
    
    // Update the theme
    const updateData = {
      ...result.data,
      updatedAt: new Date(),
    };
    
    const [updatedTheme] = await db
      .update(themes)
      .set(updateData)
      .where(eq(themes.id, themeId))
      .returning();
    
    // Log update in history if there were changes
    if (changes.length > 0) {
      await logThemeHistory(updatedTheme.id, 'update', req.user.id, changes);
      
      // Create a new version
      await db.insert(themeVersions).values({
        themeId: updatedTheme.id,
        version: generateVersionString(),
        tokens: updatedTheme.tokens || {},
        metadata: {
          updater: req.user.id,
          action: 'update',
          changes
        },
      });
    }
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a theme
router.delete('/:id', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Fetch the current theme
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check permissions
    if (!req.isAuthenticated() || !canModifyTheme(theme, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Log deletion in history (before deletion)
    await logThemeHistory(themeId, 'delete', req.user.id);
    
    // Delete the theme
    await db.delete(themes).where(eq(themes.id, themeId));
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Publish a theme (make it public)
router.put('/:id/publish', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Fetch the current theme
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check permissions
    if (!req.isAuthenticated() || !canModifyTheme(theme, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update the theme
    const [updatedTheme] = await db
      .update(themes)
      .set({ isPublic: true, updatedAt: new Date() })
      .where(eq(themes.id, themeId))
      .returning();
    
    // Log in history
    await logThemeHistory(themeId, 'publish', req.user.id);
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error publishing theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unpublish a theme (make it private)
router.put('/:id/unpublish', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Fetch the current theme
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check permissions
    if (!req.isAuthenticated() || !canModifyTheme(theme, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update the theme
    const [updatedTheme] = await db
      .update(themes)
      .set({ isPublic: false, updatedAt: new Date() })
      .where(eq(themes.id, themeId))
      .returning();
    
    // Log in history
    await logThemeHistory(themeId, 'unpublish', req.user.id);
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error unpublishing theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get theme history
router.get('/:id/history', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Fetch the current theme
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check permissions
    if (!theme.isPublic && (!req.isAuthenticated() || (theme.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin'))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get history records
    const history = await db
      .select()
      .from(themeHistories)
      .where(eq(themeHistories.themeId, themeId))
      .orderBy(desc(themeHistories.timestamp));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching theme history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Restore theme from history
router.post('/:id/restore/:historyId', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const historyId = parseInt(req.params.historyId);
    
    // Fetch the current theme
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check permissions
    if (!req.isAuthenticated() || !canModifyTheme(theme, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Get the history record
    const [historyRecord] = await db
      .select()
      .from(themeHistories)
      .where(eq(themeHistories.id, historyId));
    
    if (!historyRecord) {
      return res.status(404).json({ error: 'History record not found' });
    }
    
    // If it's a create or update action, get the changes
    if (historyRecord.action === 'update' && historyRecord.changes) {
      // Apply the changes in reverse to restore to the previous state
      const updateData = {};
      
      for (const change of historyRecord.changes) {
        updateData[change.field] = change.oldValue;
      }
      
      // Update the theme
      const [updatedTheme] = await db
        .update(themes)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(themes.id, themeId))
        .returning();
      
      // Log the restore action
      await logThemeHistory(themeId, 'restore', req.user.id, {
        restoredFrom: historyId,
        restoredAction: historyRecord.action,
        timestamp: historyRecord.timestamp
      });
      
      // Create a new version for the restored state
      await db.insert(themeVersions).values({
        themeId: updatedTheme.id,
        version: generateVersionString(),
        tokens: updatedTheme.tokens || {},
        metadata: {
          restorer: req.user.id,
          action: 'restore',
          restoredFrom: historyId
        },
      });
      
      res.json(updatedTheme);
    } else {
      return res.status(400).json({ error: 'Cannot restore from this history record' });
    }
  } catch (error) {
    console.error('Error restoring theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Log theme usage
router.post('/:id/usage', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Check if theme exists
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Log the usage
    await db.insert(themeUsage).values({
      themeId,
      userId: req.isAuthenticated() ? req.user.id : null,
      timestamp: new Date(),
    });
    
    // Update the analytics
    await db.transaction(async (tx) => {
      // Get or create analytics record
      let [analytics] = await tx
        .select()
        .from(themeAnalytics)
        .where(eq(themeAnalytics.themeId, themeId));
      
      if (!analytics) {
        [analytics] = await tx
          .insert(themeAnalytics)
          .values({
            themeId,
            applications: 1,
            uniqueUsers: req.isAuthenticated() ? 1 : 0,
            anonymousUsage: req.isAuthenticated() ? 0 : 1,
            totalEvents: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      } else {
        // Update existing record
        await tx
          .update(themeAnalytics)
          .set({
            applications: sql`${themeAnalytics.applications} + 1`,
            totalEvents: sql`${themeAnalytics.totalEvents} + 1`,
            anonymousUsage: req.isAuthenticated() 
              ? themeAnalytics.anonymousUsage 
              : sql`${themeAnalytics.anonymousUsage} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(themeAnalytics.themeId, themeId));
      }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging theme usage:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get theme analytics (admin only)
router.get('/:id/analytics', adminOnly, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    // Check if theme exists
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Get analytics
    const [analytics] = await db
      .select()
      .from(themeAnalytics)
      .where(eq(themeAnalytics.themeId, themeId));
    
    if (!analytics) {
      return res.json({
        themeId,
        applications: 0,
        uniqueUsers: 0,
        avgTimeActive: 0,
        userSentiment: 0,
        componentUsage: {},
        accessibilityScore: 0,
        performance: 0,
        totalEvents: 0,
        anonymousUsage: 0,
        eventCounts: {},
        rawAnalytics: [],
      });
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching theme analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate a theme with AI (admin only)
router.post('/generate', adminOnly, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt required' });
    }
    
    // Simplified mock generation - in a real app, this would call OpenAI API
    const generateMockTheme = (prompt: string) => {
      // Generate HSL color based on the prompt's character codes
      const getSeedFromPrompt = (p: string) => {
        return p.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0) % 1000;
      };
      
      const seed = getSeedFromPrompt(prompt);
      const hue = seed % 360;
      
      // Generate primary and secondary colors
      const primaryColor = `hsl(${hue}, 70%, 50%)`;
      const accentColor = `hsl(${(hue + 120) % 360}, 70%, 50%)`;
      const backgroundColor = 'hsl(0, 0%, 100%)';
      const textColor = 'hsl(0, 0%, 10%)';
      
      // Convert HSL to hex
      const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
          const k = (n + h / 30) % 12;
          const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
          return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
      };
      
      // Extract keywords from prompt for tags
      const keywords = prompt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5);
      
      return {
        name: `Generated Theme: ${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        description: `AI generated theme based on prompt: "${prompt}"`,
        primaryColor: primaryColor,
        accentColor: accentColor,
        backgroundColor: backgroundColor,
        textColor: textColor,
        borderRadius: '0.5rem',
        fontFamily: '',
        isPublic: false,
        tags: keywords,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    };
    
    // Generate a theme
    const themeData = generateMockTheme(prompt);
    
    // Insert the theme
    const [newTheme] = await db.insert(themes).values(themeData).returning();
    
    // Log creation in history
    await logThemeHistory(newTheme.id, 'create', req.user.id, { 
      generatedFromPrompt: prompt 
    });
    
    // Create initial version
    await db.insert(themeVersions).values({
      themeId: newTheme.id,
      version: generateVersionString(),
      tokens: newTheme.tokens || {},
      metadata: {
        creator: req.user.id,
        action: 'generate',
        prompt
      },
    });
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error generating theme:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;