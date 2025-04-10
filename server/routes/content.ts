/**
 * content.ts
 * 
 * Routes for handling content management (text and image updates)
 */

import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { isAuthenticated, isAdmin } from '../middleware/auth';

const router = express.Router();

// Enable file upload middleware
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  responseOnLimit: "File size is too large. Maximum 5MB allowed.",
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../', 'temp'),
  createParentPath: true,
}));

// Configure upload path
const UPLOAD_PATH = path.join(__dirname, '../../', 'client/public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

/**
 * Update text content
 * POST /api/content/text
 */
router.post('/text', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { contentId, text } = req.body;
    
    if (!contentId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and text are required'
      });
    }
    
    // Here you would normally update the text in your database
    // This is a simplified example that would need to be adapted to your schema
    
    /*
    // Example database call using your DB abstraction
    await db.query(
      'UPDATE content SET text = $1, updated_at = NOW() WHERE id = $2',
      [text, contentId]
    );
    */
    
    // For now, we'll just return a success response
    // In a real implementation, retrieve the updated content from the database
    
    return res.status(200).json({
      success: true,
      message: 'Text content updated successfully',
      data: {
        id: contentId,
        contentType: 'text',
        text,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating text content:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating text content'
    });
  }
});

/**
 * Update image content
 * POST /api/content/image
 */
router.post('/image', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { contentId } = req.body;
    
    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'Content ID is required'
      });
    }
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const imageFile = req.files.image;
    
    // Validate file is an image
    if (!imageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
      });
    }
    
    // Generate a unique filename
    const fileExtension = path.extname(imageFile.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_PATH, fileName);
    
    // Move the file to the upload directory
    await imageFile.mv(filePath);
    
    // The URL to access the uploaded image
    const imageUrl = `/uploads/${fileName}`;
    
    // Here you would update the image reference in your database
    // This is a simplified example that would need to be adapted to your schema
    
    /*
    // Example database call using your DB abstraction
    await db.query(
      'UPDATE content SET image_url = $1, updated_at = NOW() WHERE id = $2',
      [imageUrl, contentId]
    );
    */
    
    // For now, we'll just return a success response with the new image URL
    // In a real implementation, retrieve the updated content from the database
    
    return res.status(200).json({
      success: true,
      message: 'Image content updated successfully',
      data: {
        id: contentId,
        contentType: 'image',
        imageUrl,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating image content:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating image content'
    });
  }
});

export default router;