# File Upload Security Quick Start Guide

This guide provides a quick introduction to implementing secure file uploads in your application using our enhanced security module.

## Basic Implementation

### Step 1: Configure Express-Fileupload Middleware

```typescript
import express from 'express';
import fileUpload from 'express-fileupload';
import { cleanupTempFiles } from '../security/fileUploadSecurity';

const app = express();

// Configure the fileUpload middleware with secure defaults
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  useTempFiles: true,
  tempFileDir: './tmp/uploads/',
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: process.env.NODE_ENV === 'development'
}));

// Set up automatic temporary file cleanup (runs every hour)
cleanupTempFiles('./tmp/uploads', { maxAgeHours: 1 });
```

### Step 2: Create a Secure Upload Endpoint

```typescript
import { Router } from 'express';
import { validateUploadedFile } from '../security/fileUploadSecurity';
import path from 'path';
import fs from 'fs';

const router = Router();

router.post('/upload', async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    const file = req.files.file;
    
    // Use the security module to validate the file
    const { sanitizedFileName, fileMetadata } = await validateUploadedFile(file, {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      context: 'document-upload'
    });
    
    // Create the destination directory if it doesn't exist
    const uploadDir = './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Move the file to the uploads directory
    const uploadPath = path.join(uploadDir, sanitizedFileName);
    await file.mv(uploadPath);
    
    // Return success response
    res.json({
      success: true,
      fileName: sanitizedFileName,
      filePath: uploadPath,
      fileType: fileMetadata.mimeType,
      fileSize: fileMetadata.fileSize,
      securityChecks: fileMetadata.securityChecks
    });
  } catch (error) {
    // Handle error
    console.error('Upload error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed'
    });
  }
});

export default router;
```

## Validation Options

The `validateUploadedFile` function accepts the following options to customize validation behavior:

```typescript
interface FileValidationOptions {
  // File type restrictions
  allowedMimeTypes?: string[];          // List of allowed MIME types (e.g., 'image/png')
  allowedExtensions?: string[];         // List of allowed extensions (e.g., '.png')
  allowedCategories?: string[];         // List of allowed file categories ('image', 'document', 'audio', etc.)
  
  // Size restrictions
  minSizeBytes?: number;                // Minimum file size in bytes
  maxSizeBytes?: number;                // Maximum file size in bytes
  
  // Filename restrictions
  disallowedPatterns?: RegExp[];        // Patterns to block in filenames
  preserveOriginalExtension?: boolean;  // Whether to keep the original extension
  randomizeFileName?: boolean;          // Whether to generate a random filename
  filenameMaxLength?: number;           // Maximum length of the filename
  
  // Advanced security options
  performDeepInspection?: boolean;      // Perform additional content analysis
  scanForMalware?: boolean;             // Scan for malicious content (if available)
  
  // Metadata fields (for audit and tracking)
  userId?: string | number;             // ID of the user uploading the file
  context?: string;                     // Context of the upload (e.g., 'profile-picture')
}
```

## Common Use Cases

### Profile Picture Upload

```typescript
// For profile pictures, restrict to images with reasonable size limits
const { sanitizedFileName } = await validateUploadedFile(file, {
  allowedCategories: ['image'],         // Only allow images
  maxSizeBytes: 2 * 1024 * 1024,        // 2MB max
  randomizeFileName: true,              // Generate random filename
  userId: req.user.id,                  // Track the user
  context: 'profile-picture'            // Context for logs
});
```

### Document Upload

```typescript
// For document uploads (PDF, Word, etc.)
const { sanitizedFileName } = await validateUploadedFile(file, {
  allowedMimeTypes: [
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maxSizeBytes: 10 * 1024 * 1024,       // 10MB max
  performDeepInspection: true,          // Additional content checks
  userId: req.user.id,
  context: 'document-storage'
});
```

### Video Upload

```typescript
// For video uploads with larger size limits
const { sanitizedFileName } = await validateUploadedFile(file, {
  allowedCategories: ['video'],         // Only allow videos
  maxSizeBytes: 100 * 1024 * 1024,      // 100MB max
  minSizeBytes: 1024,                  // 1KB min (prevent empty files)
  randomizeFileName: true,
  userId: req.user.id,
  context: 'video-upload'
});
```

## Best Practices

1. **Always validate on the server side**
   Even with client-side validation, always perform thorough validation on the server.

2. **Store file metadata in your database**
   Store important metadata like original filename, MIME type, size, and file hash for future reference.

3. **Implement proper error handling**
   Provide clear, user-friendly error messages without exposing system details.

4. **Use appropriate file storage**
   Store uploaded files outside of your web root whenever possible.

5. **Configure appropriate file permissions**
   Ensure uploaded files have restrictive permissions (e.g., 0644).

6. **Implement user-specific quotas**
   Limit the amount of storage each user can use to prevent denial of service.

7. **Schedule regular cleanup**
   Use the `cleanupTempFiles` function to automatically remove temporary files.

8. **Log all file operations**
   Keep comprehensive logs of all file uploads, downloads, and modifications.

## Troubleshooting

### Common Issues

#### "Invalid file type"
- Check that the file's content matches its extension
- Verify the file is not corrupted
- Ensure the MIME type is on the allowed list

#### "File size exceeds limit"
- Check the file size against the configured limit
- Verify that limits are consistent between client and server

#### "Path traversal attempt detected"
- The filename contains suspicious patterns that could be used for path traversal
- Use the sanitized filename provided by the validation function

#### "Failed content verification"
- The file contents don't match the declared type
- The file might be corrupted or manipulated

### Debugging

Enable debug mode to get more detailed information:

```typescript
import { setDebugMode } from '../security/fileUploadSecurity';

// Enable debug mode in development environments
if (process.env.NODE_ENV === 'development') {
  setDebugMode(true);
}
```

## Security Event Handling

```typescript
import { logSecurityEvent } from '../security/logging';

// Log security events for audit purposes
try {
  // File upload logic here
} catch (error) {
  // Log security failure
  logSecurityEvent('FILE_UPLOAD_FAILURE', {
    userId: req.user?.id || 'anonymous',
    fileName: file?.name,
    error: error instanceof Error ? error.message : String(error),
    severity: 'warning'
  });
  
  res.status(400).json({ error: 'Upload failed' });
}
```

## Testing Your Implementation

To test the security of your file uploads, use the provided testing script:

```bash
# Run the security testing script
node scripts/test-file-upload-security.js

# Check the security of your upload directories
node scripts/check-upload-security.js
```

These scripts will attempt to upload various test files including:
- Valid files of different types
- Files with mismatched extensions
- Files with malicious content
- Files attempting path traversal

## Further Reading

For more in-depth information about the file upload security implementation, refer to the following resources:

- [Full Security Documentation](./file-upload-security.md)
- [OWASP File Upload Security Guide](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [Content-Type Header Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)