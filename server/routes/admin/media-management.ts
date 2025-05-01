/**
 * Admin Media Management API Routes
 * 
 * Provides endpoints for managing media files in the admin panel
 */
import express from 'express';
import { db } from '../../db';
import { 
  mediaFiles, 
  mediaCollections,
  mediaGalleries,
  users
} from '../../../shared/schema';
import { eq, and, desc, asc, sql, like, not, gt, lt, isNotNull, isNull, inArray } from 'drizzle-orm';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router();

// Configure file upload middleware
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Authentication middleware for admin-only access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // @ts-ignore: User role property should exist
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  
  next();
};

// Ensure uploads directory exists
const ensureUploadDirs = async () => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const imageDir = path.join(uploadDir, 'images');
  const videoDir = path.join(uploadDir, 'videos');
  const audioDir = path.join(uploadDir, 'audio');
  const documentDir = path.join(uploadDir, 'documents');
  
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });
    await fs.mkdir(videoDir, { recursive: true });
    await fs.mkdir(audioDir, { recursive: true });
    await fs.mkdir(documentDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

// Initialize upload directories
ensureUploadDirs();

/**
 * GET /api/admin/media/files
 * 
 * Retrieve all media files with pagination and filtering
 */
router.get('/files', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const type = req.query.type as string | undefined;
    const collectionId = req.query.collectionId ? parseInt(req.query.collectionId as string) : undefined;
    const search = req.query.search as string | undefined;
    
    // Build the query
    let query = db.select({
      ...mediaFiles,
      username: users.username,
      collectionName: mediaCollections.name
    }).from(mediaFiles)
      .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
      .leftJoin(mediaCollections, eq(mediaFiles.collectionId, mediaCollections.id));
    
    // Apply filters
    const conditions = [];
    
    if (type) {
      conditions.push(eq(mediaFiles.fileType, type));
    }
    
    if (collectionId) {
      conditions.push(eq(mediaFiles.collectionId, collectionId));
    }
    
    if (search) {
      conditions.push(
        sql`lower(${mediaFiles.fileName}) LIKE lower(${'%' + search + '%'}) OR 
            lower(${mediaFiles.title}) LIKE lower(${'%' + search + '%'}) OR
            lower(${mediaFiles.description}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaFiles)
      .where(() => conditions.length > 0 ? sql.and(...conditions) : undefined);
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(mediaFiles.createdAt));
    } else if (sortField === 'fileName') {
      query = query.orderBy(sortOrder(mediaFiles.fileName));
    } else if (sortField === 'fileSize') {
      query = query.orderBy(sortOrder(mediaFiles.fileSize));
    } else if (sortField === 'fileType') {
      query = query.orderBy(sortOrder(mediaFiles.fileType));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const files = await query;
    
    // Return files with pagination metadata
    res.json({
      files,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ error: 'Failed to fetch media files' });
  }
});

/**
 * POST /api/admin/media/files
 * 
 * Upload a new media file
 */
router.post('/files', requireAdmin, async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }
    
    // Get the uploaded file (either as single file or first file in an array)
    const uploadedFile = Array.isArray(req.files.file) 
      ? req.files.file[0] 
      : req.files.file;
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file found in the request' });
    }
    
    // Generate a unique filename
    const fileExtension = path.extname(uploadedFile.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // Determine file type
    let fileType = 'other';
    const buffer = await fs.readFile(uploadedFile.tempFilePath);
    const fileTypeInfo = await fileTypeFromBuffer(buffer);
    
    if (fileTypeInfo) {
      if (fileTypeInfo.mime.startsWith('image/')) {
        fileType = 'image';
      } else if (fileTypeInfo.mime.startsWith('video/')) {
        fileType = 'video';
      } else if (fileTypeInfo.mime.startsWith('audio/')) {
        fileType = 'audio';
      } else if (
        fileTypeInfo.mime === 'application/pdf' || 
        fileTypeInfo.mime.includes('document') ||
        fileTypeInfo.mime.includes('msword')
      ) {
        fileType = 'document';
      }
    }
    
    // Determine upload directory based on file type
    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
    let uploadDir: string;
    
    switch (fileType) {
      case 'image':
        uploadDir = path.join(baseUploadDir, 'images');
        break;
      case 'video':
        uploadDir = path.join(baseUploadDir, 'videos');
        break;
      case 'audio':
        uploadDir = path.join(baseUploadDir, 'audio');
        break;
      case 'document':
        uploadDir = path.join(baseUploadDir, 'documents');
        break;
      default:
        uploadDir = baseUploadDir;
    }
    
    // Move the file to the upload directory
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.rename(uploadedFile.tempFilePath, filePath);
    
    // Create relative URL path
    const urlPath = `/uploads/${fileType}s/${uniqueFilename}`;
    
    // Get additional metadata from request
    const {
      title = uploadedFile.name,
      description = '',
      collectionId,
      tags = [],
      altText = ''
    } = req.body;
    
    // Insert file record into database
    const [newFile] = await db.insert(mediaFiles)
      .values({
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType,
        mimeType: uploadedFile.mimetype || fileTypeInfo?.mime || 'application/octet-stream',
        filePath: urlPath,
        title,
        description,
        collectionId: collectionId ? parseInt(collectionId) : null,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        altText,
        dimensions: null, // Would need image processing library to extract dimensions
        duration: null, // Would need media processing library to extract duration
        uploadedBy: req.user?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading media file:', error);
    res.status(500).json({ error: 'Failed to upload media file' });
  }
});

/**
 * GET /api/admin/media/files/:id
 * 
 * Retrieve a specific media file by ID
 */
router.get('/files/:id', requireAdmin, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    // Get file with uploader and collection information
    const [file] = await db.select({
      ...mediaFiles,
      username: users.username,
      collectionName: mediaCollections.name
    }).from(mediaFiles)
      .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
      .leftJoin(mediaCollections, eq(mediaFiles.collectionId, mediaCollections.id))
      .where(eq(mediaFiles.id, fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Get galleries that include this file
    const galleries = await db.select({
      galleryId: mediaGalleries.id,
      galleryName: mediaGalleries.name
    }).from(mediaGalleries)
      .where(sql`${mediaFiles.id} = ANY(${mediaGalleries.mediaFileIds})`);
    
    res.json({
      ...file,
      galleries
    });
  } catch (error) {
    console.error(`Error fetching media file with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch media file' });
  }
});

/**
 * PUT /api/admin/media/files/:id
 * 
 * Update a media file's metadata
 */
router.put('/files/:id', requireAdmin, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const {
      title,
      description,
      collectionId,
      tags,
      altText
    } = req.body;
    
    // Validate file exists
    const [existingFile] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, fileId));
    
    if (!existingFile) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Create updates object with only provided fields
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (collectionId !== undefined) {
      updates.collectionId = collectionId ? parseInt(collectionId) : null;
    }
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }
    if (altText !== undefined) updates.altText = altText;
    
    // Update the file
    const [updatedFile] = await db
      .update(mediaFiles)
      .set(updates)
      .where(eq(mediaFiles.id, fileId))
      .returning();
    
    res.json(updatedFile);
  } catch (error) {
    console.error(`Error updating media file with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update media file' });
  }
});

/**
 * DELETE /api/admin/media/files/:id
 * 
 * Delete a media file
 */
router.delete('/files/:id', requireAdmin, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    // Get the file to delete
    const [fileToDelete] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, fileId));
    
    if (!fileToDelete) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Delete the file from the filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', fileToDelete.filePath);
      await fs.unlink(filePath);
    } catch (fsError) {
      console.error(`Error deleting file from filesystem:`, fsError);
      // Continue with database deletion even if the file doesn't exist on disk
    }
    
    // Delete the file record from the database
    await db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, fileId));
    
    res.json({ success: true, message: 'Media file deleted successfully' });
  } catch (error) {
    console.error(`Error deleting media file with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete media file' });
  }
});

/**
 * GET /api/admin/media/collections
 * 
 * Retrieve all media collections
 */
router.get('/collections', requireAdmin, async (req, res) => {
  try {
    // Build the query
    let query = db.select().from(mediaCollections);
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'name';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'desc' ? desc : asc;
    
    // Apply sorting
    if (sortField === 'name') {
      query = query.orderBy(sortOrder(mediaCollections.name));
    } else if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(mediaCollections.createdAt));
    }
    
    // Execute the query
    const collections = await query;
    
    // Get file counts for each collection
    const collectionCounts = await db
      .select({
        collectionId: mediaFiles.collectionId,
        count: sql<number>`count(*)`
      })
      .from(mediaFiles)
      .where(isNotNull(mediaFiles.collectionId))
      .groupBy(mediaFiles.collectionId);
    
    // Map counts to collections
    const collectionsWithCounts = collections.map(collection => {
      const countInfo = collectionCounts.find(c => c.collectionId === collection.id);
      return {
        ...collection,
        fileCount: countInfo ? countInfo.count : 0
      };
    });
    
    res.json(collectionsWithCounts);
  } catch (error) {
    console.error('Error fetching media collections:', error);
    res.status(500).json({ error: 'Failed to fetch media collections' });
  }
});

/**
 * POST /api/admin/media/collections
 * 
 * Create a new media collection
 */
router.post('/collections', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      visibility
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    // Check for duplicate name
    const [existingCollection] = await db
      .select()
      .from(mediaCollections)
      .where(sql`lower(${mediaCollections.name}) = lower(${name})`);
    
    if (existingCollection) {
      return res.status(400).json({ error: 'A collection with this name already exists' });
    }
    
    // Create the collection
    const [newCollection] = await db.insert(mediaCollections)
      .values({
        name,
        description: description || null,
        type: type || 'mixed',
        visibility: visibility || 'private',
        createdBy: req.user?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newCollection);
  } catch (error) {
    console.error('Error creating media collection:', error);
    res.status(500).json({ error: 'Failed to create media collection' });
  }
});

/**
 * PUT /api/admin/media/collections/:id
 * 
 * Update a media collection
 */
router.put('/collections/:id', requireAdmin, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const {
      name,
      description,
      type,
      visibility
    } = req.body;
    
    // Validate collection exists
    const [existingCollection] = await db
      .select()
      .from(mediaCollections)
      .where(eq(mediaCollections.id, collectionId));
    
    if (!existingCollection) {
      return res.status(404).json({ error: 'Media collection not found' });
    }
    
    // Check for duplicate name
    if (name && name !== existingCollection.name) {
      const [duplicateName] = await db
        .select()
        .from(mediaCollections)
        .where(sql`lower(${mediaCollections.name}) = lower(${name})`)
        .where(not(eq(mediaCollections.id, collectionId)));
      
      if (duplicateName) {
        return res.status(400).json({ error: 'A collection with this name already exists' });
      }
    }
    
    // Create updates object with only provided fields
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (visibility !== undefined) updates.visibility = visibility;
    
    // Update the collection
    const [updatedCollection] = await db
      .update(mediaCollections)
      .set(updates)
      .where(eq(mediaCollections.id, collectionId))
      .returning();
    
    res.json(updatedCollection);
  } catch (error) {
    console.error(`Error updating media collection with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update media collection' });
  }
});

/**
 * DELETE /api/admin/media/collections/:id
 * 
 * Delete a media collection
 */
router.delete('/collections/:id', requireAdmin, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    
    // Check if collection has files
    const [fileCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaFiles)
      .where(eq(mediaFiles.collectionId, collectionId));
    
    if (fileCount.count > 0) {
      // Instead of preventing deletion, we'll just reset the collection ID for files
      await db
        .update(mediaFiles)
        .set({ 
          collectionId: null,
          updatedAt: new Date()
        })
        .where(eq(mediaFiles.collectionId, collectionId));
    }
    
    // Delete the collection
    await db
      .delete(mediaCollections)
      .where(eq(mediaCollections.id, collectionId));
    
    res.json({ 
      success: true, 
      message: 'Media collection deleted successfully',
      filesUpdated: fileCount.count
    });
  } catch (error) {
    console.error(`Error deleting media collection with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete media collection' });
  }
});

/**
 * GET /api/admin/media/galleries
 * 
 * Retrieve all media galleries
 */
router.get('/galleries', requireAdmin, async (req, res) => {
  try {
    // Build the query
    let query = db.select({
      ...mediaGalleries,
      username: users.username
    }).from(mediaGalleries)
      .leftJoin(users, eq(mediaGalleries.createdBy, users.id));
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'name';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'desc' ? desc : asc;
    
    // Apply sorting
    if (sortField === 'name') {
      query = query.orderBy(sortOrder(mediaGalleries.name));
    } else if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(mediaGalleries.createdAt));
    }
    
    // Execute the query
    const galleries = await query;
    
    res.json(galleries);
  } catch (error) {
    console.error('Error fetching media galleries:', error);
    res.status(500).json({ error: 'Failed to fetch media galleries' });
  }
});

/**
 * GET /api/admin/media/stats
 * 
 * Get media statistics for the admin dashboard
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get count of files by type
    const filesByType = await db
      .select({
        fileType: mediaFiles.fileType,
        count: sql<number>`count(*)`
      })
      .from(mediaFiles)
      .groupBy(mediaFiles.fileType);
    
    // Format file type counts
    const fileTypeCounts: Record<string, number> = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      other: 0
    };
    
    filesByType.forEach(item => {
      if (item.fileType) {
        fileTypeCounts[item.fileType] = item.count;
      }
    });
    
    // Get total file size
    const [totalSize] = await db
      .select({
        sum: sql<number>`sum(${mediaFiles.fileSize})`
      })
      .from(mediaFiles);
    
    // Get count of collections
    const [collectionCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaCollections);
    
    // Get count of galleries
    const [galleryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaGalleries);
    
    // Get files uploaded in the last 7 days
    const [recentFiles] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaFiles)
      .where(sql`${mediaFiles.createdAt} >= NOW() - INTERVAL '7 days'`);
    
    // Calculate total files
    const totalFiles = Object.values(fileTypeCounts).reduce((sum, count) => sum + count, 0);
    
    // Return combined statistics
    res.json({
      files: {
        total: totalFiles,
        byType: fileTypeCounts,
        recentUploads: recentFiles.count
      },
      storage: {
        totalSizeBytes: totalSize.sum || 0,
        totalSizeMB: Math.round((totalSize.sum || 0) / (1024 * 1024) * 100) / 100
      },
      collections: collectionCount.count,
      galleries: galleryCount.count
    });
  } catch (error) {
    console.error('Error fetching media statistics:', error);
    res.status(500).json({ error: 'Failed to fetch media statistics' });
  }
});

export default router;