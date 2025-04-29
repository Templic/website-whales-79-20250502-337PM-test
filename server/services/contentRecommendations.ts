import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache for embeddings to minimize API calls
const embeddingCache = new Map<string, number[]>();

/**
 * Generate an embedding vector for text using OpenAI's embedding API.
 * Includes caching to reduce API calls.
 * 
 * @param text The text to generate an embedding for
 * @returns An array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Truncate text to avoid exceeding token limits
  const truncatedText = text.substring(0, 8000);
  
  // Check cache first
  const cacheKey = truncatedText;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set. Using placeholder embedding.');
      return generatePlaceholderEmbedding(truncatedText);
    }
    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncatedText,
      encoding_format: "float",
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Cache the result
    embeddingCache.set(cacheKey, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Fall back to placeholder embedding in case of error
    return generatePlaceholderEmbedding(truncatedText);
  }
}

/**
 * Generate a placeholder embedding for testing or when OpenAI API is unavailable.
 * This is a deterministic function that converts text to a vector.
 * 
 * @param text The text to generate a placeholder embedding for
 * @returns A vector representation as an array of numbers
 */
function generatePlaceholderEmbedding(text: string): number[] {
  // Create a consistent hash of the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to seed a pseudorandom number generator
  const seededRandom = (seed: number) => {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  };
  
  const random = seededRandom(hash);
  
  // Generate a 1536-dimensional vector (same as OpenAI's ada-002 model)
  const dimensions = 1536;
  const embedding: number[] = Array(dimensions).fill(0).map(() => random() * 2 - 1);
  
  // Normalize the vector to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two vectors.
 * 
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Cosine similarity (between -1 and 1, where 1 is most similar)
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimensions don't match: ${vecA.length} vs ${vecB.length}`);
  }
  
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  
  // Calculate magnitudes
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  
  // Calculate cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find the most similar items to a source item based on embeddings.
 * 
 * @param sourceEmbedding The embedding of the source item
 * @param candidateEmbeddings Map of item IDs to their embeddings
 * @param limit Number of similar items to return
 * @returns Array of [itemId, similarity] pairs, sorted by similarity (descending)
 */
export function findSimilarItems(
  sourceEmbedding: number[],
  candidateEmbeddings: Map<number, number[]>,
  limit: number = 5
): [number, number][] {
  // Calculate similarity scores for all candidates
  const similarities: [number, number][] = [];
  
  candidateEmbeddings.forEach((embedding, itemId) => {
    try {
      const similarity = calculateCosineSimilarity(sourceEmbedding, embedding);
      similarities.push([itemId, similarity]);
    } catch (error) {
      console.error(`Error calculating similarity for item ${itemId}:`, error);
    }
  });
  
  // Sort by similarity (descending) and take the top 'limit' items
  return similarities
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Extract keywords from text for better tag/topic generation.
 * 
 * @param text The text to extract keywords from
 * @param maxKeywords Maximum number of keywords to extract
 * @returns Array of extracted keywords
 */
export async function extractKeywords(text: string, maxKeywords: number = 5): Promise<string[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set. Using placeholder keywords.');
      return extractPlaceholderKeywords(text, maxKeywords);
    }
    
    // Truncate text to avoid exceeding token limits
    const truncatedText = text.substring(0, 2000);
    
    // Use OpenAI to extract keywords
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Extract up to ${maxKeywords} important keywords from the text as a JSON array of strings. Focus on substantive topics, concepts, and themes.`
        },
        {
          role: "user",
          content: truncatedText
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response content");
    }
    
    const parsed = JSON.parse(responseContent);
    return Array.isArray(parsed.keywords) ? parsed.keywords : [];
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return extractPlaceholderKeywords(text, maxKeywords);
  }
}

/**
 * Extract placeholder keywords when OpenAI API is unavailable.
 * 
 * @param text The text to extract keywords from
 * @param maxKeywords Maximum number of keywords to extract
 * @returns Array of extracted keywords
 */
function extractPlaceholderKeywords(text: string, maxKeywords: number = 5): string[] {
  // Simple keyword extraction based on word frequency
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and take top keywords
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}