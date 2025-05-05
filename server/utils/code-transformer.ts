/**
 * Code Transformer
 * 
 * Provides a secure and reliable way to transform TypeScript code
 * with appropriate safeguards, validation, and source mapping.
 * 
 * Features:
 * - Open source: Uses standard TypeScript APIs
 * - Secure: Validates transformations before applying
 * - Private: All code processing happens locally
 * - Auditable: Maintains detailed logs of all transformations
 * - Reversible: Supports rollback of changes
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../logger';

/**
 * Source file edit representation
 */
export interface SourceFileEdit {
  filePath: string;
  start: number;
  end: number;
  newText: string;
  description: string;
}

/**
 * Source position mapping before and after transformation
 */
export interface SourceMap {
  originalPosition: {
    line: number;
    column: number;
    offset: number;
  };
  newPosition: {
    line: number;
    column: number;
    offset: number;
  };
}

/**
 * High-level transformation description
 */
export interface Transformation {
  id: string;
  description: string;
  edits: SourceFileEdit[];
  sourceFile: string;
}

/**
 * Result of a transformation
 */
export interface TransformResult {
  success: boolean;
  transformation: Transformation;
  appliedEdits: SourceFileEdit[];
  newSourceText?: string;
  backupPath?: string;
  sourceMap?: SourceMap[];
  error?: string;
  validationErrors?: string[];
}

/**
 * Line endings normalization
 */
const normalizeLineEndings = (text: string): string => {
  return text.replace(/\r\n/g, '\n');
};

/**
 * Safe code transformer that handles TypeScript code modifications
 */
export class CodeTransformer {
  private backupDir: string;
  private transformationLog: TransformResult[] = [];
  
  constructor(private rootDir: string = process.cwd()) {
    this.backupDir = path.join(this.rootDir, '.ts-backups');
    this.ensureBackupDirExists();
    logger.info('CodeTransformer initialized');
  }
  
  /**
   * Apply a single edit to a file
   */
  async applyEdit(edit: SourceFileEdit): Promise<TransformResult> {
    const filePath = path.join(this.rootDir, edit.filePath);
    
    try {
      // Validate input
      await this.validateFilePath(filePath);
      
      // Create unique transformation ID and backup
      const transformationId = `transform_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const backupPath = await this.createBackup(filePath, transformationId);
      
      // Read the file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const normalizedContent = normalizeLineEndings(fileContent);
      
      // Check if edit positions are within bounds
      this.validateEditBounds(normalizedContent, edit);
      
      // Apply the edit
      const newContent = 
        normalizedContent.substring(0, edit.start) + 
        edit.newText + 
        normalizedContent.substring(edit.end);
      
      // Create source mapping
      const sourceMap = this.createSourceMap(normalizedContent, newContent, edit);
      
      // Validate the result is parseable TypeScript
      const validationResult = this.validateTypeScript(newContent, filePath);
      if (!validationResult.valid) {
        logger.warn(`Transformation validation failed: ${validationResult.errors.join(', ')}`);
        return {
          success: false,
          transformation: {
            id: transformationId,
            description: edit.description,
            edits: [edit],
            sourceFile: edit.filePath
          },
          appliedEdits: [],
          validationErrors: validationResult.errors,
          error: 'Transformation validation failed'
        };
      }
      
      // Write the transformed content
      await fs.writeFile(filePath, newContent, 'utf-8');
      
      // Log the transformation
      const result: TransformResult = {
        success: true,
        transformation: {
          id: transformationId,
          description: edit.description,
          edits: [edit],
          sourceFile: edit.filePath
        },
        appliedEdits: [edit],
        newSourceText: newContent,
        backupPath,
        sourceMap
      };
      
      this.transformationLog.push(result);
      logger.info(`Applied transformation ${transformationId} to ${edit.filePath}`);
      
      return result;
    } catch (error) {
      logger.error(`Error applying edit to ${edit.filePath}: ${error.message}`);
      return {
        success: false,
        transformation: {
          id: `failed_${Date.now()}`,
          description: edit.description,
          edits: [edit],
          sourceFile: edit.filePath
        },
        appliedEdits: [],
        error: error.message
      };
    }
  }
  
  /**
   * Apply multiple edits as an atomic transaction
   */
  async applyTransformation(transformation: Transformation): Promise<TransformResult> {
    // Group edits by file
    const editsByFile: Record<string, SourceFileEdit[]> = {};
    for (const edit of transformation.edits) {
      if (!editsByFile[edit.filePath]) {
        editsByFile[edit.filePath] = [];
      }
      editsByFile[edit.filePath].push(edit);
    }
    
    const backups: string[] = [];
    const appliedEdits: SourceFileEdit[] = [];
    
    try {
      // Create backups for all files
      for (const filePath of Object.keys(editsByFile)) {
        const absolutePath = path.join(this.rootDir, filePath);
        const backupPath = await this.createBackup(absolutePath, transformation.id);
        backups.push(backupPath);
      }
      
      // Apply edits to each file
      for (const [filePath, edits] of Object.entries(editsByFile)) {
        const absolutePath = path.join(this.rootDir, filePath);
        
        // Read file content
        let fileContent = await fs.readFile(absolutePath, 'utf-8');
        fileContent = normalizeLineEndings(fileContent);
        
        // Sort edits in reverse order to avoid position shifting
        const sortedEdits = [...edits].sort((a, b) => b.start - a.start);
        
        // Apply each edit
        for (const edit of sortedEdits) {
          this.validateEditBounds(fileContent, edit);
          
          // Apply the edit
          fileContent = 
            fileContent.substring(0, edit.start) + 
            edit.newText + 
            fileContent.substring(edit.end);
          
          appliedEdits.push(edit);
        }
        
        // Validate the resulting TypeScript
        const validationResult = this.validateTypeScript(fileContent, filePath);
        if (!validationResult.valid) {
          // Restore all backups on failure
          for (const backupPath of backups) {
            await this.restoreBackup(backupPath);
          }
          
          return {
            success: false,
            transformation,
            appliedEdits: [],
            validationErrors: validationResult.errors,
            error: `TypeScript validation failed for ${filePath}`
          };
        }
        
        // Write the transformed content
        await fs.writeFile(absolutePath, fileContent, 'utf-8');
      }
      
      // Log the successful transformation
      const result: TransformResult = {
        success: true,
        transformation,
        appliedEdits,
        backupPath: backups.join(';')
      };
      
      this.transformationLog.push(result);
      logger.info(`Applied transformation ${transformation.id} to ${Object.keys(editsByFile).length} files`);
      
      return result;
    } catch (error) {
      // Restore all backups on error
      logger.error(`Error applying transformation: ${error.message}`);
      
      for (const backupPath of backups) {
        try {
          await this.restoreBackup(backupPath);
        } catch (restoreError) {
          logger.error(`Error restoring backup ${backupPath}: ${restoreError.message}`);
        }
      }
      
      return {
        success: false,
        transformation,
        appliedEdits: [],
        error: `Transformation failed: ${error.message}`
      };
    }
  }
  
  /**
   * Undo a previous transformation using its backup
   */
  async undoTransformation(transformationId: string): Promise<boolean> {
    const transformation = this.transformationLog.find(t => t.transformation.id === transformationId);
    
    if (!transformation || !transformation.backupPath) {
      logger.warn(`No backup found for transformation ${transformationId}`);
      return false;
    }
    
    try {
      if (transformation.backupPath.includes(';')) {
        // Multiple backups
        const backupPaths = transformation.backupPath.split(';');
        for (const backupPath of backupPaths) {
          await this.restoreBackup(backupPath);
        }
      } else {
        // Single backup
        await this.restoreBackup(transformation.backupPath);
      }
      
      logger.info(`Undid transformation ${transformationId}`);
      return true;
    } catch (error) {
      logger.error(`Error undoing transformation ${transformationId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Ensure the backup directory exists
   */
  private async ensureBackupDirExists(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }
  
  /**
   * Create a backup of a file before transformation
   */
  private async createBackup(filePath: string, transformId: string): Promise<string> {
    const fileName = path.basename(filePath);
    const backupPath = path.join(
      this.backupDir, 
      `${fileName}.${transformId}.${Date.now()}.bak`
    );
    
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  }
  
  /**
   * Restore a file from a backup
   */
  private async restoreBackup(backupPath: string): Promise<void> {
    // Extract original filename from backup name
    const backupName = path.basename(backupPath);
    const origFileName = backupName.split('.')[0];
    
    // Calculate original file path
    const originalDir = path.dirname(backupPath)
      .replace(this.backupDir, this.rootDir);
    
    const originalPath = path.join(originalDir, origFileName);
    
    // Restore the file
    await fs.copyFile(backupPath, originalPath);
  }
  
  /**
   * Validate that an edit's positions are within the file bounds
   */
  private validateEditBounds(content: string, edit: SourceFileEdit): void {
    if (edit.start < 0 || edit.start > content.length) {
      throw new Error(`Edit start position ${edit.start} out of bounds for file ${edit.filePath}`);
    }
    
    if (edit.end < edit.start || edit.end > content.length) {
      throw new Error(`Edit end position ${edit.end} out of bounds for file ${edit.filePath}`);
    }
  }
  
  /**
   * Validate that a file path is safe (no path traversal, etc.)
   */
  private async validateFilePath(filePath: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    const relativePath = path.relative(this.rootDir, normalizedPath);
    
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Invalid file path: ${filePath} (outside root directory)`);
    }
    
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }
  }
  
  /**
   * Create a source map for a transformation
   */
  private createSourceMap(
    originalContent: string, 
    newContent: string, 
    edit: SourceFileEdit
  ): SourceMap[] {
    // This is a simplified implementation
    // A real implementation would calculate line/column mapping for the entire file
    
    // Find line and column for positions
    const findLineAndColumn = (text: string, offset: number) => {
      const lines = text.substr(0, offset).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      return { line, column, offset };
    };
    
    const originalStart = findLineAndColumn(originalContent, edit.start);
    const originalEnd = findLineAndColumn(originalContent, edit.end);
    
    // Calculate the new end position based on the text replacement
    const newEnd = {
      offset: edit.start + edit.newText.length,
      ...findLineAndColumn(
        originalContent.substring(0, edit.start) + edit.newText, 
        edit.start + edit.newText.length
      )
    };
    
    return [
      {
        originalPosition: originalStart,
        newPosition: originalStart // Start position doesn't change
      },
      {
        originalPosition: originalEnd,
        newPosition: newEnd
      }
    ];
  }
  
  /**
   * Validate that the transformed TypeScript code is parseable
   */
  private validateTypeScript(content: string, filePath: string): { valid: boolean; errors: string[] } {
    try {
      // Parse the file
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Check for syntax errors
      const syntaxErrors = this.getSyntaxErrors(sourceFile);
      
      if (syntaxErrors.length > 0) {
        return {
          valid: false,
          errors: syntaxErrors
        };
      }
      
      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to parse TypeScript: ${error.message}`]
      };
    }
  }
  
  /**
   * Get syntax errors from a TypeScript source file
   */
  private getSyntaxErrors(sourceFile: ts.SourceFile): string[] {
    const errors: string[] = [];
    
    // For complete validation, we would use the TypeScript compiler API
    // to check the file for semantic errors as well, but that requires
    // a program instance with project configuration
    
    // This is a basic syntax check
    const visitNode = (node: ts.Node) => {
      if (node.getSourceFile().parseDiagnostics.length > 0) {
        for (const diag of node.getSourceFile().parseDiagnostics) {
          const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
          errors.push(message);
        }
      }
      
      ts.forEachChild(node, visitNode);
    };
    
    visitNode(sourceFile);
    return errors;
  }
}