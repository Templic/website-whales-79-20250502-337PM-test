import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertContentItemSchema } from '@shared/schema';

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
    return res.json(contentItems);
  } catch (error: any) {
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

    return res.json(contentItem);
  } catch (error: any) {
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

    return res.json(contentItem);
  } catch (error: any) {
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

    return res.json(pageContentItems);
  } catch (error: any) {
    console.error(`Error fetching content items for page ${req.params.page}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/content
 * @desc    Create a content item
 * @access  Admin
 */
router.post('/', async (req, res) => {
  try {
    // Check for admin authorization
    const { user } = req.session;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Unauthorized - requires admin privileges' });
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
    return res.status(201).json(contentItem);
  } catch (error: any) {
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
    return res.json(updatedItem);
  } catch (error: any) {
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
  } catch (error: any) {
    console.error(`Error deleting content item ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;