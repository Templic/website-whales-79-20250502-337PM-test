/**
 * Content Recommendations API Routes
 * 
 * This file defines API routes for AI-powered content recommendations:
 * - Similar content recommendations
 * - Personalized recommendations for users
 * - Trending topics analysis
 * - Content gap suggestions
 */

import express from 'express';
import { z } from 'zod';
import { 
  getContentRecommendations,
  getTrendingTopics,
  getContentGapSuggestions,
  RecommendationParams
} from '../services/contentRecommendations';

const router = express.Router();

// Error handler for API routes
function handleApiError(res: express.Response, error: unknown) {
  console.error('Content recommendations API error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  res.status(500).json({ success: false, error: errorMessage });
}

/**
 * Get similar content recommendations
 * GET /api/content-recommendations/similar/:contentId
 */
router.get('/similar/:contentId', async (req, res) => {
  try {
    const contentId = parseInt(req.params.contentId);
    if (isNaN(contentId)) {
      return res.status(400).json({ success: false, error: 'Invalid content ID' });
    }

    const params: RecommendationParams = {
      contentId,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 5
    };

    const recommendations = await getContentRecommendations(params);
    res.json({ success: true, recommendations });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Get personalized recommendations for a user
 * GET /api/content-recommendations/personalized/:userId
 */
router.get('/personalized/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Optional filter params
    const contentType = req.query.contentType as string | undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    const params: RecommendationParams = {
      userId,
      contentType,
      tags,
      limit
    };

    const recommendations = await getContentRecommendations(params);
    res.json({ success: true, recommendations });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Get filtered recommendations by tags and content type
 * POST /api/content-recommendations/filtered
 */
router.post('/filtered', async (req, res) => {
  try {
    // Validate request body
    const schema = z.object({
      contentType: z.string().optional(),
      tags: z.array(z.string()).optional(),
      excludeIds: z.array(z.number()).optional(),
      limit: z.number().min(1).max(20).optional()
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request parameters',
        details: validationResult.error.errors
      });
    }

    const { contentType, tags, excludeIds, limit } = validationResult.data;
    
    const params: RecommendationParams = {
      contentType,
      tags,
      excludeIds,
      limit: limit || 5
    };

    const recommendations = await getContentRecommendations(params);
    res.json({ success: true, recommendations });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Get trending topics
 * GET /api/content-recommendations/trending-topics
 */
router.get('/trending-topics', async (req, res) => {
  try {
    const trendingTopics = await getTrendingTopics();
    res.json({ success: true, trendingTopics });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Get content gap suggestions
 * GET /api/content-recommendations/gap-suggestions
 */
router.get('/gap-suggestions', async (req, res) => {
  try {
    const suggestions = await getContentGapSuggestions();
    res.json({ success: true, suggestions });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;