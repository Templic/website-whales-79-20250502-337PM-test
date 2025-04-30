/**
 * Theme Management Routes
 * 
 * This file defines all the API routes for theme management:
 * - Fetching public and user themes
 * - Creating, updating, and deleting themes
 * - Theme versioning and history
 * - Theme inheritance and permissions
 */

import express from 'express';
import { db } from '../db';
import { eq, and, ilike, desc, asc, sql, inArray } from 'drizzle-orm';
import { themes, themeVersions, themeHistories, themeUsage } from '../../shared/schema';
import { storage } from '../storage';

const router = express.Router();

// Middleware to check if user is admin or super_admin
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

// Middleware to check if user owns the theme or is admin
const canModifyTheme = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const themeId = parseInt(req.params.id);
  if (isNaN(themeId)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }

  try {
    const themeResult = await db.select().from(themes).where(eq(themes.id, themeId));
    
    if (themeResult.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const theme = themeResult[0];
    
    // User can modify the theme if they are the owner or an admin
    if (theme.userId === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ message: 'You do not have permission to modify this theme' });
    }
  } catch (error) {
    console.error('Error checking theme permissions:', error);
    return res.status(500).json({ message: 'Error checking theme permissions' });
  }
};

// GET /api/themes/public - Get all public themes
router.get('/public', async (req, res) => {
  try {
    const publicThemes = await db.select().from(themes)
      .where(eq(themes.isPublic, true))
      .orderBy(desc(themes.updatedAt));
      
    res.json(publicThemes);
  } catch (error) {
    console.error('Error fetching public themes:', error);
    res.status(500).json({ message: 'Error fetching public themes' });
  }
});

// GET /api/themes/user/:userId - Get user's themes
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Check if authenticated user is requesting own themes or admin is requesting
  if (!req.isAuthenticated || !req.isAuthenticated() || 
      (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    const userThemes = await db.select().from(themes)
      .where(eq(themes.userId, userId))
      .orderBy(desc(themes.updatedAt));
      
    res.json(userThemes);
  } catch (error) {
    console.error('Error fetching user themes:', error);
    res.status(500).json({ message: 'Error fetching user themes' });
  }
});

// GET /api/themes/:id - Get a specific theme
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    const themeResult = await db.select().from(themes).where(eq(themes.id, id));
    
    if (themeResult.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const theme = themeResult[0];
    
    // Check if theme is public or user is authenticated and is the owner or an admin
    if (theme.isPublic || 
        (req.isAuthenticated && req.isAuthenticated() &&
         (theme.userId === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin'))) {
      res.json(theme);
    } else {
      res.status(403).json({ message: 'You do not have permission to view this theme' });
    }
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ message: 'Error fetching theme' });
  }
});

// GET /api/themes/:id/history - Get a theme's version history
router.get('/:id/history', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    // Check if theme exists and user has permission
    const themeResult = await db.select().from(themes).where(eq(themes.id, id));
    
    if (themeResult.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const theme = themeResult[0];
    
    // Check if theme is public or user is authenticated and is the owner or an admin
    if (!theme.isPublic && 
        !(req.isAuthenticated && req.isAuthenticated() &&
         (theme.userId === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin'))) {
      return res.status(403).json({ message: 'You do not have permission to view this theme history' });
    }
    
    // Get theme versions
    const versionHistory = await db.select().from(themeVersions)
      .where(eq(themeVersions.themeId, id))
      .orderBy(desc(themeVersions.createdAt));
      
    res.json(versionHistory);
  } catch (error) {
    console.error('Error fetching theme history:', error);
    res.status(500).json({ message: 'Error fetching theme history' });
  }
});

// GET /api/themes/:id/version/:version - Get a specific theme version
router.get('/:id/version/:version', async (req, res) => {
  const id = parseInt(req.params.id);
  const version = req.params.version;
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    // Check if theme exists and user has permission
    const themeResult = await db.select().from(themes).where(eq(themes.id, id));
    
    if (themeResult.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const theme = themeResult[0];
    
    // Check if theme is public or user is authenticated and is the owner or an admin
    if (!theme.isPublic && 
        !(req.isAuthenticated && req.isAuthenticated() &&
         (theme.userId === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin'))) {
      return res.status(403).json({ message: 'You do not have permission to view this theme version' });
    }
    
    // Get specific theme version
    const versionResult = await db.select().from(themeVersions)
      .where(and(
        eq(themeVersions.themeId, id),
        eq(themeVersions.version, version)
      ));
    
    if (versionResult.length === 0) {
      return res.status(404).json({ message: 'Theme version not found' });
    }
    
    res.json(versionResult[0]);
  } catch (error) {
    console.error('Error fetching theme version:', error);
    res.status(500).json({ message: 'Error fetching theme version' });
  }
});

// POST /api/themes - Create a new theme
router.post('/', async (req, res) => {
  // User must be authenticated to create a theme
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Only admins or super_admins can create themes
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required to create themes' });
  }
  
  try {
    const { name, description, isPublic, primaryColor, accentColor, backgroundColor, textColor, fontFamily, borderRadius, tokens, tags, parentThemeId } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ message: 'Theme name is required' });
    }
    
    // Insert new theme
    const newTheme = await db.insert(themes).values({
      name,
      description: description || '',
      isPublic: isPublic || false,
      primaryColor: primaryColor || '#3b82f6',
      accentColor: accentColor || '#10b981',
      backgroundColor: backgroundColor || '#ffffff',
      textColor: textColor || '#111827',
      fontFamily: fontFamily || 'Inter, sans-serif',
      borderRadius: borderRadius || '4px',
      tokens: tokens || {},
      tags: tags || [],
      userId: req.user.id,
      parentThemeId: parentThemeId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // If theme was successfully created, create initial version
    if (newTheme.length > 0) {
      const theme = newTheme[0];
      
      // Create initial version
      await db.insert(themeVersions).values({
        themeId: theme.id,
        version: '1.0.0',
        tokens: theme.tokens,
        metadata: {
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          fontFamily: theme.fontFamily,
          borderRadius: theme.borderRadius
        },
        createdAt: new Date()
      });
      
      // Record in history
      await db.insert(themeHistories).values({
        themeId: theme.id,
        action: 'create',
        version: '1.0.0',
        userId: req.user.id,
        timestamp: new Date(),
        changes: {
          type: 'create',
          message: 'Initial theme creation'
        }
      });
      
      res.status(201).json(theme);
    } else {
      throw new Error('Failed to create theme');
    }
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ message: 'Error creating theme' });
  }
});

// PUT /api/themes/:id - Update a theme
router.put('/:id', canModifyTheme, async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    const { name, description, isPublic, primaryColor, accentColor, backgroundColor, textColor, fontFamily, borderRadius, tokens, tags } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ message: 'Theme name is required' });
    }
    
    // Get current theme to determine version number
    const currentThemeResult = await db.select().from(themes).where(eq(themes.id, id));
    
    if (currentThemeResult.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const currentTheme = currentThemeResult[0];
    
    // Get latest version
    const latestVersionResult = await db.select().from(themeVersions)
      .where(eq(themeVersions.themeId, id))
      .orderBy(desc(themeVersions.createdAt))
      .limit(1);
    
    let newVersion = '1.0.0';
    if (latestVersionResult.length > 0) {
      const latestVersion = latestVersionResult[0].version;
      // Increment minor version
      const versionParts = latestVersion.split('.');
      if (versionParts.length === 3) {
        const major = parseInt(versionParts[0]);
        const minor = parseInt(versionParts[1]);
        const patch = parseInt(versionParts[2]);
        newVersion = `${major}.${minor + 1}.${patch}`;
      }
    }
    
    // Update theme
    const updatedTheme = await db.update(themes)
      .set({
        name,
        description: description || currentTheme.description,
        isPublic: isPublic !== undefined ? isPublic : currentTheme.isPublic,
        primaryColor: primaryColor || currentTheme.primaryColor,
        accentColor: accentColor || currentTheme.accentColor,
        backgroundColor: backgroundColor || currentTheme.backgroundColor,
        textColor: textColor || currentTheme.textColor,
        fontFamily: fontFamily || currentTheme.fontFamily,
        borderRadius: borderRadius || currentTheme.borderRadius,
        tokens: tokens || currentTheme.tokens,
        tags: tags || currentTheme.tags,
        updatedAt: new Date()
      })
      .where(eq(themes.id, id))
      .returning();
    
    if (updatedTheme.length > 0) {
      const theme = updatedTheme[0];
      
      // Create new version
      await db.insert(themeVersions).values({
        themeId: theme.id,
        version: newVersion,
        tokens: theme.tokens,
        metadata: {
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          fontFamily: theme.fontFamily,
          borderRadius: theme.borderRadius
        },
        createdAt: new Date()
      });
      
      // Record in history
      await db.insert(themeHistories).values({
        themeId: theme.id,
        action: 'update',
        version: newVersion,
        userId: req.user.id,
        timestamp: new Date(),
        changes: {
          type: 'update',
          message: 'Theme updated'
        }
      });
      
      res.json(theme);
    } else {
      res.status(404).json({ message: 'Theme not found' });
    }
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ message: 'Error updating theme' });
  }
});

// DELETE /api/themes/:id - Delete a theme
router.delete('/:id', canModifyTheme, async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    // Delete theme (this will cascade to versions and history if configured in the schema)
    const deleted = await db.delete(themes).where(eq(themes.id, id)).returning();
    
    if (deleted.length > 0) {
      res.json({ message: 'Theme deleted successfully' });
    } else {
      res.status(404).json({ message: 'Theme not found' });
    }
  } catch (error) {
    console.error('Error deleting theme:', error);
    res.status(500).json({ message: 'Error deleting theme' });
  }
});

// POST /api/themes/:id/clone - Clone a theme
router.post('/:id/clone', async (req, res) => {
  // User must be authenticated to clone a theme
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'New theme name is required' });
  }
  
  try {
    // Get the original theme
    const originalThemeResult = await db.select().from(themes).where(eq(themes.id, id));
    
    if (originalThemeResult.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const originalTheme = originalThemeResult[0];
    
    // Check if the theme is public or the user has permission to access it
    if (!originalTheme.isPublic && 
        !(req.isAuthenticated && req.isAuthenticated() &&
         (originalTheme.userId === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin'))) {
      return res.status(403).json({ message: 'You do not have permission to clone this theme' });
    }
    
    // Create new theme based on original
    const newTheme = await db.insert(themes).values({
      name,
      description: `Clone of ${originalTheme.name}`,
      isPublic: false, // Cloned themes are private by default
      primaryColor: originalTheme.primaryColor,
      accentColor: originalTheme.accentColor,
      backgroundColor: originalTheme.backgroundColor,
      textColor: originalTheme.textColor,
      fontFamily: originalTheme.fontFamily,
      borderRadius: originalTheme.borderRadius,
      tokens: originalTheme.tokens,
      tags: [...originalTheme.tags, 'cloned'],
      userId: req.user.id,
      parentThemeId: originalTheme.id, // Set the original as parent
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    if (newTheme.length > 0) {
      const theme = newTheme[0];
      
      // Create initial version
      await db.insert(themeVersions).values({
        themeId: theme.id,
        version: '1.0.0',
        tokens: theme.tokens,
        metadata: {
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          fontFamily: theme.fontFamily,
          borderRadius: theme.borderRadius
        },
        createdAt: new Date()
      });
      
      // Record in history
      await db.insert(themeHistories).values({
        themeId: theme.id,
        action: 'create',
        version: '1.0.0',
        userId: req.user.id,
        timestamp: new Date(),
        changes: {
          type: 'clone',
          message: `Cloned from theme ${originalTheme.id} (${originalTheme.name})`,
          originalThemeId: originalTheme.id
        }
      });
      
      res.status(201).json(theme);
    } else {
      throw new Error('Failed to clone theme');
    }
  } catch (error) {
    console.error('Error cloning theme:', error);
    res.status(500).json({ message: 'Error cloning theme' });
  }
});

// PUT /api/themes/:id/publish - Publish a theme
router.put('/:id/publish', canModifyTheme, async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    // Update theme to be public
    const updatedTheme = await db.update(themes)
      .set({
        isPublic: true,
        updatedAt: new Date()
      })
      .where(eq(themes.id, id))
      .returning();
    
    if (updatedTheme.length > 0) {
      const theme = updatedTheme[0];
      
      // Record in history
      await db.insert(themeHistories).values({
        themeId: theme.id,
        action: 'publish',
        version: null, // No version change for publish action
        userId: req.user.id,
        timestamp: new Date(),
        changes: {
          type: 'publish',
          message: 'Theme published'
        }
      });
      
      res.json(theme);
    } else {
      res.status(404).json({ message: 'Theme not found' });
    }
  } catch (error) {
    console.error('Error publishing theme:', error);
    res.status(500).json({ message: 'Error publishing theme' });
  }
});

// PUT /api/themes/:id/unpublish - Unpublish a theme
router.put('/:id/unpublish', canModifyTheme, async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    // Update theme to be private
    const updatedTheme = await db.update(themes)
      .set({
        isPublic: false,
        updatedAt: new Date()
      })
      .where(eq(themes.id, id))
      .returning();
    
    if (updatedTheme.length > 0) {
      const theme = updatedTheme[0];
      
      // Record in history
      await db.insert(themeHistories).values({
        themeId: theme.id,
        action: 'unpublish',
        version: null, // No version change for unpublish action
        userId: req.user.id,
        timestamp: new Date(),
        changes: {
          type: 'unpublish',
          message: 'Theme unpublished'
        }
      });
      
      res.json(theme);
    } else {
      res.status(404).json({ message: 'Theme not found' });
    }
  } catch (error) {
    console.error('Error unpublishing theme:', error);
    res.status(500).json({ message: 'Error unpublishing theme' });
  }
});

// POST /api/themes/:id/record-usage - Record theme usage
router.post('/:id/record-usage', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid theme ID' });
  }
  
  try {
    // Record usage
    await db.insert(themeUsage).values({
      themeId: id,
      userId: req.isAuthenticated && req.isAuthenticated() ? req.user.id : null,
      timestamp: new Date()
    });
    
    res.json({ message: 'Usage recorded' });
  } catch (error) {
    console.error('Error recording theme usage:', error);
    res.status(500).json({ message: 'Error recording theme usage' });
  }
});

// GET /api/themes/stats - Get theme statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total theme count
    const totalThemesResult = await db.select({
      count: sql<number>`count(*)`
    }).from(themes);
    
    // Get public theme count
    const publicThemesResult = await db.select({
      count: sql<number>`count(*)`
    }).from(themes).where(eq(themes.isPublic, true));
    
    // Get theme usage stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usageStatsResult = await db.select({
      count: sql<number>`count(*)`
    }).from(themeUsage)
      .where(sql`${themeUsage.timestamp} >= ${thirtyDaysAgo}`);
    
    // Get top themes by usage
    const topThemesResult = await db.select({
      themeId: themeUsage.themeId,
      count: sql<number>`count(*) as usage_count`
    }).from(themeUsage)
      .where(sql`${themeUsage.timestamp} >= ${thirtyDaysAgo}`)
      .groupBy(themeUsage.themeId)
      .orderBy(sql`usage_count desc`)
      .limit(5);
    
    // Get theme names and IDs for the top themes
    const topThemeIds = topThemesResult.map(item => item.themeId);
    let topThemes = [];
    
    if (topThemeIds.length > 0) {
      const themeData = await db.select({
        id: themes.id,
        name: themes.name
      }).from(themes)
        .where(inArray(themes.id, topThemeIds));
      
      // Match usage counts with theme data
      topThemes = topThemesResult.map(usageItem => {
        const themeInfo = themeData.find(t => t.id === usageItem.themeId);
        return {
          id: usageItem.themeId,
          name: themeInfo ? themeInfo.name : 'Unknown Theme',
          count: usageItem.count
        };
      });
    }
    
    res.json({
      totalThemes: totalThemesResult[0].count,
      publicThemes: publicThemesResult[0].count,
      privateThemes: totalThemesResult[0].count - publicThemesResult[0].count,
      recentUsage: usageStatsResult[0].count,
      topThemes
    });
  } catch (error) {
    console.error('Error fetching theme stats:', error);
    res.status(500).json({ message: 'Error fetching theme stats' });
  }
});

// GET /api/themes/categories - Get all theme categories
router.get('/categories', async (req, res) => {
  try {
    // Get unique categorization from tags
    const categoriesResult = await db.select({
      tag: sql<string>`DISTINCT unnest(${themes.tags}) as category`
    }).from(themes)
      .where(sql`array_length(${themes.tags}, 1) > 0`)
      .orderBy(sql`category`);
    
    // Map and count themes in each category
    const categories = [];
    for (const { tag } of categoriesResult) {
      // Skip non-categories (apply only to category-like tags)
      if (!tag.startsWith('category:') && 
          !['light', 'dark', 'modern', 'classic', 'vintage', 'minimalist', 'colorful'].includes(tag)) {
        continue;
      }
      
      const count = await db.select({
        count: sql<number>`count(*)`
      }).from(themes)
        .where(sql`${tag} = ANY(${themes.tags})`);
      
      categories.push({
        name: tag,
        count: count[0].count
      });
    }
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching theme categories:', error);
    res.status(500).json({ message: 'Error fetching theme categories' });
  }
});

// GET /api/themes/tags - Get all theme tags
router.get('/tags', async (req, res) => {
  try {
    // Get all unique tags with counts
    const tagsResult = await db.select({
      tag: sql<string>`unnest(${themes.tags}) as tag`,
      count: sql<number>`count(*) as tag_count`
    }).from(themes)
      .where(sql`array_length(${themes.tags}, 1) > 0`)
      .groupBy(sql`tag`)
      .orderBy(sql`tag_count desc, tag asc`);
    
    res.json(tagsResult);
  } catch (error) {
    console.error('Error fetching theme tags:', error);
    res.status(500).json({ message: 'Error fetching theme tags' });
  }
});

// GET /api/themes/search - Search themes
router.get('/search', async (req, res) => {
  const { query, category, tag, sort, limit, userId } = req.query;
  
  try {
    let themesQuery = db.select().from(themes);
    
    // Apply query filter
    if (query) {
      themesQuery = themesQuery.where(
        sql`(${ilike(themes.name, `%${query}%`)} OR ${ilike(themes.description, `%${query}%`)})`
      );
    }
    
    // Apply category filter
    if (category) {
      themesQuery = themesQuery.where(sql`${category} = ANY(${themes.tags})`);
    }
    
    // Apply tag filter
    if (tag) {
      themesQuery = themesQuery.where(sql`${tag} = ANY(${themes.tags})`);
    }
    
    // Apply user filter
    if (userId) {
      // Only allow if authenticated and requesting own themes or admin
      if (req.isAuthenticated && req.isAuthenticated() && 
          (req.user.id === userId || req.user.role === 'admin' || req.user.role === 'super_admin')) {
        themesQuery = themesQuery.where(eq(themes.userId, userId));
      } else {
        // If not authorized, only show public themes by this user
        themesQuery = themesQuery.where(
          and(
            eq(themes.userId, userId),
            eq(themes.isPublic, true)
          )
        );
      }
    } else {
      // If no user specified, only show public themes or owned themes if authenticated
      if (req.isAuthenticated && req.isAuthenticated()) {
        themesQuery = themesQuery.where(
          sql`(${themes.isPublic} = true OR ${themes.userId} = ${req.user.id})`
        );
      } else {
        themesQuery = themesQuery.where(eq(themes.isPublic, true));
      }
    }
    
    // Apply sort
    if (sort === 'newest') {
      themesQuery = themesQuery.orderBy(desc(themes.createdAt));
    } else if (sort === 'updated') {
      themesQuery = themesQuery.orderBy(desc(themes.updatedAt));
    } else if (sort === 'name') {
      themesQuery = themesQuery.orderBy(asc(themes.name));
    } else {
      // Default sort by updated at
      themesQuery = themesQuery.orderBy(desc(themes.updatedAt));
    }
    
    // Apply limit
    if (limit && !isNaN(parseInt(limit as string))) {
      themesQuery = themesQuery.limit(parseInt(limit as string));
    } else {
      themesQuery = themesQuery.limit(20); // Default limit
    }
    
    const results = await themesQuery;
    res.json(results);
  } catch (error) {
    console.error('Error searching themes:', error);
    res.status(500).json({ message: 'Error searching themes' });
  }
});

export default router;