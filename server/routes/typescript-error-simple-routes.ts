/**
 * Simplified TypeScript Error Routes
 * 
 * This module provides a streamlined API for the TypeScript error management system
 * with reduced validation and middleware to improve performance.
 */

import express from 'express';
import { tsErrorStorage } from '../tsErrorStorage';
import { ErrorStatus } from '../../shared/schema';

const router = express.Router();

// Error routes
router.post('/errors', async (req, res) => {
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

router.get('/errors/:id', async (req, res) => {
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

router.patch('/errors/:id', async (req, res) => {
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
});

router.post('/errors/:id/fix', async (req, res) => {
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
});

// Pattern routes
router.post('/patterns', async (req, res) => {
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

router.get('/patterns/category/:category', async (req, res) => {
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

router.get('/patterns/:id', async (req, res) => {
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

router.patch('/patterns/:id', async (req, res) => {
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
});

// Fix routes
router.post('/fixes', async (req, res) => {
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

router.get('/fixes/pattern/:patternId', async (req, res) => {
  try {
    const fixes = await tsErrorStorage.getFixesByPatternId(parseInt(req.params.patternId));
    res.json(fixes);
  } catch (err) {
    console.error('Error fetching fixes by pattern:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/fixes/:id', async (req, res) => {
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

router.patch('/fixes/:id', async (req, res) => {
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
});

export default router;