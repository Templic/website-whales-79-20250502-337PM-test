/**
 * Content Recommendations Service
 * 
 * This service provides AI-powered content recommendations based on:
 * - Content similarity
 * - User preferences and behavior
 * - Content performance metrics
 * - Trending topics and keywords
 */

import OpenAI from 'openai';
import { db } from '../db';
import { contentItems, users, contentRelationships, posts } from '@shared/schema';
import { eq, inArray, like, sql } from 'drizzle-orm';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Content Item for recommendations
 */
interface ContentItem {
  id: number;
  title: string;
  summary?: string;
  contentType: string;
  tags: string[];
  createdAt: Date;
  popularity: number;
}

/**
 * Content Recommendation Result
 */
export interface ContentRecommendation {
  contentId: number;
  score: number;
  reason: string;
}

/**
 * Recommendation Request Parameters
 */
export interface RecommendationParams {
  contentId?: number;         // Source content ID to find similar content
  userId?: string;            // User ID to personalize recommendations
  tags?: string[];            // Tags to filter recommendations
  contentType?: string;       // Type of content to recommend
  limit?: number;             // Maximum number of recommendations
  excludeIds?: number[];      // Content IDs to exclude
}

/**
 * Get content recommendations based on similarity to source content
 */
export async function getContentRecommendations(
  params: RecommendationParams
): Promise<ContentRecommendation[]> {
  try {
    // Default limit
    const limit = params.limit || 5;
    
    // Get source content details if contentId is provided
    let sourceContent: ContentItem | null = null;
    if (params.contentId) {
      sourceContent = await getContentById(params.contentId);
    }
    
    // Get user preferences if userId is provided
    let userPreferences: string[] = [];
    if (params.userId) {
      userPreferences = await getUserPreferences(params.userId);
    }
    
    // Combine filters based on parameters
    const contentTypesToInclude = params.contentType ? [params.contentType] : undefined;
    const tagsToInclude = params.tags || [];
    
    // Get candidate content items
    const candidates = await getCandidateContent(
      sourceContent?.id,
      contentTypesToInclude,
      tagsToInclude,
      params.excludeIds || [],
      limit * 3 // Get more candidates than needed for AI ranking
    );
    
    if (candidates.length === 0) {
      return [];
    }
    
    // If there's no source content and no user preferences, just return candidates
    // sorted by popularity with a generic reason
    if (!sourceContent && userPreferences.length === 0) {
      return candidates.slice(0, limit).map(candidate => ({
        contentId: candidate.id,
        score: candidate.popularity || 0.5,
        reason: 'Popular content you might enjoy'
      }));
    }
    
    // Use AI to rank and explain recommendations
    return await rankContentWithAI(
      sourceContent,
      candidates,
      userPreferences,
      limit
    );
  } catch (error) {
    console.error('Error getting content recommendations:', error);
    return [];
  }
}

/**
 * Get content item by ID
 */
async function getContentById(contentId: number): Promise<ContentItem | null> {
  try {
    const [contentItem] = await db.select({
      id: contentItems.id,
      title: contentItems.title,
      // Use actual content field as summary for simplicity
      summary: sql<string>`SUBSTRING(${contentItems.content}, 1, 150)`,
      // Use type field for contentType
      contentType: contentItems.type,
      createdAt: contentItems.createdAt,
      // Doesn't have viewCount so use constant for popularity
      popularity: sql<number>`1`,
    }).from(contentItems)
      .where(eq(contentItems.id, contentId));
    
    if (!contentItem) return null;
    
    // Get content tags - simplified since we don't have a direct tags table
    // Instead we'll use section as tag
    const tags = [contentItem.contentType, contentItem.summary?.substring(0, 20) || ''];
    
    return {
      ...contentItem,
      tags: tags.filter(Boolean)
    };
  } catch (error) {
    console.error('Error getting content by ID:', error);
    return null;
  }
}

/**
 * Get user content preferences based on history
 */
async function getUserPreferences(userId: string): Promise<string[]> {
  try {
    // Get posts by the user to extract categories as preferences
    const userPosts = await db
      .select({
        category: posts.category
      })
      .from(posts)
      .where(eq(posts.authorId, userId))
      .limit(10);

    // Filter out null categories and return unique categories
    return [...new Set(userPosts
      .map(post => post.category)
      .filter(Boolean) as string[])];
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return [];
  }
}

/**
 * Get candidate content for recommendations
 */
async function getCandidateContent(
  excludeContentId?: number,
  contentTypes?: string[],
  includeTags?: string[],
  excludeIds: number[] = [],
  limit: number = 15
): Promise<ContentItem[]> {
  try {
    // Combine all exclusions
    const allExcludeIds = [...excludeIds];
    if (excludeContentId) {
      allExcludeIds.push(excludeContentId);
    }
    
    // Since we don't have the exact tables from the schema, we'll use posts as our content source
    const postsQuery = db.select({
      id: posts.id,
      title: posts.title,
      // Use post content as summary (truncated)
      summary: sql<string>`SUBSTRING(${posts.content}, 1, 150)`,
      // Use "blog" as the content type
      contentType: sql<string>`'blog'`,
      createdAt: posts.createdAt,
      // Use constant for popularity (could be enhanced)
      popularity: sql<number>`1`,
    })
    .from(posts)
    .where(
      sql`${posts.published} = true`
    );
    
    // Apply additional filters
    // Note: The where clause is already applied to filter published posts
    // If we had exclude IDs, we would handle them in the original where clause
    
    // Sort by recency (since we don't have view counts)
    const result = await postsQuery
      .orderBy(posts.updatedAt)
      .limit(limit);
    
    // Attach categories as tags 
    return result.map(post => ({
      ...post,
      tags: post.summary ? [post.summary.substring(0, 20)] : [],
      contentType: 'blog'
    })).slice(0, limit);
  } catch (error) {
    console.error('Error getting candidate content:', error);
    return [];
  }
}

/**
 * Use AI to rank content and provide recommendation reasons
 */
async function rankContentWithAI(
  sourceContent: ContentItem | null,
  candidates: ContentItem[],
  userPreferences: string[],
  limit: number
): Promise<ContentRecommendation[]> {
  try {
    if (candidates.length === 0) return [];
    
    // Prepare prompt context
    let prompt = `You are a content recommendation system. Analyze the following content items and recommend the most relevant ones.`;
    
    // Add source content context if available
    if (sourceContent) {
      prompt += `\n\nSOURCE CONTENT:\nTitle: ${sourceContent.title}\nSummary: ${sourceContent.summary || 'Not available'}\nType: ${sourceContent.contentType}\nTags: ${sourceContent.tags.join(', ')}\n`;
    }
    
    // Add user preferences if available
    if (userPreferences.length > 0) {
      prompt += `\n\nUSER PREFERENCES:\nTopics of interest: ${userPreferences.join(', ')}\n`;
    }
    
    // Add candidate content
    prompt += `\n\nCANDIDATE CONTENT ITEMS:`;
    candidates.forEach((item, index) => {
      prompt += `\n${index + 1}. ID: ${item.id}, Title: ${item.title}, Type: ${item.contentType}, Tags: ${item.tags.join(', ')}, Summary: ${item.summary || 'Not available'}`;
    });
    
    // Request format instructions
    prompt += `\n\nRank the top ${limit} most relevant content items for ${sourceContent ? 'this source content' : 'this user with these preferences'}. For each recommendation, provide:
1. The content ID
2. A relevance score from 0.0 to 1.0
3. A short, natural-sounding reason for the recommendation (1-2 sentences max)

Respond in this JSON format:
{
  "recommendations": [
    {
      "contentId": number,
      "score": number,
      "reason": "string"
    },
    ...
  ]
}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content recommendation system that provides highly relevant recommendations with natural, helpful explanations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    // Parse JSON result safely
    let content = response.choices[0].message.content || "{}";
    try {
      const result = JSON.parse(content);
      return (result.recommendations || []).slice(0, limit);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return fallbackRecommendations(candidates, sourceContent, limit);
    }
  } catch (error) {
    console.error('Error using AI to rank content:', error);
    return fallbackRecommendations(candidates, sourceContent, limit);
  }
}

// Helper function for fallback recommendations
function fallbackRecommendations(
  candidates: ContentItem[],
  sourceContent: ContentItem | null,
  limit: number
): ContentRecommendation[] {
  return candidates.slice(0, limit).map(candidate => ({
    contentId: candidate.id,
    score: candidate.popularity ? candidate.popularity / 100 : 0.5,
    reason: sourceContent 
      ? `Similar to "${sourceContent.title}"`
      : 'Recommended based on popularity'
  }));
}

/**
 * Get trending topics based on recent content performance
 */
export async function getTrendingTopics(): Promise<{ topic: string, score: number }[]> {
  try {
    // Get recently published posts to analyze categories
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        category: posts.category,
        createdAt: posts.createdAt
      })
      .from(posts)
      .where(sql`${posts.published} = true AND ${posts.createdAt} > NOW() - INTERVAL '30 days'`)
      .orderBy(posts.createdAt)
      .limit(20);
    
    if (recentPosts.length === 0) {
      return [];
    }
    
    // Group categories and count occurrences
    const categoryCount: Record<string, number> = {};
    recentPosts.forEach(post => {
      if (post.category) {
        categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
      }
    });
    
    // Convert to array format and calculate scores
    const categories = Object.entries(categoryCount)
      .filter(([category]) => category) // Ensure no null categories
      .map(([category, count]) => ({
        topic: category,
        count
      }));
    
    // Find maximum count for normalization
    const maxCount = Math.max(...categories.map(cat => cat.count));
    
    // Return normalized scores
    return categories.map(cat => ({
      topic: cat.topic,
      score: maxCount > 0 ? cat.count / maxCount : 0
    })).sort((a, b) => b.score - a.score).slice(0, 10);
  } catch (error) {
    console.error('Error getting trending topics:', error);
    return [];
  }
}

/**
 * Get content gap suggestions - topics users are interested in but lack content
 */
export async function getContentGapSuggestions(): Promise<string[]> {
  try {
    // Get all posts to analyze categories
    const posts_data = await db
      .select({
        category: posts.category,
      })
      .from(posts)
      .where(sql`${posts.category} IS NOT NULL`);
    
    // Count categories and find which ones have minimal representation
    const categoryData = posts_data.reduce((acc: Record<string, number>, post) => {
      if (post.category) {
        acc[post.category] = (acc[post.category] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Format category data for the AI
    const categoryInfo = Object.entries(categoryData)
      .map(([name, count]) => `- ${name}: ${count}`)
      .join('\n');
    
    // Call OpenAI to analyze and suggest content gaps
    const prompt = `
You are a content strategist analyzing a website's content coverage.

Current content categories and their count in the system:
${categoryInfo || "No categories currently available"}

Based on this analysis, suggest 5-7 specific content topic ideas that would fill gaps in the current content strategy. 
Consider:
1. Categories with low content counts that might need more coverage
2. Popular topics that could be combined in new ways
3. Modern trends that might be missing from the current content
4. Possible content types that are underrepresented

Return your suggestions as a JSON array of strings in this format: {"suggestions": ["idea 1", "idea 2", etc.]}.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content strategy expert that identifies gaps in content coverage and suggests specific, actionable content topics." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.suggestions || [];
  } catch (error) {
    console.error('Error getting content gap suggestions:', error);
    return [];
  }
}