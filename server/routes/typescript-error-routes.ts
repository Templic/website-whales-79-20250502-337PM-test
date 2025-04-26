import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middlewares/validationMiddleware';
import { tsErrorStorage } from '../tsErrorStorage';
import { ErrorCategory, ErrorSeverity, ErrorStatus, FixMethod } from '../../shared/schema';

const router = express.Router();

// Validation middleware 
const createErrorValidation = [
  body('message').notEmpty().withMessage('Error message is required'),
  body('filePath').notEmpty().withMessage('File path is required'),
  body('line').isInt({ min: 1 }).withMessage('Line must be a positive integer'),
  body('column').isInt({ min: 0 }).withMessage('Column must be a non-negative integer'),
  body('severity')
    .isIn(Object.values(ErrorSeverity))
    .withMessage(`Severity must be one of: ${Object.values(ErrorSeverity).join(', ')}`),
  body('category')
    .isIn(Object.values(ErrorCategory))
    .withMessage(`Category must be one of: ${Object.values(ErrorCategory).join(', ')}`),
  body('code').optional().isString(),
  body('stackTrace').optional().isString(),
  body('rawErrorText').optional().isString(),
];

const createPatternValidation = [
  body('regex').notEmpty().withMessage('Regex pattern is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(Object.values(ErrorCategory))
    .withMessage(`Category must be one of: ${Object.values(ErrorCategory).join(', ')}`),
  body('priority').isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10'),
  body('hasAutoFix').isBoolean(),
  body('autoFixStrategy').optional().isString(),
];

const createFixValidation = [
  body('patternId').isInt({ min: 1 }).withMessage('Pattern ID must be a positive integer'),
  body('replacementTemplate').notEmpty().withMessage('Replacement template is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('method')
    .isIn(Object.values(FixMethod))
    .withMessage(`Method must be one of: ${Object.values(FixMethod).join(', ')}`),
];

// Error routes
router.post('/errors', createErrorValidation, validate, async (req, res) => {
  try {
    const error = await tsErrorStorage.createTypescriptError({
      ...req.body,
      status: ErrorStatus.PENDING,
      discoveredAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json(error);
  } catch (err) {
    console.error('Error creating TypeScript error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      severity: req.query.severity as string | undefined,
      category: req.query.category as string | undefined,
      filePath: req.query.filePath as string | undefined,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    };
    
    const errors = await tsErrorStorage.getAllTypescriptErrors(filters);
    res.json(errors);
  } catch (err) {
    console.error('Error fetching TypeScript errors:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/errors/stats', async (req, res) => {
  try {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    
    const stats = await tsErrorStorage.getTypescriptErrorStats(fromDate, toDate);
    res.json(stats);
  } catch (err) {
    console.error('Error fetching TypeScript error stats:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/errors/:id', param('id').isInt({ min: 1 }), validate, async (req, res) => {
  try {
    const error = await tsErrorStorage.getTypescriptErrorById(parseInt(req.params.id));
    if (!error) {
      return res.status(404).json({ message: 'Error not found' });
    }
    res.json(error);
  } catch (err) {
    console.error('Error fetching TypeScript error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/errors/:id', 
  [
    param('id').isInt({ min: 1 }),
    body('status').optional().isIn(Object.values(ErrorStatus)),
    body('severity').optional().isIn(Object.values(ErrorSeverity)),
    body('category').optional().isIn(Object.values(ErrorCategory)),
    body('fixId').optional().isInt({ min: 1 }),
  ], 
  validate, 
  async (req, res) => {
    try {
      const error = await tsErrorStorage.updateTypescriptError(parseInt(req.params.id), {
        ...req.body,
        updatedAt: new Date(),
        ...(req.body.status === 'fixed' ? { fixedAt: new Date() } : {}),
      });
      res.json(error);
    } catch (err) {
      console.error('Error updating TypeScript error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

router.post('/errors/:id/fix', 
  [
    param('id').isInt({ min: 1 }),
    body('fixId').isInt({ min: 1 }),
    body('userId').isInt({ min: 1 }),
  ], 
  validate, 
  async (req, res) => {
    try {
      const error = await tsErrorStorage.markErrorAsFixed(
        parseInt(req.params.id),
        parseInt(req.body.fixId),
        parseInt(req.body.userId)
      );
      res.json(error);
    } catch (err) {
      console.error('Error marking TypeScript error as fixed:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Pattern routes
router.post('/patterns', createPatternValidation, validate, async (req, res) => {
  try {
    const pattern = await tsErrorStorage.createErrorPattern({
      ...req.body,
      detectionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json(pattern);
  } catch (err) {
    console.error('Error creating error pattern:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/patterns', async (req, res) => {
  try {
    const patterns = await tsErrorStorage.getAllErrorPatterns();
    res.json(patterns);
  } catch (err) {
    console.error('Error fetching error patterns:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/patterns/category/:category', param('category').isString(), validate, async (req, res) => {
  try {
    const patterns = await tsErrorStorage.getErrorPatternsByCategory(req.params.category);
    res.json(patterns);
  } catch (err) {
    console.error('Error fetching error patterns by category:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/patterns/autofixable', async (req, res) => {
  try {
    const patterns = await tsErrorStorage.getAutoFixablePatterns();
    res.json(patterns);
  } catch (err) {
    console.error('Error fetching auto-fixable patterns:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/patterns/:id', param('id').isInt({ min: 1 }), validate, async (req, res) => {
  try {
    const pattern = await tsErrorStorage.getErrorPatternById(parseInt(req.params.id));
    if (!pattern) {
      return res.status(404).json({ message: 'Pattern not found' });
    }
    res.json(pattern);
  } catch (err) {
    console.error('Error fetching error pattern:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/patterns/:id', 
  [
    param('id').isInt({ min: 1 }),
    body('regex').optional().isString(),
    body('description').optional().isString(),
    body('category').optional().isIn(Object.values(ErrorCategory)),
    body('priority').optional().isInt({ min: 1, max: 10 }),
    body('hasAutoFix').optional().isBoolean(),
    body('autoFixStrategy').optional().isString(),
  ], 
  validate, 
  async (req, res) => {
    try {
      const pattern = await tsErrorStorage.updateErrorPattern(parseInt(req.params.id), {
        ...req.body,
        updatedAt: new Date(),
      });
      res.json(pattern);
    } catch (err) {
      console.error('Error updating error pattern:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Fix routes
router.post('/fixes', createFixValidation, validate, async (req, res) => {
  try {
    const fix = await tsErrorStorage.createErrorFix({
      ...req.body,
      successRate: 0,
      usageCount: 0,
      successCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json(fix);
  } catch (err) {
    console.error('Error creating fix:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/fixes', async (req, res) => {
  try {
    const fixes = await tsErrorStorage.getAllErrorFixes();
    res.json(fixes);
  } catch (err) {
    console.error('Error fetching fixes:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/fixes/pattern/:patternId', param('patternId').isInt({ min: 1 }), validate, async (req, res) => {
  try {
    const fixes = await tsErrorStorage.getFixesByPatternId(parseInt(req.params.patternId));
    res.json(fixes);
  } catch (err) {
    console.error('Error fetching fixes by pattern:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/fixes/:id', param('id').isInt({ min: 1 }), validate, async (req, res) => {
  try {
    const fix = await tsErrorStorage.getErrorFixById(parseInt(req.params.id));
    if (!fix) {
      return res.status(404).json({ message: 'Fix not found' });
    }
    res.json(fix);
  } catch (err) {
    console.error('Error fetching fix:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/fixes/:id', 
  [
    param('id').isInt({ min: 1 }),
    body('replacementTemplate').optional().isString(),
    body('description').optional().isString(),
    body('method').optional().isIn(Object.values(FixMethod)),
    body('successRate').optional().isNumeric(),
    body('usageCount').optional().isInt({ min: 0 }),
    body('successCount').optional().isInt({ min: 0 }),
  ], 
  validate, 
  async (req, res) => {
    try {
      const fix = await tsErrorStorage.updateErrorFix(parseInt(req.params.id), {
        ...req.body,
        updatedAt: new Date(),
      });
      res.json(fix);
    } catch (err) {
      console.error('Error updating fix:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;