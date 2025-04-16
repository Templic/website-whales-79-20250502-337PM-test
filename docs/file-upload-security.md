# Enhanced File Upload Security Implementation

This document describes the comprehensive file upload security features implemented in the application to protect against common vulnerabilities and security risks.

## Overview

File uploads present significant security risks to web applications, including:

1. Path traversal attacks
2. Malicious file uploads and malware
3. Unrestricted content type execution
4. File size abuse and denial of service
5. MIME type spoofing
6. Server-side request forgery
7. Null byte injection
8. Temporary file exposure
9. Metadata leakage
10. ZIP bombs and decompression attacks

Our implementation addresses these concerns through a multi-layered, defense-in-depth security approach.

## Core Security Features

### Content-Based File Type Validation

Unlike implementations that rely solely on file extensions, our system validates files based on their actual content:

- Uses the `file-type` package to detect MIME types based on file content signatures
- Prevents attackers from disguising executable files as harmless content
- Ensures uploaded files contain valid data matching their claimed type
- Rejects files with content-type mismatches (even if both types are allowed)

### Advanced Secure Filename Handling

The system implements comprehensive filename security measures:

- Cryptographically secure random filenames to prevent predictable storage paths
- Advanced path traversal protection with multi-layered defenses
- Pattern-based filename validation against known dangerous patterns
- Strict extension validation against category-specific allowed lists
- Active protection against null byte injection attacks
- Option to completely randomize filenames for maximum security

### Multi-Tiered Size Validation

Comprehensive protections against size-related attacks:

- Enforces configurable minimum and maximum file size limits
- Prevents empty file uploads that could be used for probing attacks
- Returns clear error messages with size limits for better UX
- Aborts large uploads early to conserve server resources
- Per-user and per-category quota management

### MIME Type Verification with Deep Inspection

Our implementation uses a sophisticated approach to MIME type security:

- Validates MIME types against configurable allowed lists by category
- Performs content-based MIME type detection on file data
- Compares claimed MIME type with detected content type
- Implements special validation for high-risk file types (SVG, PDF)
- Content structure validation for specific file formats
- Rejects files where content doesn't match the claimed type

### Enhanced Malware Protection

The system includes multi-layered malware detection:

- Optional integration with ClamAV for virus scanning
- Hash-based file reputation checking
- Signature-based detection for known malicious patterns
- Extension blocking for high-risk file types
- Quarantine functionality for suspicious files

### Comprehensive Error Handling and Logging

The system includes robust error handling and security auditing:

- Detailed security event logging for all upload attempts
- File upload metadata tracking with security check results
- Structured error responses with specific failure reasons
- Null safety checks to prevent runtime errors
- Security event tracking for both successful and failed uploads
- Log rotation and secure storage

### Temporary File Management

Protection against temporary file exploits:

- Automatic cleanup of temporary files
- Configurable age-based file removal
- Secure temporary directory permissions
- Path validation for all file operations
- No reliance on predictable names or paths

## Advanced Security Features

### File Metadata and Integrity Tracking

The system maintains comprehensive metadata for uploaded files:

```typescript
export interface SecurityFileMetadata {
  hash: string;                 // SHA-256 hash of file contents
  fileSize: number;             // File size in bytes
  mimeType: string;             // Detected MIME type
  extension: string;            // File extension
  uploadedAt: Date;             // Upload timestamp
  securityChecks: {             // Results of security checks
    contentVerified: boolean;   // Content matches declared type
    malwareScanResult: string;  // 'clean', 'infected', or 'skipped'
    sensitiveContentDetected: boolean; // If applicable
  };
}
```

### Rate Limiting and Quota Management

Protection against abuse and denial of service:

```typescript
export interface UploadQuotaConfig {
  maxDailyUploads: number;      // Maximum uploads per day per user
  maxWeeklyStorageBytes: number; // Maximum bytes per week per user
  cooldownPeriodMs: number;     // Milliseconds between uploads
  burstLimit: number;           // Max uploads in a short time period
  burstWindowMs: number;        // Window for burst detection
}
```

### Defense in Depth Strategy

The implementation follows a comprehensive defense-in-depth approach:

- Multiple independent validation layers (filename, extension, content, size, etc.)
- Context-aware validation customized to upload purpose
- Proper file storage permissions and ownership
- Upload directory path validation and protection
- Disallowed pattern checking across multiple parameters
- File quarantine for suspicious content

## Implementation Details

### Key Files

- `server/security/fileUploadSecurity.ts`: Core security module
- `server/routes/media.ts`: Integration of security features in routes
- `scripts/test-file-upload-security.js`: Test suite for security features
- `scripts/check-upload-security.js`: Directory security verification tool

### Enhanced Configuration

The file upload security module supports advanced configuration:

```typescript
interface FileUploadSecurityConfig {
  maxFileSize: number;          // Maximum file size in bytes
  minFileSize: number;          // Minimum file size in bytes
  allowedFileTypes: {           // Allowed file types by category
    image: string[];            // Allowed image MIME types
    video: string[];            // Allowed video MIME types
    audio: string[];            // Allowed audio MIME types
    document: string[];         // Allowed document MIME types
    other: string[];            // Allowed other MIME types
  };
  allowedExtensions: {          // Allowed file extensions by category
    image: string[];            // Allowed image extensions
    video: string[];            // Allowed video extensions
    audio: string[];            // Allowed audio extensions
    document: string[];         // Allowed document extensions
    other: string[];            // Allowed other extensions
  };
  disallowedPatterns: string[]; // Regex patterns to block in filenames
  scanForMalware: boolean;      // Whether to scan for malware
  clamAVScanEndpoint?: string;  // ClamAV scanning endpoint
  validateSvgContent: boolean;  // Deep inspection of SVG files
  validateImageMetadata: boolean; // Check for EXIF metadata issues
  sanitizePdfs: boolean;        // Remove scripts from PDFs
  secureRandomFilenames: boolean; // Use crypto-secure random names
  logAllUploads: boolean;       // Log all uploads for auditing
  quarantineSuspiciousFiles: boolean; // Move suspicious files to quarantine
  quotaConfig: UploadQuotaConfig; // Rate limiting configuration
  tempFileCleanupAgeSecs: number; // Age in seconds to clean temporary files
}
```

## Testing and Verification

### Security Test Suite

Use the provided test script to verify security features:

```bash
# Run the security test suite
node scripts/test-file-upload-security.js

# Check upload directory security
node scripts/check-upload-security.js
```

The comprehensive test suite includes cases for:

- Valid uploads (should pass)
- Path traversal attempts with multiple techniques
- Executable files disguised as images
- Files with double extensions and nested extensions
- Null byte injection attempts
- Empty files and oversized files
- MIME type spoofing with manipulated headers
- Malformed file content
- Embedded malicious content
- SVG with script injection

### Upload Directory Verification

The directory security checker validates:

- Directory existence and proper permissions
- Symbolic link protections
- Path traversal vulnerability detection
- Security of parent directories

## Best Practices for Developers

1. Always use the `validateUploadedFile` function for all file uploads
2. Never trust client-provided filenames or MIME types
3. Always validate file contents before storing and processing them
4. Implement proper error handling to catch and report security issues
5. Specify allowed file categories and types for each upload context
6. Store the security metadata returned by the validation function
7. Check the security logs for suspicious upload patterns
8. Combine upload validation with proper download security (content-disposition headers)
9. Set appropriate file permissions on uploaded files
10. Implement context-specific validation for special file types

## Security Features Already Implemented

1. ✅ Content-based file type validation
2. ✅ Secure random filename generation
3. ✅ Comprehensive MIME type verification
4. ✅ Multi-layered path traversal protection
5. ✅ Minimum and maximum file size validation
6. ✅ File hash computation for integrity checking
7. ✅ Detailed security logging and auditing
8. ✅ Upload metadata tracking and storage
9. ✅ Pattern-based filename blocking
10. ✅ Temporary file automatic cleanup
11. ✅ Upload directory security verification
12. ✅ Quota and rate limiting configuration
13. ✅ File quarantine capabilities

## Implementation Examples

### Sample Upload Route Implementation

Here's an example of how to implement a secure file upload route using the enhanced security module:

```typescript
// api/upload.ts
import { Router } from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { validateUploadedFile } from '../security/fileUploadSecurity';
import { requireAuth } from '../middleware/auth';
import { logSecurityEvent } from '../security/logging';

const router = Router();

// Configure express-fileupload middleware
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit as first defense
  useTempFiles: true,
  tempFileDir: './tmp/uploads/',
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Secure profile image upload endpoint
router.post('/profile-image', requireAuth, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    const file = req.files.image as fileUpload.UploadedFile;
    
    // Perform comprehensive security validation
    const { sanitizedFileName, fileMetadata } = await validateUploadedFile(file, {
      // Only allow image files for profile pictures
      allowedCategories: ['image'],
      // Add user context for security logs
      userId: req.user.id,
      context: 'profile-image-upload'
    });
    
    // Create user uploads directory if needed
    const userDir = path.join('./uploads/images/profiles', req.user.id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Use the sanitized filename to save the file
    const uploadPath = path.join(userDir, sanitizedFileName);
    await file.mv(uploadPath);
    
    // Store the file metadata in the database
    await db.imageMetadata.create({
      data: {
        userId: req.user.id,
        filePath: uploadPath,
        fileHash: fileMetadata.hash,
        fileSize: fileMetadata.fileSize,
        mimeType: fileMetadata.mimeType,
        uploadedAt: fileMetadata.uploadedAt
      }
    });
    
    // Log successful upload for audit purposes
    logSecurityEvent('FILE_UPLOAD_SUCCESS', {
      userId: req.user.id,
      filePath: uploadPath,
      fileType: fileMetadata.mimeType,
      fileSize: fileMetadata.fileSize,
      securityChecks: fileMetadata.securityChecks,
      severity: 'info'
    });
    
    return res.status(200).json({
      success: true,
      fileName: sanitizedFileName,
      fileUrl: `/images/profiles/${req.user.id}/${sanitizedFileName}`
    });
  } catch (error) {
    // Log security failures for audit purposes
    logSecurityEvent('FILE_UPLOAD_FAILURE', {
      userId: req.user?.id || 'anonymous',
      error: error instanceof Error ? error.message : String(error),
      severity: 'warning'
    });
    
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed'
    });
  }
});

export default router;
```

### Secure File Download Implementation

Here's a secure implementation of a file download route that complements the security features:

```typescript
// api/download.ts
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { isPathSafe } from '../security/fileUploadSecurity';
import { requireAuth } from '../middleware/auth';
import { logSecurityEvent } from '../security/logging';

const router = Router();

// Secure file download endpoint
router.get('/file/:fileId', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // Get file metadata from database
    const fileMetadata = await db.fileMetadata.findUnique({
      where: { id: fileId },
      include: { owner: true }
    });
    
    if (!fileMetadata) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check user permission to access the file
    if (fileMetadata.owner.id !== req.user.id && !req.user.isAdmin) {
      logSecurityEvent('FILE_ACCESS_DENIED', {
        userId: req.user.id,
        fileId: fileId,
        reason: 'Unauthorized access attempt',
        severity: 'medium'
      });
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const filePath = fileMetadata.filePath;
    
    // Verify path is safe (no path traversal)
    if (!isPathSafe(filePath, './uploads')) {
      logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', {
        userId: req.user.id,
        path: filePath,
        severity: 'high'
      });
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    // Verify file integrity by checking the hash (optional)
    const fileBuffer = fs.readFileSync(filePath);
    const currentHash = crypto.createHash('sha256')
      .update(fileBuffer)
      .digest('hex');
    
    if (currentHash !== fileMetadata.fileHash) {
      logSecurityEvent('FILE_INTEGRITY_FAILURE', {
        userId: req.user.id,
        fileId: fileId,
        expectedHash: fileMetadata.fileHash,
        actualHash: currentHash,
        severity: 'high'
      });
      return res.status(400).json({ error: 'File integrity check failed' });
    }
    
    // Set secure headers
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(filePath))}"`);
    res.setHeader('Content-Type', fileMetadata.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Send the file
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    logSecurityEvent('FILE_DOWNLOAD_FAILURE', {
      userId: req.user?.id || 'anonymous',
      error: error instanceof Error ? error.message : String(error),
      severity: 'warning'
    });
    
    return res.status(500).json({
      success: false,
      error: 'File download failed'
    });
  }
});

export default router;
```

## Security Auditing and Monitoring

The file upload security module integrates with the application's security monitoring system to provide comprehensive auditing capabilities:

### Security Event Logging

```typescript
// Sample of security events logged by the file upload module
interface FileSecurityEvent {
  type: string;           // Event type (e.g., 'FILE_UPLOAD_ATTEMPT', 'FILE_VALIDATION_FAILURE')
  timestamp: Date;        // When the event occurred
  userId: string|number;  // User who triggered the event
  ipAddress?: string;     // IP address of the request
  userAgent?: string;     // User agent of the request
  filePath?: string;      // Path to the file (if applicable)
  fileName?: string;      // Original file name
  fileSize?: number;      // File size in bytes
  mimeType?: string;      // File MIME type
  validationResult?: {    // Validation result details
    passed: boolean;      // Whether validation passed
    failureReason?: string; // Why validation failed
    securityChecks: any;  // Details of security checks performed
  };
  metadata?: any;         // Additional event-specific metadata
  severity: 'low' | 'medium' | 'high' | 'critical'; // Event severity
}
```

### Regular Security Scans

Set up recurring security scans to verify the integrity of uploaded files:

```typescript
// Example of scheduled security scan
async function scheduledFileScan() {
  const recentUploads = await db.fileMetadata.findMany({
    where: {
      uploadedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    take: 100
  });
  
  for (const file of recentUploads) {
    try {
      // Verify file still exists
      if (!fs.existsSync(file.filePath)) {
        await logMissingFileEvent(file);
        continue;
      }
      
      // Check file integrity
      const fileBuffer = fs.readFileSync(file.filePath);
      const currentHash = crypto.createHash('sha256')
        .update(fileBuffer)
        .digest('hex');
      
      if (currentHash !== file.fileHash) {
        await logFileModificationEvent(file, currentHash);
      }
      
      // Check for malware (if configured)
      if (config.enableMalwareScan) {
        const scanResult = await scanForMalware(file.filePath);
        if (scanResult.infected) {
          await quarantineFile(file, scanResult);
        }
      }
    } catch (error) {
      // Log scan errors
      console.error(`Error scanning file ${file.id}: ${error}`);
    }
  }
}
```

## Future Security Enhancements

Potential future security improvements include:

1. **Machine Learning-Based Detection**:
   - Implement anomaly detection to identify unusual upload patterns
   - Train models to detect potentially malicious files beyond signature matching
   - Detect suspicious visual content in uploaded images

2. **Advanced Content Sanitization**:
   - Deep inspection of PDF contents to remove embedded JavaScript
   - SVG sanitization to strip potentially malicious elements
   - Office document macro analysis and removal
   - HTML content sanitization for user-generated content

3. **Threat Intelligence Integration**:
   - Connect with file reputation services to check known-bad file hashes
   - Implement real-time threat feeds for emerging file-based attacks
   - Use YARA rules for advanced pattern matching in uploads

4. **Content Analysis and Filtering**:
   - Image analysis for inappropriate content detection
   - Document classification to enforce content policies
   - Audio/video content inspection

5. **Enhanced Monitoring and Defense**:
   - User behavioral analysis to detect upload abuse patterns
   - Adaptive rate limiting based on user trust scores
   - On-demand rescanning of previously uploaded files
   - Metadata stripping from uploaded images and documents
   - Comprehensive audit trails for all file operations