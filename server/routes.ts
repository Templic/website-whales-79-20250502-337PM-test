import express from "express";
import multer from 'multer';
import path from "path";
import { createServer } from "http";
import { storageInstance as storage } from "./storage";
import { createTransport } from "nodemailer";
import { hashPassword } from "./auth";
import fs from 'fs';

// Initialize Express app
const app = express();

// Function to scan file for viruses
const scanFile = async (filePath: string, scanner: any): Promise<{
  isInfected: boolean;
  viruses: string[];
  error: string | null;
}> => {
  try {
    console.log(`Starting virus scan for file: ${filePath}`);
    const result = await scanner.isInfected(filePath);
    console.log('Scan result:', result);

    return {
      isInfected: result.isInfected,
      viruses: result.viruses || [],
      error: null
    };
  } catch (error) {
    console.error('Error during virus scan:', error);
    return {
      isInfected: false,
      viruses: [],
      error: error instanceof Error ? error.message : 'Unknown error during virus scan'
    };
  }
};

// Initialize ClamAV scanner
const initClamAV = async () => {
  try {
    console.log('Initializing ClamAV scanner...');

    // Import the module using a dynamic import to get createRequire
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);

    // Import and log ClamAV module structure
    const NodeClamModule = require('clamav.js');
    console.log('ClamAV module structure:', {
      type: typeof NodeClamModule,
      keys: Object.keys(NodeClamModule),
      hasDefaultExport: !!NodeClamModule.default,
      hasCreateInstance: typeof NodeClamModule.createInstance === 'function' || 
                        typeof NodeClamModule.default?.createInstance === 'function'
    });

    // Get the appropriate module instance
    const clamav = NodeClamModule.default || NodeClamModule;

    if (!clamav || typeof clamav.createInstance !== 'function') {
      throw new Error('Invalid ClamAV module structure - createInstance not found');
    }

    // Use the system-installed ClamAV binary
    const systemClamPath = '/nix/store/4s7jsmyxy0nn45qv0s32pbp8c6z05gnq-clamav-1.3.1/bin/clamscan';
    if (!fs.existsSync(systemClamPath)) {
      throw new Error(`ClamAV binary not found at ${systemClamPath}`);
    }

    console.log('Found ClamAV binary at:', systemClamPath);

    // Create scanner instance with system configuration
    const scanner = clamav.createInstance({
      removeInfected: true,
      debugMode: true,
      clamscan: {
        path: systemClamPath,
        db: null, // Use system's virus database
        active: true
      },
      preference: 'clamscan'
    });

    console.log('ClamAV scanner instance created, initializing...');
    await scanner.init();
    console.log('ClamAV scanner initialized successfully');

    return scanner;
  } catch (error) {
    console.error('Failed to initialize ClamAV:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    return null;
  }
};

// Initialize ClamAV scanner
let clamAV: any = null;
initClamAV().then(scanner => {
  clamAV = scanner;
  if (scanner) {
    console.log('ClamAV scanner ready for use');
  } else {
    console.warn('ClamAV scanner initialization failed, virus scanning will be unavailable');
  }
}).catch(error => {
  console.error('Unexpected error during ClamAV initialization:', error);
});

// File handling utilities
const fileHandler = {
  getTempPath: (filename: string): string => {
    if (!pathUtils.validateExtension(filename)) {
      throw new Error('Invalid file extension');
    }
    const safeFilename = `temp-${Date.now()}-${pathUtils.sanitizePath(path.basename(filename))}`;
    return path.join(directories.temp, safeFilename);
  },

  getPermanentPath: (filename: string): string => {
    if (!pathUtils.validateExtension(filename)) {
      throw new Error('Invalid file extension');
    }
    const ext = path.extname(filename).toLowerCase();
    const audioExts = new Set(['.mp3', '.mp4', '.aac', '.flac', '.wav', '.aiff']);
    const videoExts = new Set(['.avi', '.wmv', '.mov', '.mp4']);

    let uploadDir;
    if (audioExts.has(ext)) {
      uploadDir = directories.audio;
    } else if (videoExts.has(ext)) {
      uploadDir = directories.video;
    } else {
      throw new Error('Invalid file type');
    }

    const safeFilename = `${Date.now()}-${path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return path.join(uploadDir, safeFilename);
  },

  moveToPermStorage: async (tempPath: string, permanentPath: string): Promise<void> => {
    try {
      await fs.promises.rename(tempPath, permanentPath);
    } catch (error) {
      // If rename fails (e.g., across devices), fallback to copy and delete
      await fs.promises.copyFile(tempPath, permanentPath);
      await fs.promises.unlink(tempPath);
    }
  },

  cleanupTemp: async (filePath: string): Promise<void> => {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
};

// Path validation and sanitization utilities
const pathUtils = {
  isPathSafe: (filePath: string, baseDir: string): boolean => {
    const normalizedPath = path.normalize(filePath);
    const normalizedBase = path.normalize(baseDir);
    return normalizedPath.startsWith(normalizedBase);
  },

  sanitizePath: (filePath: string): string => {
    // Remove any directory traversal attempts and unsafe characters
    return path.normalize(filePath)
      .replace(/^(\.\.(\/|\\|$))+/, '')
      .replace(/[<>:"|?*]/g, '_');
  },

  validateExtension: (filename: string): boolean => {
    const ext = path.extname(filename).toLowerCase();
    const safeExtensions = new Set(['.mp3', '.mp4', '.aac', '.flac', '.wav', '.aiff', '.avi', '.wmv', '.mov']);
    return safeExtensions.has(ext);
  }
};


// Define upload directories
const baseUploadDir = path.join(process.cwd(), 'private_storage/uploads');
const directories = {
  audio: path.join(baseUploadDir, 'audio'),
  video: path.join(baseUploadDir, 'video'),
  temp: path.join(baseUploadDir, 'temp')
};

// Ensure all upload directories exist
Object.values(directories).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const upload = multer({ dest: 'private_storage/uploads/temp' });

// Music upload route with virus scanning
app.post("/api/upload/music",
  upload.single('file'),
  async (
    req: express.Request & {
      file?: express.Multer.File;
      user?: { id: number; role: string; }
      isAuthenticated(): boolean;
    },
    res: express.Response
  ) => {
    console.log('Processing music upload request...');
    let tempPath: string | undefined;

    try {
      // Authentication check
      if (!req.isAuthenticated() || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        console.error('Unauthorized upload attempt');
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type and size
      const validation = validateFileUpload(req.file);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // Validate target page
      const targetPage = req.body.page;
      const allowedPages = ['new_music', 'music_archive', 'blog', 'home', 'about', 'newsletter'];

      if (!targetPage || !allowedPages.includes(targetPage)) {
        console.error(`Invalid target page: ${targetPage}`);
        return res.status(400).json({ message: "Invalid target page" });
      }

      console.log('Upload request details:', {
        filename: req.file.originalname,
        size: req.file.size,
        targetPage,
        tempFilePath: req.file.path,
        mimetype: req.file.mimetype
      });

      // Generate paths for temporary and permanent storage
      tempPath = fileHandler.getTempPath(req.file.originalname);
      const permanentPath = fileHandler.getPermanentPath(req.file.originalname);

      // First move to temp location for scanning
      await fs.promises.rename(req.file.path, tempPath);

      // Virus scan using ClamAV
      if (clamAV) {
        console.log(`Starting virus scan for file: ${tempPath}`);
        const scanResult = await scanFile(tempPath, clamAV);

        if (scanResult.error) {
          console.warn('Virus scan error:', scanResult.error);
          // Continue with upload but log the error
        } else if (scanResult.isInfected) {
          // Clean up the infected file
          await fileHandler.cleanupTemp(tempPath);
          return res.status(400).json({
            message: "File is infected with malware",
            viruses: scanResult.viruses
          });
        }
        console.log('File passed virus scan');
      } else {
        console.warn("ClamAV not available - skipping virus scan");
      }

      // After validation passed, move to permanent storage
      await fileHandler.moveToPermStorage(tempPath, permanentPath);

      // Upload the file using storage interface
      const result = await storage.uploadMusic({
        file: {
          name: path.basename(permanentPath),
          size: req.file.size,
          tempFilePath: permanentPath,
          mimetype: req.file.mimetype
        },
        targetPage: targetPage,
        uploadedBy: req.user.id,
        userRole: req.user.role as 'admin' | 'super_admin'
      });

      console.log('Upload successful:', result);

      res.json({
        ...result,
        scanned: !!clamAV,
        clean: true
      });
    } catch (error) {
      console.error("Error in music file upload:", error);
      res.status(500).json({
        message: "Failed to upload file",
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });

      // Clean up any temporary files on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        await fileHandler.cleanupTemp(req.file.path);
      }
      if (tempPath && fs.existsSync(tempPath)) {
        await fileHandler.cleanupTemp(tempPath);
      }
    }
  }
);

// Secure file serving endpoint
app.get('/media/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'private_storage/uploads', filename);

  // Validate the file path
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(path.join(process.cwd(), 'private_storage/uploads'))) {
    return res.status(403).json({ message: "Invalid file path" });
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Get file stats for content length
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  // Get file extension and set content type
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.mp4': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.aiff': 'audio/aiff',
    '.avi': 'video/avi',
    '.wmv': 'video/x-ms-wmv',
    '.mov': 'video/quicktime'
  };

  const contentType = mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream';

  // Parse Range header
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;

    // Create read stream for the range
    const stream = fs.createReadStream(filePath, { start, end });

    // Set headers for partial content
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming file" });
      }
    });

    // Pipe the stream to response
    stream.pipe(res);
  } else {
    // Set headers for full content
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Create read stream for entire file
    const stream = fs.createReadStream(filePath);

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming file" });
      }
    });

    // Pipe the stream to response
    stream.pipe(res);
  }
});
// User management routes
app.get("/api/users", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Existing subscriber route
app.post("/api/subscribe", async (req, res) => {
  try {
    const data = insertSubscriberSchema.parse(req.body);
    const subscriber = await storage.createSubscriber(data);
    res.json(subscriber);
  } catch (error) {
    res.status(400).json({ message: "Invalid subscription data" });
  }
});

// Blog post routes
app.get("/api/posts", async (req, res) => {
  try {
    console.log("Fetching all posts...");
    const posts = await storage.getPosts();
    console.log(`Found ${posts.length} posts`);

    // Only return approved posts for non-admin users
    const filteredPosts = (!req.isAuthenticated() || req.user?.role === 'user')
      ? posts.filter(post => post.approved)
      : posts;

    res.json(filteredPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "Error fetching posts",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get("/api/posts/unapproved", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const posts = await storage.getUnapprovedPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching unapproved posts" });
  }
});

app.post("/api/posts/:id/approve", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const post = await storage.approvePost(Number(req.params.id));
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error approving post" });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await storage.getPostById(Number(req.params.id));
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Only allow viewing unapproved posts if user is admin
    if (!post.approved && (!req.isAuthenticated() || req.user?.role === 'user')) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const data = insertPostSchema.parse(req.body);
    const post = await storage.createPost(data);
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Invalid post data" });
  }
});

// Category routes
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const data = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory(data);
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "Invalid category data" });
  }
});

// Comment routes
app.post("/api/posts/:postId/comments", async (req, res) => {
  try {
    const data = insertCommentSchema.parse({
      ...req.body,
      postId: Number(req.params.postId),
      approved: false  // All new comments start as unapproved
    });
    console.log("Creating comment with data:", data);
    const comment = await storage.createComment(data);
    console.log("Created comment:", comment);
    res.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(400).json({ message: "Invalid comment data" });
  }
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const comments = await storage.getCommentsByPostId(Number(req.params.postId));
    // Only return approved comments for non-admin users
    if (!req.isAuthenticated() || req.user?.role === 'user') {
      res.json(comments.filter(comment => comment.approved));
    } else {
      res.json(comments);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments" });
  }
});

app.get("/api/posts/comments/unapproved", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    console.log('Unauthorized access attempt to unapproved comments');
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    console.log("Fetching unapproved comments");
    const comments = await storage.getUnapprovedComments();
    console.log("Found unapproved comments:", comments);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching unapproved comments:", error);
    res.status(500).json({ message: "Error fetching unapproved comments" });
  }
});

app.post("/api/posts/comments/:id/approve", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const comment = await storage.approveComment(Number(req.params.id));
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "Error approving comment" });
  }
});

app.post("/api/posts/comments/:id/reject", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const comment = await storage.rejectComment(Number(req.params.id));
    res.json(comment);
  } catch (error) {
    console.error("Error rejecting comment:", error);
    res.status(500).json({ message: "Error rejecting comment" });
  }
});

// Password recovery routes
app.post("/api/recover-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await storage.getUserByEmail(email);

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: "If an account exists with this email, you will receive a recovery link." });
    }

    const token = await storage.createPasswordResetToken(user.id);
    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password Recovery",
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({ message: "If an account exists with this email, you will receive a recovery link." });
  } catch (error) {
    console.error("Password recovery error:", error);
    res.status(500).json({ message: "Failed to process recovery request" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await storage.validatePasswordResetToken(token);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, hashedPassword);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});


// Music routes 
app.get("/api/tracks", async (req, res) => {
  try {
    const tracks = await storage.getTracks();
    res.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({
      message: "Error fetching tracks",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get("/api/albums", async (req, res) => {
  try {
    const albums = await storage.getAlbums();
    res.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({
      message: "Error fetching albums",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete music endpoint
app.delete("/api/tracks/:id", async (req, res) => {
  if (!req.isAuthenticated() || (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // Validate CSRF token
  if (!req.csrfToken || req.get('CSRF-Token') !== req.csrfToken()) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  try {
    const trackId = Number(req.params.id);
    await storage.deleteMusic(trackId, req.user.id, req.user.role as 'admin' | 'super_admin');
    res.json({ message: "Track deleted successfully" });
  } catch (error) {
    console.error("Error deleting track:", error);
    res.status(error.message === 'Track not found' ? 404 : 500)
      .json({ message: error.message || "Failed to delete track" });
  }
});

// Create HTTP server with the Express app
const httpServer = createServer(app);
export default httpServer;