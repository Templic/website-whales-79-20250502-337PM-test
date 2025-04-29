/**
 * AI-Powered Content Service
 * 
 * This service provides AI capabilities for content management including:
 * - Content generation and enhancement
 * - Content summarization
 * - Sentiment analysis
 * - Automatic tagging and categorization
 * - Content recommendations
 * - SEO optimization
 */

import OpenAI from "openai";
import { contentItems } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Content Generation Interface
 */
export interface ContentGenerationRequest {
  topic: string;
  type: 'blog' | 'product' | 'landing' | 'about' | 'newsletter';
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'informative';
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  targetAudience?: string;
}

/**
 * Content Enhancement Interface
 */
export interface ContentEnhancementRequest {
  originalContent: string;
  enhancementType: 'clarity' | 'engagement' | 'seo' | 'readability';
  preserveStructure?: boolean;
  targetReadingLevel?: 'elementary' | 'intermediate' | 'advanced';
}

/**
 * Content Summary Interface
 */
export interface ContentSummaryRequest {
  content: string;
  maxLength?: number;
  format?: 'paragraph' | 'bullets' | 'tweetThread';
  includeKeyInsights?: boolean;
}

/**
 * Sentiment Analysis Result
 */
export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number; // 0 to 1 strength
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  subjectivity: number; // 0 to 1 (objective to subjective)
  confidence: number;
}

/**
 * Content Tags Result
 */
export interface ContentTagsResult {
  mainTopic: string;
  tags: string[];
  categories: string[];
  entities: {
    name: string;
    type: 'person' | 'organization' | 'location' | 'product' | 'event' | 'other';
    relevance: number;
  }[];
  keywords: {
    term: string;
    relevance: number;
  }[];
}

/**
 * Content Recommendations Result
 */
export interface ContentRecommendationsResult {
  relatedContentIds: number[];
  recommendationReason: string;
  recommendationStrength: number;
  suggestedNextSteps: string[];
}

/**
 * SEO Suggestions Result
 */
export interface SEOSuggestionsResult {
  titleSuggestions: string[];
  metaDescriptionSuggestions: string[];
  keywordSuggestions: {
    keyword: string;
    relevance: number;
    competition: number;
  }[];
  contentImprovements: string[];
  structureSuggestions: string[];
  overallScore: number;
}

/**
 * Generate content based on provided parameters
 */
export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const { topic, type, tone = 'professional', length = 'medium', keywords = [], targetAudience = 'general' } = request;

  const lengthGuide = {
    short: "approximately 250-400 words",
    medium: "approximately 600-800 words",
    long: "approximately 1200-1500 words"
  };

  // Create prompt for content generation
  const prompt = `
    Generate ${type} content about "${topic}" with a ${tone} tone.
    Length should be ${lengthGuide[length]}.
    Target audience: ${targetAudience}.
    ${keywords.length > 0 ? `Include these keywords naturally: ${keywords.join(', ')}.` : ''}
    
    The content should be engaging, well-structured, and provide value to the reader.
    Include an attention-grabbing headline, clear sections with subheadings, and a compelling conclusion.
    
    Format the content in Markdown.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert content creator skilled in writing engaging, authoritative, and valuable content for various purposes."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating content with AI:", error);
    throw new Error("Failed to generate content with AI");
  }
}

/**
 * Enhance existing content
 */
export async function enhanceContent(request: ContentEnhancementRequest): Promise<string> {
  const { 
    originalContent, 
    enhancementType, 
    preserveStructure = true, 
    targetReadingLevel = 'intermediate' 
  } = request;

  // Create prompt for content enhancement
  const prompt = `
    Please enhance the following content for improved ${enhancementType}.
    ${preserveStructure ? 'Maintain the original structure and formatting.' : 'Feel free to restructure for optimal quality.'}
    Target reading level: ${targetReadingLevel}.

    ORIGINAL CONTENT:
    ${originalContent}

    Guidelines:
    - Clarity: Improve clarity and flow while maintaining meaning.
    - Engagement: Make the content more engaging and compelling.
    - SEO: Optimize for search engines while maintaining readability.
    - Readability: Simplify and make more readable while preserving key information.
    
    Return the enhanced content in the same format as the original.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert content editor skilled in enhancing content for clarity, engagement, SEO, and readability while preserving the author's voice and intent."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || "Failed to enhance content.";
  } catch (error) {
    console.error("Error enhancing content with AI:", error);
    throw new Error("Failed to enhance content with AI");
  }
}

/**
 * Summarize content
 */
export async function summarizeContent(request: ContentSummaryRequest): Promise<string> {
  const { 
    content, 
    maxLength = 250, 
    format = 'paragraph', 
    includeKeyInsights = true 
  } = request;

  // Create prompt for content summarization
  const prompt = `
    Summarize the following content in ${format} format.
    Keep the summary concise (maximum ${maxLength} words).
    ${includeKeyInsights ? 'Include key insights and important takeaways.' : ''}

    CONTENT TO SUMMARIZE:
    ${content}

    ${format === 'bullets' ? 'Format as bullet points.' : format === 'tweetThread' ? 'Format as a series of tweet-sized chunks (280 characters max per tweet).' : 'Format as a coherent paragraph.'}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert content summarizer skilled in distilling content to its essential points while preserving key information."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || "Failed to summarize content.";
  } catch (error) {
    console.error("Error summarizing content with AI:", error);
    throw new Error("Failed to summarize content with AI");
  }
}

/**
 * Analyze content sentiment
 */
export async function analyzeSentiment(content: string): Promise<SentimentAnalysisResult> {
  const prompt = `
    Analyze the sentiment of the following content.
    Provide a detailed sentiment analysis including:
    - Overall sentiment (positive, negative, neutral, or mixed)
    - Sentiment score (0 to 1, with 1 being strongest)
    - Emotion breakdown (joy, sadness, anger, fear, surprise - each as a 0-1 score)
    - Subjectivity score (0 to 1, with 0 being objective and 1 being subjective)
    - Confidence in the analysis (0 to 1)

    CONTENT TO ANALYZE:
    ${content}

    Format your response as a JSON object with the following structure:
    {
      "sentiment": "positive|negative|neutral|mixed",
      "score": 0.85,
      "emotions": {
        "joy": 0.7,
        "sadness": 0.1,
        "anger": 0.05,
        "fear": 0.0,
        "surprise": 0.3
      },
      "subjectivity": 0.4,
      "confidence": 0.95
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert sentiment analyzer skilled in understanding the emotional tone, sentiment, and subjectivity of text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as SentimentAnalysisResult;
  } catch (error) {
    console.error("Error analyzing sentiment with AI:", error);
    throw new Error("Failed to analyze sentiment with AI");
  }
}

/**
 * Generate tags and categories for content
 */
export async function generateTags(content: string, title?: string): Promise<ContentTagsResult> {
  const prompt = `
    Generate tags, categories, entities, and keywords for the following content.
    ${title ? `Title: ${title}` : ''}

    CONTENT:
    ${content}

    Format your response as a JSON object with the following structure:
    {
      "mainTopic": "Primary topic of the content",
      "tags": ["tag1", "tag2", "tag3", ...],
      "categories": ["category1", "category2", ...],
      "entities": [
        {
          "name": "Entity name",
          "type": "person|organization|location|product|event|other",
          "relevance": 0.95
        },
        ...
      ],
      "keywords": [
        {
          "term": "keyword",
          "relevance": 0.85
        },
        ...
      ]
    }

    Ensure tags and categories are relevant, specific, and useful for content organization.
    Include 5-10 tags and 1-3 categories.
    Extract up to 8 meaningful entities.
    Identify up to 10 important keywords.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert content tagger skilled in extracting relevant tags, categories, entities, and keywords from content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as ContentTagsResult;
  } catch (error) {
    console.error("Error generating tags with AI:", error);
    throw new Error("Failed to generate tags with AI");
  }
}

/**
 * Generate content recommendations
 */
export async function generateRecommendations(
  contentId: number, 
  maxRecommendations = 5
): Promise<ContentRecommendationsResult> {
  try {
    // Get the source content
    const [sourceContent] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));

    if (!sourceContent) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    // Get all other active content
    const allContent = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.isActive, true));

    // Filter out the source content
    const otherContent = allContent.filter(item => item.id !== contentId);

    if (otherContent.length === 0) {
      return {
        relatedContentIds: [],
        recommendationReason: "No other content available for recommendations",
        recommendationStrength: 0,
        suggestedNextSteps: ["Create more content to enable recommendations"]
      };
    }

    // Create a prompt for analyzing content relationships
    const prompt = `
      I need to find related content recommendations.

      SOURCE CONTENT:
      Title: ${sourceContent.title}
      Type: ${sourceContent.type}
      Content: ${sourceContent.content.substring(0, 1500)}...
      Page: ${sourceContent.page}
      Section: ${sourceContent.section}
      Tags: ${sourceContent.tags ? sourceContent.tags.join(", ") : "None"}

      OTHER CONTENT (candidates for recommendations):
      ${otherContent.slice(0, 10).map((item, index) => `
        ID: ${item.id}
        Title: ${item.title}
        Type: ${item.type}
        Content: ${item.content.substring(0, 200)}...
        Page: ${item.page}
        Section: ${item.section}
        Tags: ${item.tags ? item.tags.join(", ") : "None"}
      `).join("\n")}

      Based on content similarity, theme, and relevance, identify the top ${Math.min(maxRecommendations, otherContent.length)} most related content items.
      Provide your response in this JSON format:
      {
        "relatedContentIds": [123, 456, ...],
        "recommendationReason": "Explanation of why these items are related",
        "recommendationStrength": 0.85,
        "suggestedNextSteps": ["Step 1", "Step 2", ...]
      }

      The recommendationStrength should be a number from 0 to 1 indicating how strong the relationship is.
      The suggestedNextSteps should include 2-3 actions that could be taken based on these recommendations.
      Only include IDs from the provided list.
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert content recommendation system skilled in identifying relationships and relevance between different content items."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as ContentRecommendationsResult;
  } catch (error) {
    console.error("Error generating recommendations with AI:", error);
    throw new Error("Failed to generate recommendations with AI");
  }
}

/**
 * Generate SEO suggestions for content
 */
export async function generateSEOSuggestions(
  content: string, 
  title: string, 
  currentMetaDescription?: string
): Promise<SEOSuggestionsResult> {
  const prompt = `
    Analyze the following content for SEO optimization.
    
    TITLE: ${title}
    ${currentMetaDescription ? `CURRENT META DESCRIPTION: ${currentMetaDescription}` : ''}
    
    CONTENT:
    ${content.substring(0, 2000)}...

    Provide SEO enhancement suggestions including:
    - 3 improved title options (each 50-60 characters)
    - 3 meta description suggestions (each 150-160 characters)
    - 10 keyword suggestions with relevance and competition scores
    - 5 content improvement suggestions
    - 3 content structure suggestions
    - An overall SEO score (0-100)

    Format your response as a JSON object with the following structure:
    {
      "titleSuggestions": ["Title 1", "Title 2", "Title 3"],
      "metaDescriptionSuggestions": ["Meta 1", "Meta 2", "Meta 3"],
      "keywordSuggestions": [
        {
          "keyword": "example keyword",
          "relevance": 0.85,
          "competition": 0.65
        },
        ...
      ],
      "contentImprovements": ["Improvement 1", "Improvement 2", ...],
      "structureSuggestions": ["Structure 1", "Structure 2", "Structure 3"],
      "overallScore": 75
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert SEO analyst skilled in content optimization for search engines, keyword research, and technical SEO."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as SEOSuggestionsResult;
  } catch (error) {
    console.error("Error generating SEO suggestions with AI:", error);
    throw new Error("Failed to generate SEO suggestions with AI");
  }
}

/**
 * Extract key concepts and entities from content
 */
export async function extractKeyInsights(content: string): Promise<{
  concepts: string[];
  quotes: string[];
  statistics: string[];
  actionItems: string[];
  questions: string[];
}> {
  const prompt = `
    Extract key insights from the following content.
    
    CONTENT:
    ${content.substring(0, 3000)}...

    Extract and categorize the following elements:
    - Key concepts (5-8 main ideas or themes)
    - Notable quotes (3-5 quotable sentences)
    - Statistics or data points (if any)
    - Action items or takeaways (3-5 points)
    - Questions raised or to consider (2-4 questions)

    Format your response as a JSON object with the following structure:
    {
      "concepts": ["Concept 1", "Concept 2", ...],
      "quotes": ["Quote 1", "Quote 2", ...],
      "statistics": ["Statistic 1", "Statistic 2", ...],
      "actionItems": ["Action 1", "Action 2", ...],
      "questions": ["Question 1", "Question 2", ...]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert content analyst skilled in extracting key insights, themes, quotes, and actionable information from content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error extracting key insights with AI:", error);
    throw new Error("Failed to extract key insights with AI");
  }
}

/**
 * Test the OpenAI API connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user", 
          content: "Return 'Connection successful' if you can read this message."
        }
      ],
      max_tokens: 20
    });
    
    const message = response.choices[0].message.content || "";
    return message.includes("Connection successful");
  } catch (error) {
    console.error("OpenAI API connection test failed:", error);
    return false;
  }
}