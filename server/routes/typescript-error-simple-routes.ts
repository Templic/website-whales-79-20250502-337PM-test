/**
 * @file typescript-error-simple-routes.ts
 * @description Simplified API routes for TypeScript error management with basic endpoints
 */

import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

/**
 * A simple test route to verify the API is working
 * 
 * @route GET /api/typescript-simple/test
 */
router.get('/test', async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'TypeScript error management API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get basic project information without heavy analysis
 * 
 * @route POST /api/typescript-simple/project-info
 */
router.post('/project-info', async (req, res) => {
  try {
    const { projectRoot } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Find tsconfig.json
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const hasTsconfig = fs.existsSync(tsconfigPath);
    
    // Count TypeScript files (limited to avoid heavy processing)
    const tsFiles = [];
    const maxFilesToCheck = 100;
    let fileCount = 0;
    
    function countTsFiles(dir: string, depth = 0) {
      if (depth > 3 || fileCount >= maxFilesToCheck) return;
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          if (fileCount >= maxFilesToCheck) break;
          
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            countTsFiles(filePath, depth + 1);
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            tsFiles.push(filePath);
            fileCount++;
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
    }
    
    countTsFiles(projectRoot);
    
    return res.json({
      success: true,
      tsconfigExists: hasTsconfig,
      typeScriptFiles: fileCount,
      limitReached: fileCount >= maxFilesToCheck,
      fileList: tsFiles.slice(0, 10) // Return only the first 10 files
    });
  } catch (error) {
    console.error('Error getting project info:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check status of a specific TypeScript file
 * 
 * @route POST /api/typescript-simple/file-info
 */
router.post('/file-info', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    // Validate required parameters
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Check if the file exists
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lineCount = fileContent.split('\n').length;
    
    // Count imports
    const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:[^{][^;]*))(?:from\s+)?['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      imports.push(match[1]);
    }
    
    // Count simple errors - just as a demonstration
    const simpleProblemCount = {
      anyType: (fileContent.match(/:\s*any\b/g) || []).length,
      implicitAny: (fileContent.match(/function\s+\w+\s*\([^:)]*\)/g) || []).length,
      unusedImports: 0, // Would require more complex analysis
      noReturn: 0 // Would require more complex analysis
    };
    
    return res.json({
      success: true,
      fileName: path.basename(filePath),
      lineCount,
      size: fileContent.length,
      imports: imports.length,
      uniqueImports: [...new Set(imports)].length,
      simpleProblemCount,
      firstFewLines: fileContent.split('\n').slice(0, 5).join('\n')
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;