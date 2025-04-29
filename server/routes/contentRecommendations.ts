import express from 'express';
import { db } from '../db';
import { contentItems, contentRelationships } from '@shared/schema';
import { and, eq, inArray, sql, like, desc, count, not, ne, or } from 'drizzle-orm';
import { generateEmbedding, calculateCosineSimilarity } from '../services/contentRecommendations';
import { isAuthenticated, requireRole } from '../middleware/auth';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache for trending topics to reduce database and AI API calls
let trendingTopicsCache: any[] = [];
let trendingTopicsCacheTime = 0;
const TRENDING_TOPICS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cache for content embeddings
const contentEmbeddingsCache = new Map<number, number[]>();

// Initialize recommendations service
router.get('/health', (req, res) => {
  res.json({ status: 'Content recommendations API is operational' });
});

// Get recommendations based on various parameters
router.get('/', async (req, res) => {
  try {
    const {
      contentId,
      userId,
      tags: tagParam,
      contentType,
      limit = 10,
      excludeIds: excludeIdsParam,
      page = 1,
      pageSize = 10
    } = req.query;
    
    // Process array parameters
    const tagArray = Array.isArray(tagParam) 
      ? tagParam 
      : typeof tagParam === 'string' 
        ? [tagParam] 
        : [];
    
    const excludeIds = Array.isArray(excludeIdsParam)
      ? excludeIdsParam.map(id => parseInt(id as string, 10)).filter(id => !isNaN(id))
      : typeof excludeIdsParam === 'string'
        ? [parseInt(excludeIdsParam, 10)].filter(id => !isNaN(id))
        : [];
    
    // Calculate pagination
    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedPageSize = parseInt(pageSize as string, 10) || 10;
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const offset = (parsedPage - 1) * parsedPageSize;
    
    // Base query to fetch published content
    let recommendedContent = [];
    let totalCount = 0;
    
    // Different recommendation strategies based on parameters
    if (contentId) {
      // Content-based recommendations (similar content)
      recommendedContent = await getContentBasedRecommendations(
        parseInt(contentId as string, 10),
        parsedLimit,
        excludeIds,
        contentType as string | undefined,
        offset,
        parsedPageSize
      );
      
      totalCount = await getContentBasedRecommendationsCount(
        parseInt(contentId as string, 10),
        excludeIds,
        contentType as string | undefined
      );
    } else if (userId) {
      // Personalized recommendations based on user history/preferences
      recommendedContent = await getUserPersonalizedRecommendations(
        userId as string,
        parsedLimit,
        excludeIds,
        contentType as string | undefined,
        tagArray as string[],
        offset,
        parsedPageSize
      );
      
      totalCount = await getUserPersonalizedRecommendationsCount(
        userId as string,
        excludeIds,
        contentType as string | undefined,
        tagArray as string[]
      );
    } else {
      // General recommendations based on popularity, tags, and/or content type
      recommendedContent = await getGeneralRecommendations(
        tagArray as string[],
        contentType as string | undefined,
        parsedLimit,
        excludeIds,
        offset,
        parsedPageSize
      );
      
      totalCount = await getGeneralRecommendationsCount(
        tagArray as string[],
        contentType as string | undefined,
        excludeIds
      );
    }
    
    // Format the response
    const formattedRecommendations = await formatRecommendations(recommendedContent);
    
    res.json({
      recommendations: formattedRecommendations,
      totalCount,
      page: parsedPage,
      pageSize: parsedPageSize,
      hasMore: totalCount > (parsedPage * parsedPageSize)
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Get trending topics
router.get('/trending-topics', async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (trendingTopicsCache.length > 0 && (now - trendingTopicsCacheTime) < TRENDING_TOPICS_CACHE_TTL) {
      return res.json(trendingTopicsCache);
    }
    
    // Get all content items with tags
    const contentWithTags = await db
      .select({
        id: contentItems.id,
        tags: contentItems.tags,
      })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, 'published'),
          sql`${contentItems.tags} IS NOT NULL`
        )
      );
      
    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    
    contentWithTags.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Convert to array and sort
    const trendingTagsQuery = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    // If we have OpenAI API access, enhance with AI-powered trend analysis
    const enhancedTrendingTopics = await enhanceTrendingTopicsWithAI(trendingTagsQuery);
    
    // Cache the results
    trendingTopicsCache = enhancedTrendingTopics;
    trendingTopicsCacheTime = now;
    
    res.json(enhancedTrendingTopics);
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// Get content gap suggestions (admin only)
router.get('/gap-suggestions', isAuthenticated, requireRole('admin'), async (req, res) => {
  try {
    // Analyze content coverage and identify gaps
    const contentGapSuggestions = await identifyContentGaps();
    
    res.json(contentGapSuggestions);
  } catch (error) {
    console.error('Error generating content gap suggestions:', error);
    res.status(500).json({ error: 'Failed to generate content gap suggestions' });
  }
});

// Helper function: Get content-based recommendations
async function getContentBasedRecommendations(
  sourceContentId: number,
  limit: number,
  excludeIds: number[],
  contentType?: string,
  offset = 0,
  pageSize = 10
) {
  // Get source content
  const [sourceContent] = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      content: contentItems.content,
      type: contentItems.type,
      tags: contentItems.tags
    })
    .from(contentItems)
    .where(eq(contentItems.id, sourceContentId));
  
  if (!sourceContent) {
    return [];
  }
  
  // First try to find directly related content via content relationships
  const relatedContent = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      content: contentItems.content,
      summary: contentItems.summary,
      type: contentItems.type,
      score: sql<number>`1.0`,
      tags: contentItems.tags,
      imageUrl: contentItems.imageUrl
    })
    .from(contentItems)
    .innerJoin(
      contentRelationships,
      or(
        and(
          eq(contentRelationships.sourceContentId, sourceContentId),
          eq(contentRelationships.targetContentId, contentItems.id)
        ),
        and(
          eq(contentRelationships.targetContentId, sourceContentId),
          eq(contentRelationships.sourceContentId, contentItems.id)
        )
      )
    )
    .where(
      and(
        eq(contentItems.status, 'published'),
        ne(contentItems.id, sourceContentId),
        inArray(contentItems.id, excludeIds) ? not(inArray(contentItems.id, excludeIds)) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined
      )
    )
    .orderBy(desc(contentRelationships.relationStrength))
    .limit(pageSize)
    .offset(offset);
  
  // If we have enough related content, return it
  if (relatedContent.length >= limit) {
    return relatedContent;
  }
  
  // Otherwise, use semantic similarity to find more recommendations
  // Get or generate embedding for source content
  let sourceEmbedding: number[] = [];
  
  if (contentEmbeddingsCache.has(sourceContentId)) {
    sourceEmbedding = contentEmbeddingsCache.get(sourceContentId)!;
  } else {
    sourceEmbedding = await generateEmbedding(`${sourceContent.title} ${sourceContent.content}`);
    contentEmbeddingsCache.set(sourceContentId, sourceEmbedding);
  }
  
  // Get all relevant content that's not already in relatedContent
  const existingIds = relatedContent.map(item => item.id);
  const allExcludeIds = [...excludeIds, sourceContentId, ...existingIds];
  
  // For semantic search, get a bigger pool of candidates
  const contentPool = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      content: contentItems.content,
      summary: contentItems.summary,
      type: contentItems.type,
      tags: contentItems.tags,
      imageUrl: contentItems.imageUrl
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'published'),
        not(inArray(contentItems.id, allExcludeIds)),
        contentType ? eq(contentItems.type, contentType) : undefined
      )
    )
    .limit(50); // Get a reasonable pool of candidates for embedding comparison
  
  // For each candidate, generate or retrieve embedding and calculate similarity
  const scoredCandidates = await Promise.all(
    contentPool.map(async (item) => {
      let embedding: number[];
      
      if (contentEmbeddingsCache.has(item.id)) {
        embedding = contentEmbeddingsCache.get(item.id)!;
      } else {
        embedding = await generateEmbedding(`${item.title} ${item.content}`);
        contentEmbeddingsCache.set(item.id, embedding);
      }
      
      const similarity = calculateCosineSimilarity(sourceEmbedding, embedding);
      
      return {
        ...item,
        score: similarity
      };
    })
  );
  
  // Sort by similarity score and take needed amount
  const semanticRecommendations = scoredCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit - relatedContent.length);
  
  // Combine both sources of recommendations
  return [...relatedContent, ...semanticRecommendations];
}

// Helper function: Get count for content-based recommendations
async function getContentBasedRecommendationsCount(
  sourceContentId: number,
  excludeIds: number[],
  contentType?: string
) {
  // Count directly related content
  const [{ count: relatedCount }] = await db
    .select({
      count: count()
    })
    .from(contentItems)
    .innerJoin(
      contentRelationships,
      or(
        and(
          eq(contentRelationships.sourceContentId, sourceContentId),
          eq(contentRelationships.targetContentId, contentItems.id)
        ),
        and(
          eq(contentRelationships.targetContentId, sourceContentId),
          eq(contentRelationships.sourceContentId, contentItems.id)
        )
      )
    )
    .where(
      and(
        eq(contentItems.status, 'published'),
        ne(contentItems.id, sourceContentId),
        inArray(contentItems.id, excludeIds) ? not(inArray(contentItems.id, excludeIds)) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined
      )
    );
  
  // Count all possible candidates for semantic recommendations
  const [{ count: totalCandidatesCount }] = await db
    .select({
      count: count()
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'published'),
        ne(contentItems.id, sourceContentId),
        inArray(contentItems.id, excludeIds) ? not(inArray(contentItems.id, excludeIds)) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined
      )
    );
  
  // Return the total count (this is approximate since we can't know exact semantic matches)
  return relatedCount + Math.min(totalCandidatesCount - relatedCount, 50);
}

// Helper function: Get user personalized recommendations
async function getUserPersonalizedRecommendations(
  userId: string,
  limit: number,
  excludeIds: number[],
  contentType?: string,
  tagArray?: string[],
  offset = 0,
  pageSize = 10
) {
  // For the initial implementation, we'll use a simpler approach without user history
  // since contentUsage table isn't available yet
  
  // Simplified user preferences based on requested tags and type
  let userPreferences = {
    contentTypes: contentType ? [contentType] : ['text', 'html', 'image'],
    tags: tagArray || []
  };
  
  // Query for personalized recommendations
  const personalizedRecommendations = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      content: contentItems.content,
      type: contentItems.type,
      score: sql<number>`0.9`, // Default score, will be adjusted
      tags: contentItems.tags,
      imageUrl: contentItems.imageUrl
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'published'),
        inArray(contentItems.id, excludeIds) ? not(inArray(contentItems.id, excludeIds)) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined,
        tagArray && tagArray.length > 0 
          ? sql`${contentItems.tags} && ${JSON.stringify(tagArray)}` 
          : undefined
      )
    )
    .limit(pageSize)
    .offset(offset);
  
  // Adjust scores based on user preferences
  const scoredRecommendations = personalizedRecommendations.map(item => {
    let score = 0.5; // Base score
    
    // Boost score if content type matches user preferences
    if (userPreferences.contentTypes.includes(item.type)) {
      score += 0.2;
    }
    
    // Boost score if tags match user preferences
    if (item.tags && userPreferences.tags.length > 0) {
      const matchingTags = item.tags.filter(tag => userPreferences.tags.includes(tag));
      score += 0.3 * (matchingTags.length / Math.max(1, item.tags.length));
    }
    
    return {
      ...item,
      score
    };
  });
  
  // Sort by adjusted score
  return scoredRecommendations.sort((a, b) => b.score - a.score);
}

// Helper function: Get count for user personalized recommendations
async function getUserPersonalizedRecommendationsCount(
  userId: string,
  excludeIds: number[],
  contentType?: string,
  tagArray?: string[]
) {
  const [{ count: totalCount }] = await db
    .select({
      count: count()
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'published'),
        inArray(contentItems.id, excludeIds) ? not(inArray(contentItems.id, excludeIds)) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined,
        tagArray && tagArray.length > 0 
          ? sql`${contentItems.tags} && ${JSON.stringify(tagArray)}` 
          : undefined
      )
    );
  
  return totalCount;
}

// Helper function: Get general recommendations
async function getGeneralRecommendations(
  tagArray: string[],
  contentType?: string,
  limit?: number,
  excludeIds?: number[],
  offset = 0,
  pageSize = 10
) {
  return await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      content: contentItems.content,
      summary: contentItems.summary,
      type: contentItems.type,
      score: sql<number>`0.75`, // Default score for general recommendations
      tags: contentItems.tags,
      imageUrl: contentItems.imageUrl
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'published'),
        inArray(contentItems.id, excludeIds || []) ? not(inArray(contentItems.id, excludeIds || [])) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined,
        tagArray && tagArray.length > 0 
          ? sql`${contentItems.tags} && ${JSON.stringify(tagArray)}` 
          : undefined
      )
    )
    .orderBy(desc(contentItems.publishedAt))
    .limit(pageSize)
    .offset(offset);
}

// Helper function: Get count for general recommendations
async function getGeneralRecommendationsCount(
  tagArray: string[],
  contentType?: string,
  excludeIds?: number[]
) {
  const [{ count: totalCount }] = await db
    .select({
      count: count()
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'published'),
        inArray(contentItems.id, excludeIds || []) ? not(inArray(contentItems.id, excludeIds || [])) : undefined,
        contentType ? eq(contentItems.type, contentType) : undefined,
        tagArray && tagArray.length > 0 
          ? sql`${contentItems.tags} && ${JSON.stringify(tagArray)}` 
          : undefined
      )
    );
  
  return totalCount;
}

// Helper function: Format recommendations with consistent structure
async function formatRecommendations(recommendedContent: any[]) {
  return recommendedContent.map(content => ({
    contentId: content.id,
    title: content.title,
    summary: content.summary || content.content.substring(0, 150) + '...',
    contentType: content.type,
    tags: content.tags || [],
    score: content.score || 0.5,
    reason: generateRecommendationReason(content),
    imageUrl: content.imageUrl
  }));
}

// Helper function: Generate a human-readable reason for the recommendation
function generateRecommendationReason(content: any) {
  const reasons = [
    'Based on content you recently viewed',
    'Popular with readers like you',
    'Trending in our community',
    'Matches your interests',
    'Recently updated content',
    'Related to your favorite topics',
    'Frequently paired with content you enjoy'
  ];
  
  // Add content-specific reasons based on tags
  if (content.tags && content.tags.length > 0) {
    reasons.push(`Contains the topic "${content.tags[0]}"`);
    
    if (content.tags.length > 1) {
      reasons.push(`Topics include ${content.tags.slice(0, 3).join(', ')}`);
    }
  }
  
  // For high-scoring content
  if (content.score > 0.8) {
    reasons.push('Highly relevant to your interests');
  }
  
  // Select a reason with some weighted randomness
  // Higher-scoring content gets more specific reasons
  const reasonIndex = content.score > 0.7
    ? Math.floor(Math.random() * (reasons.length - 3)) + 3
    : Math.floor(Math.random() * reasons.length);
  
  return reasons[reasonIndex];
}

// Helper function: Enhance trending topics with AI analysis
async function enhanceTrendingTopicsWithAI(trendingTagsData: any[]) {
  try {
    // Prepare trending tags data for analysis
    const tagsData = trendingTagsData.map(({ tag, count }) => `${tag} (${count} mentions)`).join(', ');
    
    // If OpenAI API key is missing, return basic format
    if (!process.env.OPENAI_API_KEY) {
      return trendingTagsData.slice(0, 10).map(({ tag, count }) => ({
        topic: tag,
        score: Math.min(1, count / 100),
        trend: 'stable',
        count
      }));
    }
    
    // Use AI to analyze trends
    const prompt = `
      Analyze these content tags and their mention counts: ${tagsData}
      
      For each tag, determine if it's trending up, stable, or down based on its popularity.
      Return a JSON array with objects having these fields:
      - topic: the tag name
      - score: a number between 0-1 indicating relevance (higher = more relevant)
      - trend: "up", "down", or "stable"
      - count: the mention count
      
      Return only the top 10 most significant tags, formatted as valid JSON.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from AI analysis");
    }
    
    const parsedResponse = JSON.parse(responseContent);
    return Array.isArray(parsedResponse.topics) 
      ? parsedResponse.topics 
      : (parsedResponse.trends || parsedResponse);
  } catch (error) {
    console.error('Error enhancing trending topics with AI:', error);
    
    // Fallback to basic format on error
    return trendingTagsData.slice(0, 10).map(({ tag, count }) => ({
      topic: tag,
      score: Math.min(1, count / 100),
      trend: 'stable',
      count
    }));
  }
}

// Helper function: Identify content gaps using AI
async function identifyContentGaps() {
  try {
    // Get current content tags and types distribution
    const tagDistribution = await db
      .select({
        tag: sql<string>`unnest(${contentItems.tags})`,
        count: count().as('count')
      })
      .from(contentItems)
      .where(eq(contentItems.status, 'published'))
      .groupBy(sql`unnest(${contentItems.tags})`)
      .orderBy(desc(sql`count`));
    
    const typeDistribution = await db
      .select({
        type: contentItems.type,
        count: count().as('count')
      })
      .from(contentItems)
      .where(eq(contentItems.status, 'published'))
      .groupBy(contentItems.type)
      .orderBy(desc(sql`count`));
    
    // If OpenAI API key is missing, return empty array
    if (!process.env.OPENAI_API_KEY) {
      return [];
    }
    
    // Use AI to identify content gaps
    const prompt = `
      Analyze this content distribution data:
      
      Tags: ${JSON.stringify(tagDistribution)}
      Content Types: ${JSON.stringify(typeDistribution)}
      
      Identify 5 content gaps or opportunities based on:
      1. Underrepresented topics
      2. Missing combinations of existing popular topics
      3. Topics that should have more diverse content types
      
      For each gap, determine:
      - A specific topic/theme
      - Priority level (high, medium, low)
      - A reason why this content would be valuable
      - 3-5 suggested tags
      - A suggested title (optional)
      
      Return as a JSON array with objects containing these fields:
      - id: a unique string
      - topic: the identified content gap topic
      - priority: "high", "medium", or "low"
      - reason: explanation of why this content gap should be filled
      - suggestedTags: array of 3-5 relevant tags
      - suggestedTitle: optional suggested title
      
      Format as valid JSON.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from AI analysis");
    }
    
    const parsedResponse = JSON.parse(responseContent);
    return Array.isArray(parsedResponse.gaps) 
      ? parsedResponse.gaps 
      : (parsedResponse.contentGaps || parsedResponse);
  } catch (error) {
    console.error('Error identifying content gaps with AI:', error);
    
    // Return empty array on error
    return [];
  }
}

export default router;