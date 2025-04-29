/**
 * Content AI API Routes
 * 
 * This file defines API routes for AI-powered content features including:
 * - Content generation
 * - Content enhancement
 * - Content summarization
 * - Sentiment analysis
 * - Tag generation
 * - Content recommendations
 * - SEO suggestions
 */

import express from 'express';
import {
  generateContent,
  enhanceContent,
  summarizeContent,
  analyzeSentiment,
  generateTags,
  generateRecommendations,
  generateSEOSuggestions,
  extractKeyInsights,
  testOpenAIConnection,
  ContentGenerationRequest,
  ContentEnhancementRequest,
  ContentSummaryRequest
} from '../services/contentAI';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const contentGenerationSchema = z.object({
  topic: z.string().min(3).max(200),
  type: z.enum(['blog', 'product', 'landing', 'about', 'newsletter']),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'informative']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional()
});

const contentEnhancementSchema = z.object({
  originalContent: z.string().min(10),
  enhancementType: z.enum(['clarity', 'engagement', 'seo', 'readability']),
  preserveStructure: z.boolean().optional(),
  targetReadingLevel: z.enum(['elementary', 'intermediate', 'advanced']).optional()
});

const contentSummarySchema = z.object({
  content: z.string().min(50),
  maxLength: z.number().optional(),
  format: z.enum(['paragraph', 'bullets', 'tweetThread']).optional(),
  includeKeyInsights: z.boolean().optional()
});

const sentimentAnalysisSchema = z.object({
  content: z.string().min(10)
});

const tagGenerationSchema = z.object({
  content: z.string().min(10),
  title: z.string().optional()
});

const recommendationsSchema = z.object({
  contentId: z.number().int().positive(),
  maxRecommendations: z.number().int().positive().optional()
});

const seoSuggestionsSchema = z.object({
  content: z.string().min(10),
  title: z.string().min(3),
  currentMetaDescription: z.string().optional()
});

const keyInsightsSchema = z.object({
  content: z.string().min(50)
});

// Helper function to handle API errors
function handleApiError(res: express.Response, error: unknown) {
  console.error('API Error:', error);
  const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  res.status(statusCode).json({ error: message });
}

/**
 * Test OpenAI connection
 * GET /api/content-ai/test
 */
router.get('/test', async (req, res) => {
  try {
    const isConnected = await testOpenAIConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Generate content
 * POST /api/content-ai/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const validatedData = contentGenerationSchema.parse(req.body);
    const content = await generateContent(validatedData as ContentGenerationRequest);
    res.json({ content });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Enhance content
 * POST /api/content-ai/enhance
 */
router.post('/enhance', async (req, res) => {
  try {
    const validatedData = contentEnhancementSchema.parse(req.body);
    const enhancedContent = await enhanceContent(validatedData as ContentEnhancementRequest);
    res.json({ content: enhancedContent });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Summarize content
 * POST /api/content-ai/summarize
 */
router.post('/summarize', async (req, res) => {
  try {
    const validatedData = contentSummarySchema.parse(req.body);
    const summary = await summarizeContent(validatedData as ContentSummaryRequest);
    res.json({ summary });
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Analyze sentiment
 * POST /api/content-ai/sentiment
 */
router.post('/sentiment', async (req, res) => {
  try {
    const { content } = sentimentAnalysisSchema.parse(req.body);
    const sentimentResult = await analyzeSentiment(content);
    res.json(sentimentResult);
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Generate tags
 * POST /api/content-ai/tags
 */
router.post('/tags', async (req, res) => {
  try {
    const { content, title } = tagGenerationSchema.parse(req.body);
    const tagsResult = await generateTags(content, title);
    res.json(tagsResult);
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Generate recommendations
 * POST /api/content-ai/recommendations
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { contentId, maxRecommendations } = recommendationsSchema.parse(req.body);
    const recommendationsResult = await generateRecommendations(contentId, maxRecommendations);
    res.json(recommendationsResult);
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Generate SEO suggestions
 * POST /api/content-ai/seo
 */
router.post('/seo', async (req, res) => {
  try {
    const { content, title, currentMetaDescription } = seoSuggestionsSchema.parse(req.body);
    const seoResult = await generateSEOSuggestions(content, title, currentMetaDescription);
    res.json(seoResult);
  } catch (error) {
    handleApiError(res, error);
  }
});

/**
 * Extract key insights
 * POST /api/content-ai/insights
 */
router.post('/insights', async (req, res) => {
  try {
    const { content } = keyInsightsSchema.parse(req.body);
    const insightsResult = await extractKeyInsights(content);
    res.json(insightsResult);
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;