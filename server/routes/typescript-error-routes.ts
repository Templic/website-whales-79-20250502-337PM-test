import express from "express";
import { z } from "zod";
import { tsErrorStorage } from "../tsErrorStorage";
import { insertTypescriptErrorSchema, insertErrorPatternSchema, insertErrorFixSchema, insertErrorFixHistorySchema, insertProjectAnalysisSchema, insertProjectFileSchema } from "../../shared/schema";

const router = express.Router();

// TypeScript Error Routes

/**
 * @route GET /api/typescript-errors
 * @description Get all TypeScript errors with optional filtering
 */
router.get("/", async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      severity: req.query.severity as string,
      category: req.query.category as string,
      filePath: req.query.filePath as string,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const errors = await tsErrorStorage.getAllTypescriptErrors(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    res.json(errors);
  } catch (error) {
    console.error("Error fetching TypeScript errors:", error);
    res.status(500).json({ message: "Failed to fetch TypeScript errors" });
  }
});

/**
 * @route GET /api/typescript-errors/stats
 * @description Get statistics about TypeScript errors
 */
router.get("/stats", async (req, res) => {
  try {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    
    const stats = await tsErrorStorage.getTypescriptErrorStats(fromDate, toDate);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching TypeScript error statistics:", error);
    res.status(500).json({ message: "Failed to fetch error statistics" });
  }
});

/**
 * @route GET /api/typescript-errors/:id
 * @description Get a specific TypeScript error by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const error = await tsErrorStorage.getTypescriptErrorById(id);
    
    if (!error) {
      return res.status(404).json({ message: "TypeScript error not found" });
    }
    
    res.json(error);
  } catch (error) {
    console.error("Error fetching TypeScript error:", error);
    res.status(500).json({ message: "Failed to fetch error" });
  }
});

/**
 * @route POST /api/typescript-errors
 * @description Create a new TypeScript error
 */
router.post("/", async (req, res) => {
  try {
    const validatedData = insertTypescriptErrorSchema.parse(req.body);
    const newError = await tsErrorStorage.createTypescriptError(validatedData);
    res.status(201).json(newError);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating TypeScript error:", error);
    res.status(500).json({ message: "Failed to create error" });
  }
});

/**
 * @route PATCH /api/typescript-errors/:id
 * @description Update a TypeScript error
 */
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Partial validation of the request body
    const validatedData = insertTypescriptErrorSchema.partial().parse(req.body);
    
    const updatedError = await tsErrorStorage.updateTypescriptError(id, validatedData);
    res.json(updatedError);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error updating TypeScript error:", error);
    res.status(500).json({ message: "Failed to update error" });
  }
});

/**
 * @route POST /api/typescript-errors/:id/fix
 * @description Mark a TypeScript error as fixed
 */
router.post("/:id/fix", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const { fixId, userId } = req.body;
    
    if (!fixId || !userId) {
      return res.status(400).json({ message: "fixId and userId are required" });
    }
    
    const updatedError = await tsErrorStorage.markErrorAsFixed(id, fixId, userId);
    res.json(updatedError);
  } catch (error) {
    console.error("Error marking TypeScript error as fixed:", error);
    res.status(500).json({ message: "Failed to mark error as fixed" });
  }
});

// Error Pattern Routes

/**
 * @route GET /api/typescript-errors/patterns
 * @description Get all error patterns
 */
router.get("/patterns", async (req, res) => {
  try {
    const patterns = await tsErrorStorage.getAllErrorPatterns();
    res.json(patterns);
  } catch (error) {
    console.error("Error fetching error patterns:", error);
    res.status(500).json({ message: "Failed to fetch error patterns" });
  }
});

/**
 * @route GET /api/typescript-errors/patterns/:id
 * @description Get a specific error pattern by ID
 */
router.get("/patterns/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const pattern = await tsErrorStorage.getErrorPatternById(id);
    
    if (!pattern) {
      return res.status(404).json({ message: "Error pattern not found" });
    }
    
    res.json(pattern);
  } catch (error) {
    console.error("Error fetching error pattern:", error);
    res.status(500).json({ message: "Failed to fetch pattern" });
  }
});

/**
 * @route POST /api/typescript-errors/patterns
 * @description Create a new error pattern
 */
router.post("/patterns", async (req, res) => {
  try {
    const validatedData = insertErrorPatternSchema.parse(req.body);
    const newPattern = await tsErrorStorage.createErrorPattern(validatedData);
    res.status(201).json(newPattern);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating error pattern:", error);
    res.status(500).json({ message: "Failed to create pattern" });
  }
});

/**
 * @route PATCH /api/typescript-errors/patterns/:id
 * @description Update an error pattern
 */
router.patch("/patterns/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Partial validation of the request body
    const validatedData = insertErrorPatternSchema.partial().parse(req.body);
    
    const updatedPattern = await tsErrorStorage.updateErrorPattern(id, validatedData);
    res.json(updatedPattern);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error updating error pattern:", error);
    res.status(500).json({ message: "Failed to update pattern" });
  }
});

/**
 * @route GET /api/typescript-errors/patterns/category/:category
 * @description Get error patterns by category
 */
router.get("/patterns/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const patterns = await tsErrorStorage.getErrorPatternsByCategory(category);
    res.json(patterns);
  } catch (error) {
    console.error("Error fetching error patterns by category:", error);
    res.status(500).json({ message: "Failed to fetch patterns" });
  }
});

/**
 * @route GET /api/typescript-errors/patterns/auto-fixable
 * @description Get auto-fixable error patterns
 */
router.get("/patterns/auto-fixable", async (req, res) => {
  try {
    const patterns = await tsErrorStorage.getAutoFixablePatterns();
    res.json(patterns);
  } catch (error) {
    console.error("Error fetching auto-fixable patterns:", error);
    res.status(500).json({ message: "Failed to fetch auto-fixable patterns" });
  }
});

// Error Fix Routes

/**
 * @route GET /api/typescript-errors/fixes
 * @description Get all error fixes
 */
router.get("/fixes", async (req, res) => {
  try {
    const fixes = await tsErrorStorage.getAllErrorFixes();
    res.json(fixes);
  } catch (error) {
    console.error("Error fetching error fixes:", error);
    res.status(500).json({ message: "Failed to fetch error fixes" });
  }
});

/**
 * @route GET /api/typescript-errors/fixes/:id
 * @description Get a specific error fix by ID
 */
router.get("/fixes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const fix = await tsErrorStorage.getErrorFixById(id);
    
    if (!fix) {
      return res.status(404).json({ message: "Error fix not found" });
    }
    
    res.json(fix);
  } catch (error) {
    console.error("Error fetching error fix:", error);
    res.status(500).json({ message: "Failed to fetch fix" });
  }
});

/**
 * @route POST /api/typescript-errors/fixes
 * @description Create a new error fix
 */
router.post("/fixes", async (req, res) => {
  try {
    const validatedData = insertErrorFixSchema.parse(req.body);
    const newFix = await tsErrorStorage.createErrorFix(validatedData);
    res.status(201).json(newFix);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating error fix:", error);
    res.status(500).json({ message: "Failed to create fix" });
  }
});

/**
 * @route PATCH /api/typescript-errors/fixes/:id
 * @description Update an error fix
 */
router.patch("/fixes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Partial validation of the request body
    const validatedData = insertErrorFixSchema.partial().parse(req.body);
    
    const updatedFix = await tsErrorStorage.updateErrorFix(id, validatedData);
    res.json(updatedFix);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error updating error fix:", error);
    res.status(500).json({ message: "Failed to update fix" });
  }
});

/**
 * @route GET /api/typescript-errors/fixes/pattern/:patternId
 * @description Get fixes by pattern ID
 */
router.get("/fixes/pattern/:patternId", async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    if (isNaN(patternId)) {
      return res.status(400).json({ message: "Invalid pattern ID format" });
    }
    
    const fixes = await tsErrorStorage.getFixesByPatternId(patternId);
    res.json(fixes);
  } catch (error) {
    console.error("Error fetching fixes by pattern ID:", error);
    res.status(500).json({ message: "Failed to fetch fixes" });
  }
});

// Fix History Routes

/**
 * @route POST /api/typescript-errors/fix-history
 * @description Create a new fix history entry
 */
router.post("/fix-history", async (req, res) => {
  try {
    const validatedData = insertErrorFixHistorySchema.parse(req.body);
    const newFixHistory = await tsErrorStorage.createFixHistory(validatedData);
    res.status(201).json(newFixHistory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating fix history:", error);
    res.status(500).json({ message: "Failed to create fix history" });
  }
});

/**
 * @route GET /api/typescript-errors/fix-history/:errorId
 * @description Get fix history for a specific error
 */
router.get("/fix-history/:errorId", async (req, res) => {
  try {
    const errorId = parseInt(req.params.errorId);
    if (isNaN(errorId)) {
      return res.status(400).json({ message: "Invalid error ID format" });
    }
    
    const fixHistory = await tsErrorStorage.getFixHistoryByErrorId(errorId);
    res.json(fixHistory);
  } catch (error) {
    console.error("Error fetching fix history:", error);
    res.status(500).json({ message: "Failed to fetch fix history" });
  }
});

/**
 * @route GET /api/typescript-errors/fix-history/stats
 * @description Get fix history statistics
 */
router.get("/fix-history/stats", async (req, res) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    
    const stats = await tsErrorStorage.getFixHistoryStats(userId, fromDate, toDate);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching fix history statistics:", error);
    res.status(500).json({ message: "Failed to fetch fix history statistics" });
  }
});

// Project Analysis Routes

/**
 * @route POST /api/typescript-errors/project-analysis
 * @description Create a new project analysis
 */
router.post("/project-analysis", async (req, res) => {
  try {
    const validatedData = insertProjectAnalysisSchema.parse(req.body);
    const newAnalysis = await tsErrorStorage.createProjectAnalysis(validatedData);
    res.status(201).json(newAnalysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating project analysis:", error);
    res.status(500).json({ message: "Failed to create project analysis" });
  }
});

/**
 * @route GET /api/typescript-errors/project-analysis
 * @description Get all project analyses
 */
router.get("/project-analysis", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const analyses = await tsErrorStorage.getAllProjectAnalyses(limit);
    res.json(analyses);
  } catch (error) {
    console.error("Error fetching project analyses:", error);
    res.status(500).json({ message: "Failed to fetch project analyses" });
  }
});

/**
 * @route GET /api/typescript-errors/project-analysis/latest
 * @description Get the latest project analysis
 */
router.get("/project-analysis/latest", async (req, res) => {
  try {
    const analysis = await tsErrorStorage.getLatestProjectAnalysis();
    
    if (!analysis) {
      return res.status(404).json({ message: "No project analysis found" });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error("Error fetching latest project analysis:", error);
    res.status(500).json({ message: "Failed to fetch latest project analysis" });
  }
});

/**
 * @route GET /api/typescript-errors/project-analysis/:id
 * @description Get a specific project analysis by ID
 */
router.get("/project-analysis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const analysis = await tsErrorStorage.getProjectAnalysisById(id);
    
    if (!analysis) {
      return res.status(404).json({ message: "Project analysis not found" });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error("Error fetching project analysis:", error);
    res.status(500).json({ message: "Failed to fetch project analysis" });
  }
});

/**
 * @route PATCH /api/typescript-errors/project-analysis/:id
 * @description Update a project analysis
 */
router.patch("/project-analysis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Partial validation of the request body
    const validatedData = insertProjectAnalysisSchema.partial().parse(req.body);
    
    const updatedAnalysis = await tsErrorStorage.updateProjectAnalysis(id, validatedData);
    res.json(updatedAnalysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error updating project analysis:", error);
    res.status(500).json({ message: "Failed to update project analysis" });
  }
});

// Project File Routes

/**
 * @route POST /api/typescript-errors/project-files
 * @description Create a new project file entry
 */
router.post("/project-files", async (req, res) => {
  try {
    const validatedData = insertProjectFileSchema.parse(req.body);
    const newFile = await tsErrorStorage.createProjectFile(validatedData);
    res.status(201).json(newFile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating project file:", error);
    res.status(500).json({ message: "Failed to create project file" });
  }
});

/**
 * @route GET /api/typescript-errors/project-files
 * @description Get all project files
 */
router.get("/project-files", async (req, res) => {
  try {
    const files = await tsErrorStorage.getAllProjectFiles();
    res.json(files);
  } catch (error) {
    console.error("Error fetching project files:", error);
    res.status(500).json({ message: "Failed to fetch project files" });
  }
});

/**
 * @route GET /api/typescript-errors/project-files/with-errors
 * @description Get all project files with errors
 */
router.get("/project-files/with-errors", async (req, res) => {
  try {
    const files = await tsErrorStorage.getProjectFilesWithErrors();
    res.json(files);
  } catch (error) {
    console.error("Error fetching project files with errors:", error);
    res.status(500).json({ message: "Failed to fetch project files with errors" });
  }
});

/**
 * @route GET /api/typescript-errors/project-files/:path
 * @description Get a project file by path
 */
router.get("/project-files/:path(*)", async (req, res) => {
  try {
    const filePath = req.params.path;
    const file = await tsErrorStorage.getProjectFileByPath(filePath);
    
    if (!file) {
      return res.status(404).json({ message: "Project file not found" });
    }
    
    res.json(file);
  } catch (error) {
    console.error("Error fetching project file:", error);
    res.status(500).json({ message: "Failed to fetch project file" });
  }
});

/**
 * @route PATCH /api/typescript-errors/project-files/:id
 * @description Update a project file
 */
router.patch("/project-files/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Partial validation of the request body
    const validatedData = insertProjectFileSchema.partial().parse(req.body);
    
    const updatedFile = await tsErrorStorage.updateProjectFile(id, validatedData);
    res.json(updatedFile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error updating project file:", error);
    res.status(500).json({ message: "Failed to update project file" });
  }
});

export default router;