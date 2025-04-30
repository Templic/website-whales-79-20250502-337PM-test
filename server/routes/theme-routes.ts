import express from 'express';
import { db } from '../db';
import { themes, themeVersions, themeHistories, themeUsage, themeAnalytics, users } from '../../shared/schema';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { OpenAI } from 'openai';
import { Theme } from '@shared/schema';

// Simple permission check function
const hasPermission = (user: any, permission: string): boolean => {
  // In a real app, we would check if the user has the specific permission
  // For now, assuming admin and superadmin roles have all permissions
  if (user.role === 'admin' || user.role === 'superadmin') {
    return true;
  }
  
  // For demonstration, let's assume users can have a permissions array
  // This should be properly implemented based on your user model
  const userPermissions = user.permissions || [];
  return userPermissions.includes(permission);
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const router = express.Router();

// Middleware to check if user has theme admin permissions
const isThemeAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has admin permission for themes
  if (req.user.role === 'admin' || req.user.role === 'superadmin' || 
      hasPermission(req.user, 'theme:admin')) {
    return next();
  }
  
  return res.status(403).json({ error: 'You do not have permission to perform this action' });
};

// Get all themes (public or belonging to the current user)
router.get('/themes', isAuthenticated, async (req, res) => {
  try {
    // Get all public themes
    const publicThemes = await db.select().from(themes)
      .where(eq(themes.isPublic, true))
      .orderBy(desc(themes.updatedAt));
    
    // If user is logged in, also get their private themes
    let userThemes = [];
    if (req.user) {
      userThemes = await db.select().from(themes)
        .where(and(
          eq(themes.userId, req.user.id),
          eq(themes.isPublic, false)
        ))
        .orderBy(desc(themes.updatedAt));
    }
    
    // Return both sets of themes
    res.json({
      publicThemes,
      userThemes
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// Get a single theme
router.get('/themes/:id', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has access to this theme
    if (!theme.isPublic && (!req.user || theme.userId !== req.user.id)) {
      return res.status(403).json({ error: 'You do not have permission to view this theme' });
    }
    
    // Log theme usage
    if (req.user) {
      await db.insert(themeUsage).values({
        themeId: theme.id,
        userId: req.user.id
      });
    }
    
    res.json(theme);
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

// Create a new theme (requires authentication)
router.post('/themes', isAuthenticated, async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Theme name is required' });
    }
    
    // Create the theme
    const [newTheme] = await db.insert(themes).values({
      name: req.body.name,
      description: req.body.description,
      isPublic: req.body.isPublic || false,
      primaryColor: req.body.primaryColor || '#3b82f6',
      accentColor: req.body.accentColor || '#10b981',
      backgroundColor: req.body.backgroundColor || '#ffffff',
      textColor: req.body.textColor || '#111827',
      fontFamily: req.body.fontFamily || 'Inter, sans-serif',
      borderRadius: req.body.borderRadius || '4px',
      userId: req.user.id,
      tags: req.body.tags || [],
      tokens: req.body.tokens || {},
      parentThemeId: req.body.parentThemeId || null,
    }).returning();
    
    // Create initial version
    if (newTheme) {
      await db.insert(themeVersions).values({
        themeId: newTheme.id,
        version: '1.0.0',
        tokens: newTheme.tokens,
      });
      
      // Record history
      await db.insert(themeHistories).values({
        themeId: newTheme.id,
        action: 'create',
        version: '1.0.0',
        userId: req.user.id,
        changes: newTheme,
      });
    }
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// Update a theme (requires ownership or admin rights)
router.patch('/themes/:id', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has permission to update this theme
    if (theme.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'You do not have permission to update this theme' });
    }
    
    // Get the current version
    const [latestVersion] = await db.select()
      .from(themeVersions)
      .where(eq(themeVersions.themeId, themeId))
      .orderBy(desc(themeVersions.createdAt))
      .limit(1);
    
    // Calculate new version number
    let newVersion = '1.0.0';
    if (latestVersion) {
      const versionParts = latestVersion.version.split('.');
      const patch = parseInt(versionParts[2]) + 1;
      newVersion = `${versionParts[0]}.${versionParts[1]}.${patch}`;
    }
    
    // Update the theme
    const [updatedTheme] = await db.update(themes)
      .set({
        name: req.body.name || theme.name,
        description: req.body.description || theme.description,
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic : theme.isPublic,
        primaryColor: req.body.primaryColor || theme.primaryColor,
        accentColor: req.body.accentColor || theme.accentColor,
        backgroundColor: req.body.backgroundColor || theme.backgroundColor,
        textColor: req.body.textColor || theme.textColor,
        fontFamily: req.body.fontFamily || theme.fontFamily,
        borderRadius: req.body.borderRadius || theme.borderRadius,
        tags: req.body.tags || theme.tags,
        tokens: req.body.tokens || theme.tokens,
        parentThemeId: req.body.parentThemeId !== undefined ? req.body.parentThemeId : theme.parentThemeId,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, themeId))
      .returning();
    
    // Create new version
    await db.insert(themeVersions).values({
      themeId: updatedTheme.id,
      version: newVersion,
      tokens: updatedTheme.tokens,
    });
    
    // Record history
    await db.insert(themeHistories).values({
      themeId: updatedTheme.id,
      action: 'update',
      version: newVersion,
      userId: req.user.id,
      changes: {
        before: theme,
        after: updatedTheme,
      },
    });
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Delete a theme (requires ownership or admin rights)
router.delete('/themes/:id', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has permission to delete this theme
    if (theme.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'You do not have permission to delete this theme' });
    }
    
    // First delete related records
    await db.delete(themeVersions).where(eq(themeVersions.themeId, themeId));
    await db.delete(themeHistories).where(eq(themeHistories.themeId, themeId));
    await db.delete(themeUsage).where(eq(themeUsage.themeId, themeId));
    await db.delete(themeAnalytics).where(eq(themeAnalytics.themeId, themeId));
    
    // Then delete the theme
    await db.delete(themes).where(eq(themes.id, themeId));
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting theme:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

// Clone a theme
router.post('/themes/:id/clone', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if theme is public or belongs to the user
    if (!theme.isPublic && theme.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to clone this theme' });
    }
    
    // Create a copy of the theme
    const [clonedTheme] = await db.insert(themes).values({
      name: req.body.name || `Copy of ${theme.name}`,
      description: theme.description,
      isPublic: false, // Always set cloned themes to private initially
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      borderRadius: theme.borderRadius,
      userId: req.user.id,
      tags: [...(theme.tags || []), 'cloned'],
      tokens: theme.tokens,
      parentThemeId: theme.id, // Set the original theme as parent
    }).returning();
    
    // Create initial version
    await db.insert(themeVersions).values({
      themeId: clonedTheme.id,
      version: '1.0.0',
      tokens: clonedTheme.tokens,
    });
    
    // Record history
    await db.insert(themeHistories).values({
      themeId: clonedTheme.id,
      action: 'create',
      version: '1.0.0',
      userId: req.user.id,
      changes: {
        clonedFrom: theme.id,
      },
    });
    
    res.status(201).json(clonedTheme);
  } catch (error) {
    console.error('Error cloning theme:', error);
    res.status(500).json({ error: 'Failed to clone theme' });
  }
});

// Publish a theme (make it public)
router.post('/themes/:id/publish', isAuthenticated, isThemeAdmin, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Update the theme to make it public
    const [updatedTheme] = await db.update(themes)
      .set({
        isPublic: true,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, themeId))
      .returning();
    
    // Record history
    await db.insert(themeHistories).values({
      themeId: updatedTheme.id,
      action: 'publish',
      userId: req.user.id,
      changes: {
        isPublic: true,
      },
    });
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error publishing theme:', error);
    res.status(500).json({ error: 'Failed to publish theme' });
  }
});

// Unpublish a theme (make it private)
router.post('/themes/:id/unpublish', isAuthenticated, isThemeAdmin, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Update the theme to make it private
    const [updatedTheme] = await db.update(themes)
      .set({
        isPublic: false,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, themeId))
      .returning();
    
    // Record history
    await db.insert(themeHistories).values({
      themeId: updatedTheme.id,
      action: 'unpublish',
      userId: req.user.id,
      changes: {
        isPublic: false,
      },
    });
    
    res.json(updatedTheme);
  } catch (error) {
    console.error('Error unpublishing theme:', error);
    res.status(500).json({ error: 'Failed to unpublish theme' });
  }
});

// Get theme history
router.get('/themes/:id/history', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has access to this theme
    if (!theme.isPublic && theme.userId !== req.user.id && 
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'You do not have permission to view this theme history' });
    }
    
    // Get history records
    const history = await db.select({
      id: themeHistories.id,
      action: themeHistories.action,
      version: themeHistories.version,
      userId: themeHistories.userId,
      timestamp: themeHistories.timestamp,
      changes: themeHistories.changes,
      username: users.username,
    })
    .from(themeHistories)
    .leftJoin(users, eq(themeHistories.userId, users.id))
    .where(eq(themeHistories.themeId, themeId))
    .orderBy(desc(themeHistories.timestamp));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching theme history:', error);
    res.status(500).json({ error: 'Failed to fetch theme history' });
  }
});

// Get specific theme version
router.get('/themes/:id/versions/:versionId', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);
    
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has access to this theme
    if (!theme.isPublic && theme.userId !== req.user.id && 
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'You do not have permission to view this theme version' });
    }
    
    // Get the specific version
    const [version] = await db.select().from(themeVersions)
      .where(and(
        eq(themeVersions.themeId, themeId),
        eq(themeVersions.id, versionId)
      ));
    
    if (!version) {
      return res.status(404).json({ error: 'Theme version not found' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error fetching theme version:', error);
    res.status(500).json({ error: 'Failed to fetch theme version' });
  }
});

// Restore a theme to a previous version
router.post('/themes/:id/restore/:historyId', isAuthenticated, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const historyId = parseInt(req.params.historyId);
    
    const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if user has permission to modify this theme
    if (theme.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'You do not have permission to restore this theme' });
    }
    
    // Get the history record
    const [historyRecord] = await db.select().from(themeHistories)
      .where(and(
        eq(themeHistories.themeId, themeId),
        eq(themeHistories.id, historyId)
      ));
    
    if (!historyRecord) {
      return res.status(404).json({ error: 'History record not found' });
    }
    
    // Determine what to restore
    let tokensToRestore = {};
    let propsToRestore = {};
    
    if (historyRecord.action === 'create') {
      // For creation events, use the entire record
      tokensToRestore = historyRecord.changes.tokens || {};
      propsToRestore = {
        name: historyRecord.changes.name,
        description: historyRecord.changes.description,
        primaryColor: historyRecord.changes.primaryColor,
        accentColor: historyRecord.changes.accentColor,
        backgroundColor: historyRecord.changes.backgroundColor,
        textColor: historyRecord.changes.textColor,
        fontFamily: historyRecord.changes.fontFamily,
        borderRadius: historyRecord.changes.borderRadius,
        tags: historyRecord.changes.tags || [],
      };
    } else if (historyRecord.action === 'update' && historyRecord.changes.before) {
      // For update events, use the 'before' state
      tokensToRestore = historyRecord.changes.before.tokens || {};
      propsToRestore = {
        name: historyRecord.changes.before.name,
        description: historyRecord.changes.before.description,
        primaryColor: historyRecord.changes.before.primaryColor,
        accentColor: historyRecord.changes.before.accentColor,
        backgroundColor: historyRecord.changes.before.backgroundColor,
        textColor: historyRecord.changes.before.textColor,
        fontFamily: historyRecord.changes.before.fontFamily,
        borderRadius: historyRecord.changes.before.borderRadius,
        tags: historyRecord.changes.before.tags || [],
      };
    } else {
      // For other events or missing data, get the nearest version
      const [version] = await db.select().from(themeVersions)
        .where(and(
          eq(themeVersions.themeId, themeId),
          eq(themeVersions.version, historyRecord.version || '')
        ));
      
      if (version) {
        tokensToRestore = version.tokens || {};
      }
    }
    
    // Generate a new version number
    const [latestVersion] = await db.select()
      .from(themeVersions)
      .where(eq(themeVersions.themeId, themeId))
      .orderBy(desc(themeVersions.createdAt))
      .limit(1);
    
    let newVersion = '1.0.0';
    if (latestVersion) {
      const versionParts = latestVersion.version.split('.');
      const minor = parseInt(versionParts[1]) + 1;
      newVersion = `${versionParts[0]}.${minor}.0`;
    }
    
    // Update the theme
    const [restoredTheme] = await db.update(themes)
      .set({
        ...propsToRestore,
        tokens: tokensToRestore,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, themeId))
      .returning();
    
    // Create new version
    await db.insert(themeVersions).values({
      themeId: restoredTheme.id,
      version: newVersion,
      tokens: restoredTheme.tokens,
    });
    
    // Record history
    await db.insert(themeHistories).values({
      themeId: restoredTheme.id,
      action: 'restore',
      version: newVersion,
      userId: req.user.id,
      changes: {
        restoredFrom: {
          historyId: historyRecord.id,
          version: historyRecord.version,
          timestamp: historyRecord.timestamp
        }
      },
    });
    
    res.json(restoredTheme);
  } catch (error) {
    console.error('Error restoring theme:', error);
    res.status(500).json({ error: 'Failed to restore theme' });
  }
});

// Get theme statistics
router.get('/themes/stats', isAuthenticated, async (req, res) => {
  try {
    // Get counts
    const [totalCount] = await db.select({
      count: sql<number>`count(*)`
    }).from(themes);
    
    const [publicCount] = await db.select({
      count: sql<number>`count(*)`
    }).from(themes).where(eq(themes.isPublic, true));
    
    const [privateCount] = await db.select({
      count: sql<number>`count(*)`
    }).from(themes).where(eq(themes.isPublic, false));
    
    // Get recent usage count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentUsageCount] = await db.select({
      count: sql<number>`count(*)`
    }).from(themeUsage).where(sql`${themeUsage.timestamp} > ${thirtyDaysAgo}`);
    
    // Get top themes by usage
    const topThemes = await db.select({
      id: themes.id,
      name: themes.name,
      count: sql<number>`count(${themeUsage.id})`
    })
    .from(themes)
    .leftJoin(themeUsage, eq(themes.id, themeUsage.themeId))
    .groupBy(themes.id, themes.name)
    .orderBy(sql`count(${themeUsage.id}) desc`)
    .limit(5);
    
    res.json({
      totalThemes: totalCount?.count || 0,
      publicThemes: publicCount?.count || 0,
      privateThemes: privateCount?.count || 0,
      recentUsage: recentUsageCount?.count || 0,
      topThemes
    });
  } catch (error) {
    console.error('Error fetching theme statistics:', error);
    res.status(500).json({ error: 'Failed to fetch theme statistics' });
  }
});

// Get theme categories (unique tags with counts)
router.get('/themes/categories', isAuthenticated, async (req, res) => {
  try {
    // This is more complex with arrays in PostgreSQL
    // We need to use unnest to extract tags from the arrays
    const categories = await db.execute(sql`
      SELECT tag, COUNT(*) as count
      FROM themes, unnest(tags) AS tag
      GROUP BY tag
      ORDER BY count DESC
    `);
    
    res.json(categories.rows);
  } catch (error) {
    console.error('Error fetching theme categories:', error);
    res.status(500).json({ error: 'Failed to fetch theme categories' });
  }
});

// Get theme tags (for autocomplete)
router.get('/themes/tags', isAuthenticated, async (req, res) => {
  try {
    // Similar to categories but with a different structure
    const tags = await db.execute(sql`
      SELECT DISTINCT tag, COUNT(*) as count
      FROM themes, unnest(tags) AS tag
      GROUP BY tag
      ORDER BY count DESC
    `);
    
    res.json(tags.rows);
  } catch (error) {
    console.error('Error fetching theme tags:', error);
    res.status(500).json({ error: 'Failed to fetch theme tags' });
  }
});

// Generate a theme using AI
router.post('/themes/generate', isAuthenticated, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // Extract the prompt
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: `You are a design assistant that generates theme configurations based on user prompts.
          Generate a beautiful, accessible theme with carefully chosen colors, font pairings, and other design elements.
          Return a JSON object that can be directly used as a theme configuration, with the following structure:
          {
            "name": string, // A descriptive theme name
            "description": string, // A short description of the theme
            "primaryColor": string, // Hex code for primary color
            "accentColor": string, // Hex code for accent color
            "backgroundColor": string, // Hex code for background
            "textColor": string, // Hex code for text
            "fontFamily": string, // Font family (CSS-compatible string)
            "borderRadius": string, // Border radius (CSS-compatible string)
            "tags": string[], // Array of descriptive tags
            "tokens": object // Additional theme tokens as needed
          }` 
        },
        { 
          role: "user", 
          content: `Generate a theme based on this prompt: ${prompt}` 
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const themeConfig = JSON.parse(response.choices[0].message.content);
    
    // Create the theme
    const [newTheme] = await db.insert(themes).values({
      name: themeConfig.name,
      description: themeConfig.description,
      isPublic: false, // AI-generated themes are initially private
      primaryColor: themeConfig.primaryColor,
      accentColor: themeConfig.accentColor,
      backgroundColor: themeConfig.backgroundColor,
      textColor: themeConfig.textColor,
      fontFamily: themeConfig.fontFamily,
      borderRadius: themeConfig.borderRadius,
      userId: req.user.id,
      tags: [...(themeConfig.tags || []), 'ai-generated'],
      tokens: themeConfig.tokens || {},
    }).returning();
    
    // Create initial version
    await db.insert(themeVersions).values({
      themeId: newTheme.id,
      version: '1.0.0',
      tokens: newTheme.tokens,
      metadata: {
        prompt,
        aiModel: "gpt-4o",
      }
    });
    
    // Record history
    await db.insert(themeHistories).values({
      themeId: newTheme.id,
      action: 'create',
      version: '1.0.0',
      userId: req.user.id,
      changes: {
        ...newTheme,
        generationMethod: 'ai',
        prompt,
      },
    });
    
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Error generating theme with AI:', error);
    res.status(500).json({ error: 'Failed to generate theme' });
  }
});

export default router;