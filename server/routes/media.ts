import express from 'express';
import { db } from '../db';
import { mediaFiles } from '../../shared/schema';
import path from 'path';
import fs from 'fs';
import fileUpload from 'express-fileupload';
// Import middleware for authentication
// Using isAuthenticated for standard auth check
const checkAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
};
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = express.Router();

// Set up file upload middleware with specific limits and configurations
router.use(fileUpload({
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'tmp'),
  debug: false,
}));

// Create the uploads directory if it doesn't exist
const ensureDirectoriesExist = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const mediaDir = path.join(uploadDir, 'media');
  
  // Create directories if they don't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
  }
  
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    console.log('Created media directory');
  }
  
  return { uploadDir, mediaDir };
};

// Ensure upload directories exist
ensureDirectoriesExist();

// Utility function to generate a random filename with the original extension
const generateFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
};

// Get all media files
router.get('/api/media', checkAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.select().from(mediaFiles).orderBy(mediaFiles.uploadedAt);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching media files:', error);
    return res.status(500).json({ error: 'Failed to fetch media files' });
  }
});

// Get media file by ID
router.get('/api/media/:id', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(mediaFiles).where(eq(mediaFiles.id, parseInt(id, 10)));
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error('Error fetching media file:', error);
    return res.status(500).json({ error: 'Failed to fetch media file' });
  }
});

// Upload a media file
router.post('/api/upload/media', checkAuth, requireAdmin, async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    // Get the uploaded file
    const file = req.files.file as fileUpload.UploadedFile;
    
    // Get form fields
    const page = req.body.page || 'global';
    const section = req.body.section || 'default';
    
    // Process optional fields
    let position = undefined;
    let metadata = undefined;
    
    if (req.body.position) {
      try {
        position = JSON.parse(req.body.position);
      } catch (error) {
        console.error('Error parsing position JSON:', error);
      }
    }
    
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        console.error('Error parsing metadata JSON:', error);
      }
    }
    
    // Generate unique filename to prevent collisions
    const originalFilename = file.name;
    const filename = generateFilename(originalFilename);
    
    // Determine file type from mime type
    const mimeType = file.mimetype || 'application/octet-stream';
    let fileType = 'other';
    
    if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else if (mimeType.startsWith('video/')) {
      fileType = 'video';
    } else if (mimeType.startsWith('audio/')) {
      fileType = 'audio';
    } else if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) {
      fileType = 'document';
    }
    
    // Create full path
    const { mediaDir } = ensureDirectoriesExist();
    const filePath = path.join(mediaDir, filename);
    
    // Move the temporary file to the target directory
    await file.mv(filePath);
    
    // Create the file URL (relative to server root)
    const fileUrl = `/uploads/media/${filename}`;
    
    // Create database record
    const newMediaFile = await db.insert(mediaFiles).values({
      filename,
      originalFilename,
      fileType,
      mimeType,
      fileSize: file.size,
      fileUrl,
      // thumbnailUrl will be generated for images later
      thumbnailUrl: fileType === 'image' ? fileUrl : null,
      page,
      section,
      position,
      metadata,
      uploadedBy: (req.user as any).id, // User ID from auth middleware
    }).returning();
    
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      media: newMediaFile[0]
    });
  } catch (error) {
    console.error('Error uploading media file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete a media file
router.delete('/api/media/:id', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the file in the database
    const mediaFile = await db.select().from(mediaFiles).where(eq(mediaFiles.id, parseInt(id, 10)));
    
    if (mediaFile.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Get the file path on disk
    const filename = mediaFile[0].filename;
    const filePath = path.join(process.cwd(), 'uploads', 'media', filename);
    
    // Delete the file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await db.delete(mediaFiles).where(eq(mediaFiles.id, parseInt(id, 10)));
    
    return res.json({ success: true, message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Error deleting media file:', error);
    return res.status(500).json({ error: 'Failed to delete media file' });
  }
});

export default router;