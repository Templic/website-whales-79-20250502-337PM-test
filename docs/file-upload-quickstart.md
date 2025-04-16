# File Upload Security: Quick Start Guide

This guide provides a concise introduction to using the enhanced file upload security module in your application.

## Basic Usage

### Step 1: Import the validation function

```typescript
import { validateUploadedFile } from '../security/fileUploadSecurity';
```

### Step 2: Validate uploaded files

```typescript
app.post('/api/upload', async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.files.file as fileUpload.UploadedFile;
    
    // Validate the file with security checks
    const { sanitizedFileName, fileMetadata } = await validateUploadedFile(file, {
      // Specify only image file types for this context
      allowedCategories: ['image'],
      // Add user context for better security logs
      userId: req.user?.id || 'anonymous',
      context: 'profile-image-upload'
    });
    
    // Move the validated file to permanent storage
    const uploadPath = path.join('./uploads/images', sanitizedFileName);
    await file.mv(uploadPath);
    
    // Store metadata for tracking and auditing
    await storeFileMetadata({
      ...fileMetadata,
      userId: req.user?.id,
      uploadPath,
      purpose: 'profile-image'
    });
    
    return res.status(200).json({ 
      success: true, 
      fileName: sanitizedFileName,
      fileHash: fileMetadata.hash
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'File upload failed' 
    });
  }
});
```

## Configuration

### Setting custom configuration

You can configure the security module with custom settings:

```typescript
import { setFileUploadSecurityConfig } from '../security/fileUploadSecurity';

// Set custom configuration
setFileUploadSecurityConfig({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minFileSize: 100, // 100 bytes minimum
  validateSvgContent: true,
  secureRandomFilenames: true,
  logAllUploads: true,
  quotaConfig: {
    maxDailyUploads: 50,
    maxWeeklyStorageBytes: 500 * 1024 * 1024, // 500MB
    cooldownPeriodMs: 1000,
    burstLimit: 5,
    burstWindowMs: 60000
  }
});
```

## Security Best Practices

1. **Specify upload context**: Always limit allowed file categories to only what's needed
   ```typescript
   // For profile images, only allow images
   allowedCategories: ['image']
   
   // For documents, only allow document types
   allowedCategories: ['document']
   ```

2. **Store metadata**: Always store security metadata for auditing
   ```typescript
   // In your database, store:
   fileMetadata.hash       // For integrity verification
   fileMetadata.mimeType   // The validated MIME type
   fileMetadata.fileSize   // File size in bytes
   ```

3. **Use secure download headers**: When serving files, set security headers
   ```typescript
   res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
   res.setHeader('X-Content-Type-Options', 'nosniff');
   ```

4. **Verify file integrity**: When serving files, verify their integrity
   ```typescript
   const fileData = await fs.promises.readFile(filePath);
   const currentHash = crypto.createHash('sha256').update(fileData).digest('hex');
   
   if (currentHash !== storedHash) {
     // File has been modified, potential security issue
     logSecurityEvent('FILE_INTEGRITY_FAILURE', { filePath, storedHash, currentHash });
     return res.status(400).send('File integrity check failed');
   }
   ```

5. **Implement quota checks**: Prevent abuse with custom quota checks
   ```typescript
   // Before validating the file
   const userUploadsToday = await getUserUploadCount(userId, { period: 'day' });
   if (userUploadsToday >= config.quotaConfig.maxDailyUploads) {
     return res.status(429).json({ error: 'Daily upload limit reached' });
   }
   ```

## Common File Upload Patterns

### Handling multiple files

```typescript
app.post('/api/upload/multiple', async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const results = [];
    const errors = [];
    
    // Handle files as an array
    const files = Array.isArray(req.files.files) 
      ? req.files.files 
      : [req.files.files];
    
    for (const file of files) {
      try {
        const { sanitizedFileName, fileMetadata } = await validateUploadedFile(file, {
          allowedCategories: ['image', 'document'],
          userId: req.user?.id
        });
        
        const uploadPath = path.join('./uploads/gallery', sanitizedFileName);
        await file.mv(uploadPath);
        
        results.push({ 
          originalName: file.name,
          savedAs: sanitizedFileName,
          size: fileMetadata.fileSize,
          type: fileMetadata.mimeType
        });
      } catch (fileError) {
        errors.push({
          filename: file.name,
          error: fileError instanceof Error ? fileError.message : 'Validation failed'
        });
      }
    }
    
    return res.status(200).json({ results, errors });
  } catch (error) {
    return res.status(500).json({ error: 'File upload processing failed' });
  }
});
```

### Custom file type validation

```typescript
// For specialized validation needs
const { sanitizedFileName, fileMetadata } = await validateUploadedFile(file, {
  // Allow only audio files
  allowedCategories: ['audio'],
  
  // Validation context for metadata
  context: 'podcast-upload',
  userId: req.user?.id,
  
  // Skip malware scan for audio (if needed)
  skipMalwareScan: true
});

// Custom secondary validation
if (fileMetadata.mimeType === 'audio/mpeg' && file.size > 20 * 1024 * 1024) {
  throw new Error('MP3 files must be under 20MB');
}
```

## Testing File Upload Security

Run the security test suite to verify your configuration:

```bash
node scripts/test-file-upload-security.js
```

Check upload directory security:

```bash
node scripts/check-upload-security.js
```

## Troubleshooting Common Issues

### Error: "File contents do not match declared type"

This error occurs when the file's actual content doesn't match its claimed MIME type. The solution:

1. Ensure the file isn't corrupted
2. Verify the client isn't attempting to manipulate the file type
3. Consider adding the detected MIME type to your allowed types if legitimate

### Error: "File extension is not allowed"

The uploaded file has an extension not in the allowed list. The solution:

1. Check the `allowedExtensions` configuration
2. Add the extension if it's legitimately needed for your use case
3. Verify the client isn't using unusual file extensions

### Error: "Filename matches disallowed pattern"

The filename contains potentially dangerous patterns. The solution:

1. Use a simpler filename without special characters
2. Check for path traversal attempts (`../`, etc.)
3. Remove any potential command injection characters