import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertContentHistorySchema, insertContentItemSchema, insertContentUsageSchema } from '../../shared/schema';

const router = express.Router();

/**
 * @route   GET /api/content
 * @desc    Get all content items
 * @access  Admin
 */
router.get('/', async (req, res) => {
  try {
    // Check for admin authorization 
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    // Get all content items
    const contentItems = await storage.getAllContentItems();
    // @ts-ignore - Response type issue
  return res.json(contentItems);
  } catch (error: Error) {
    console.error('Error fetching content items:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/content/:id
 * @desc    Get a content item by ID
 * @access  Admin
 */
router.get('/:id', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    const contentId = parseInt(req.params.id);
    const contentItem = await storage.getContentItemById(contentId);

    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    // @ts-ignore - Response type issue
  return res.json(contentItem);
  } catch (error: Error) {
    console.error(`Error fetching content item by ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/content/key/:key
 * @desc    Get a content item by key
 * @access  Public
 */
router.get('/key/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const contentItem = await storage.getContentItemByKey(key);

    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    // @ts-ignore - Response type issue
  return res.json(contentItem);
  } catch (error: Error) {
    console.error(`Error fetching content item by key ${req.params.key}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/content/page/:page
 * @desc    Get content items by page
 * @access  Public
 */
router.get('/page/:page', async (req, res) => {
  try {
    const page = req.params.page;
    
    // Get all content items
    const allContentItems = await storage.getAllContentItems();
    
    // Filter by page
    const pageContentItems = allContentItems.filter(item => item.page === page);

    // @ts-ignore - Response type issue
  return res.json(pageContentItems);
  } catch (error: Error) {
    console.error(`Error fetching content items for page ${req.params.page}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/content
 * @desc    Create a content item
 * @access  Admin or System Component
 */
router.post('/', async (req, res) => {
  try {
    // Check if this is an auto-creation request from the DynamicContent component
    const isAutoCreation = req.headers['x-auto-creation'] === 'true';
    
    // For non-auto-creation requests, enforce admin authorization
    if (!isAutoCreation) {
      const { user } = req.session;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
      }
    }

    // Validate the request body
    const validation = insertContentItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: validation.error.errors 
      });
    }

    // Create the content item
    const contentItem = await storage.createContentItem(validation.data);
    
    // Log the action differently based on the source
    if (isAutoCreation) {
      console.info(`Auto-created content item with key: ${contentItem.key}`);
    } else {
      console.info(`Admin created content item with key: ${contentItem.key}`);
    }
    
    return res.status(201).json(contentItem);
  } catch (error: Error) {
    console.error('Error creating content item:', error);
    
    // Check for duplicate key error
    if (error.code === '23505' && error.constraint?.includes('key')) {
      return res.status(400).json({ message: 'A content item with this key already exists' });
    }
    
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/content/:id
 * @desc    Update a content item
 * @access  Admin
 */
router.put('/:id', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    const contentId = parseInt(req.params.id);
    
    // Get the existing content item
    const existingItem = await storage.getContentItemById(contentId);
    if (!existingItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    // Check for duplicate key if the key is being updated
    if (req.body.key && req.body.key !== existingItem.key) {
      const itemWithSameKey = await storage.getContentItemByKey(req.body.key);
      if (itemWithSameKey) {
        return res.status(400).json({ message: 'A content item with this key already exists' });
      }
    }

    // Update the content item
    const updateData = {
      id: contentId,
      ...req.body,
      version: existingItem.version + 1
    };
    
    const updatedItem = await storage.updateContentItem(updateData);
    // @ts-ignore - Response type issue
  return res.json(updatedItem);
  } catch (error: Error) {
    console.error(`Error updating content item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete a content item
 * @access  Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    const contentId = parseInt(req.params.id);
    
    // Check if the content item exists
    const contentItem = await storage.getContentItemById(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    // Delete the content item
    await storage.deleteContentItem(contentId);
    return res.status(200).json({ message: 'Content item deleted successfully' });
  } catch (error: Error) {
    console.error(`Error deleting content item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/content/:id/history
 * @desc    Get the version history of a content item
 * @access  Admin
 */
router.get('/:id/history', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    const contentId = parseInt(req.params.id);
    
    // Check if content item exists
    const contentItem = await storage.getContentItemById(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Get content history
    const history = await storage.getContentHistory(contentId);
    // @ts-ignore - Response type issue
  return res.json(history);
  } catch (error: Error) {
    console.error(`Error fetching content history for item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/content/:id/version
 * @desc    Create a new version of a content item
 * @access  Admin
 */
router.post('/:id/version', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    const contentId = parseInt(req.params.id);
    const { changeDescription } = req.body;
    
    // Check if content item exists
    const contentItem = await storage.getContentItemById(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Create new version
    const version = await storage.createContentVersion(
      contentId, 
      null, // version data is taken from current content
      user.id, 
      changeDescription
    );
    
    return res.status(201).json(version);
  } catch (error: Error) {
    console.error(`Error creating content version for item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/content/history/:historyId/restore
 * @desc    Restore a content item to a previous version
 * @access  Admin
 */
router.post('/history/:historyId/restore', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }

    const historyId = parseInt(req.params.historyId);
    
    // Restore from history
    const restoredItem = await storage.restoreContentVersion(historyId);
    // @ts-ignore - Response type issue
  return res.json(restoredItem);
  } catch (error: Error) {
    console.error(`Error restoring content from history ID ${req.params.historyId}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/content/:id/usage
 * @desc    Record usage of a content item
 * @access  Public
 */
router.post('/:id/usage', async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const { location, path } = req.body;
    
    if (!location || !path) {
      return res.status(400).json({ message: 'Location and path are required' });
    }
    
    // Check if content item exists
    const contentItem = await storage.getContentItemById(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Record usage
    const usage = await storage.recordContentUsage(contentId, location, path);
    return res.status(201).json(usage);
  } catch (error: Error) {
    console.error(`Error recording content usage for item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/content/:id/view
 * @desc    Increment view count for a content item
 * @access  Public
 */
router.post('/:id/view', async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    
    // Check if content item exists
    const contentItem = await storage.getContentItemById(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Increment view
    await storage.incrementContentViews(contentId);
    return res.status(200).json({ message: 'View recorded successfully' });
  } catch (error: Error) {
    console.error(`Error incrementing view for content item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/content/report
 * @desc    Get content usage report
 * @access  Admin
 */
router.get('/report/usage', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
    }
    
    const contentId = req.query.contentId ? parseInt(req.query.contentId as string) : undefined;
    const report = await storage.getContentUsageReport(contentId);
    // @ts-ignore - Response type issue
  return res.json(report);
  } catch (error: Error) {
    console.error('Error generating content usage report:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;