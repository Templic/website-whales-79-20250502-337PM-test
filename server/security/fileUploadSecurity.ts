/**
 * File Upload Security Module
 * 
 * This module provides functions and utilities for securing file upload
 * operations and preventing related vulnerabilities.
 * 
 * Key features:
 * - File type validation
 * - File size limitations
 * - Filename sanitization
 * - MIME type verification
 * - Path traversal prevention
 * - Malware scanning (using ClamAV if available)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { log } from '../vite';
import { fileTypeFromBuffer } from 'file-type';
import fileUpload from 'express-fileupload';

// Configuration
interface FileUploadSecurityConfig {
  maxFileSize: number;          // Maximum file size in bytes
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
  scanForMalware: boolean;      // Whether to scan for malware
  clamAVScanEndpoint?: string;  // ClamAV scanning endpoint
}

// Default configuration
const defaultConfig: FileUploadSecurityConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'],
    audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/x-ms-wma'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    other: []
  },
  allowedExtensions: {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    video: ['mp4', 'mpeg', 'mov', 'avi', 'wmv'],
    audio: ['mp3', 'mp4', 'wav', 'aac', 'flac', 'wma'],
    document: ['pdf', 'doc', 'docx'],
    other: []
  },
  scanForMalware: true,
  clamAVScanEndpoint: 'http://localhost:3310/scan' // Default ClamAV endpoint
};

// Configuration instance
let config = { ...defaultConfig };

/**
 * Set the configuration for file upload security
 * @param userConfig User-defined configuration
 */
export function setFileUploadSecurityConfig(userConfig: Partial<FileUploadSecurityConfig>): void {
  config = { ...defaultConfig, ...userConfig };
  log('File upload security configuration updated', 'security');
}

/**
 * Validate file size
 * @param file The uploaded file
 * @throws Error if file size exceeds limit
 */
export function validateFileSize(file: fileUpload.UploadedFile): void {
  if (file.size > config.maxFileSize) {
    const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
    throw new Error(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
  }
}

/**
 * Validate file type
 * @param file The uploaded file
 * @param allowedCategories Categories of allowed file types
 * @throws Error if file type is not allowed
 */
export async function validateFileType(
  file: fileUpload.UploadedFile, 
  allowedCategories: ('image' | 'video' | 'audio' | 'document' | 'other')[] = ['image', 'video', 'audio', 'document', 'other']
): Promise<void> {
  // Get file extension from filename
  const fileExtension = path.extname(file.name).toLowerCase().substring(1);
  
  // Validate file extension
  const isExtensionValid = allowedCategories.some(category => 
    config.allowedExtensions[category].includes(fileExtension)
  );
  
  if (!isExtensionValid) {
    throw new Error(`File extension '${fileExtension}' is not allowed`);
  }
  
  // Validate file MIME type
  const declaredMimeType = file.mimetype;
  const isTypeDeclaredValid = allowedCategories.some(category => 
    config.allowedFileTypes[category].includes(declaredMimeType)
  );
  
  if (!isTypeDeclaredValid) {
    throw new Error(`File type '${declaredMimeType}' is not allowed`);
  }
  
  // For extra security, verify file content matches extension and MIME type
  try {
    const buffer = file.data.slice(0, 4100); // Get first 4100 bytes for type detection
    const fileTypeResult = await fileTypeFromBuffer(buffer);
    
    if (fileTypeResult) {
      const actualMimeType = fileTypeResult.mime;
      const isTypeActualValid = allowedCategories.some(category => 
        config.allowedFileTypes[category].includes(actualMimeType)
      );
      
      if (!isTypeActualValid) {
        throw new Error(`File contents (${actualMimeType}) do not match declared type (${declaredMimeType})`);
      }
      
      // Check if declared MIME type matches actual content
      if (actualMimeType !== declaredMimeType) {
        throw new Error(`Declared file type (${declaredMimeType}) does not match actual file content (${actualMimeType})`);
      }
    }
    // If fileTypeResult is null, it might be a text file or unsupported format
    // In that case, rely on the declared MIME type (already validated above)
  } catch (error) {
    if (error instanceof Error && error.message.includes('File contents')) {
      throw error;
    }
    // If error occurs during detection, log it but continue with validation
    log(`Error during file content type validation: ${error instanceof Error ? error.message : error}`, 'error');
  }
}

/**
 * Sanitize a filename to prevent path traversal and ensure safe storage
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFileName(filename: string): string {
  // Remove any directory components
  let sanitized = path.basename(filename);
  
  // Replace potentially dangerous characters
  sanitized = sanitized.replace(/[^\w\s.-]/g, '_');
  
  // Add a unique identifier to prevent file overwrites
  const fileExt = path.extname(sanitized);
  const fileBase = path.basename(sanitized, fileExt);
  const uniqueId = crypto.randomBytes(4).toString('hex');
  
  return `${fileBase}_${uniqueId}${fileExt}`;
}

/**
 * Scan file for malware using ClamAV if available
 * @param file The uploaded file
 * @throws Error if malware is detected or scanning fails
 */
export async function scanFileForMalware(file: fileUpload.UploadedFile): Promise<void> {
  if (!config.scanForMalware) {
    return; // Scanning is disabled
  }
  
  try {
    // Check if ClamAV endpoint is configured
    if (!config.clamAVScanEndpoint) {
      log('ClamAV scan endpoint not configured, skipping malware scan', 'warning');
      return;
    }
    
    log(`Scanning file ${file.name} for malware...`, 'security');
    
    // Prepare the request to ClamAV
    const formData = new FormData();
    const blob = new Blob([file.data], { type: file.mimetype });
    formData.append('file', blob, file.name);
    
    // Send file to ClamAV for scanning
    const response = await fetch(config.clamAVScanEndpoint, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`ClamAV scan failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Check scan result
    if (result.isInfected) {
      throw new Error(`Malware detected in file: ${result.malwareName || 'Unknown malware'}`);
    }
    
    log(`File ${file.name} scanned, no malware detected`, 'security');
  } catch (error) {
    // If error is related to malware detection, rethrow it
    if (error instanceof Error && error.message.includes('Malware detected')) {
      throw error;
    }
    
    // For other errors, log warning but don't block the upload
    log(`Error during malware scanning: ${error instanceof Error ? error.message : error}`, 'warning');
    log('Continuing without malware scanning', 'warning');
  }
}

/**
 * Check if a file path is safe (no path traversal)
 * @param filePath File path to check
 * @param baseDir Base directory
 * @returns Whether the path is safe
 */
export function isPathSafe(filePath: string, baseDir: string): boolean {
  const normalizedPath = path.normalize(filePath);
  const resolvedPath = path.resolve(baseDir, normalizedPath);
  return resolvedPath.startsWith(path.resolve(baseDir));
}

/**
 * Comprehensive file security validation
 * @param file The uploaded file
 * @param options Validation options
 * @throws Error if validation fails
 */
export async function validateUploadedFile(
  file: fileUpload.UploadedFile,
  options: {
    allowedCategories?: ('image' | 'video' | 'audio' | 'document' | 'other')[];
    skipMalwareScan?: boolean;
  } = {}
): Promise<{ sanitizedFileName: string }> {
  // Validate file size
  validateFileSize(file);
  
  // Validate file type
  await validateFileType(file, options.allowedCategories);
  
  // Generate a sanitized filename
  const sanitizedFileName = sanitizeFileName(file.name);
  
  // Scan for malware if enabled and not skipped
  if (config.scanForMalware && !options.skipMalwareScan) {
    await scanFileForMalware(file);
  }
  
  return { sanitizedFileName };
}

/**
 * Initialize the file upload security module
 */
export function initFileUploadSecurity(): void {
  log('File upload security module initialized', 'security');
}