/**
 * OpenAI Routes
 * 
 * This module provides API routes for OpenAI integration with the application.
 */

import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { isAuthenticated } from '../replitAuth';

// Create a router
const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// Do not change this unless explicitly requested by the user.
const DEFAULT_MODEL = 'gpt-4o';

/**
 * Generate text completion using OpenAI
 * 
 * @route POST /api/openai/completions
 * @body content - The prompt to complete
 */
router.post('/completions', async (req: Request, res: Response) => {
  try {
    const { content, model = DEFAULT_MODEL, maxTokens = 500 } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }
    
    console.log(`[OpenAI] Processing completion request with model: ${model}`);
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant for Dale Loves Whales, responding with cosmic and ocean-related wisdom.' },
        { role: 'user', content }
      ],
      max_tokens: maxTokens,
    });
    
    const message = response.choices[0].message.content;
    
    return res.json({
      text: message,
      model: response.model,
      usage: response.usage
    });
  } catch (error) {
    console.error('[OpenAI] Error generating completion:', error);
    return res.status(500).json({ 
      error: 'Error generating OpenAI completion', 
      message: error.message
    });
  }
});

/**
 * Generate image using OpenAI
 * 
 * @route POST /api/openai/images
 * @body prompt - The image prompt
 */
router.post('/images', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', n = 1 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }
    
    console.log(`[OpenAI] Processing image generation request: ${prompt.substring(0, 50)}...`);
    
    const response = await openai.images.generate({
      prompt,
      model: 'dall-e-3',
      n,
      size,
      quality,
    });
    
    return res.json({
      images: response.data,
    });
  } catch (error) {
    console.error('[OpenAI] Error generating image:', error);
    return res.status(500).json({ 
      error: 'Error generating image', 
      message: error.message
    });
  }
});

/**
 * Process image analysis using OpenAI
 * 
 * @route POST /api/openai/vision
 * @body image - The image URL or base64 data
 * @body prompt - Optional prompt for the analysis
 */
router.post('/vision', async (req: Request, res: Response) => {
  try {
    const { image, prompt = 'Analyze this image in detail and describe its key elements.' } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    console.log('[OpenAI] Processing vision analysis request');
    
    // Determine image format
    let imageUrl: { url: string } | { url: string; detail: string };
    
    if (image.startsWith('http')) {
      // External URL
      imageUrl = { url: image };
    } else if (image.startsWith('data:image')) {
      // Base64 data URL
      imageUrl = { url: image };
    } else {
      // Raw base64 data
      imageUrl = { url: `data:image/jpeg;base64,${image}` };
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: imageUrl }
          ],
        },
      ],
      max_tokens: 800,
    });
    
    const analysis = response.choices[0].message.content;
    
    return res.json({
      analysis,
      model: response.model,
      usage: response.usage
    });
  } catch (error) {
    console.error('[OpenAI] Error analyzing image:', error);
    return res.status(500).json({ 
      error: 'Error analyzing image', 
      message: error.message
    });
  }
});

/**
 * Protected endpoint that requires authentication
 * Example of integrating with Replit Auth
 * 
 * @route POST /api/openai/secured
 */
router.post('/secured', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { content, model = DEFAULT_MODEL, maxTokens = 500 } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }
    
    // Here we have access to the authenticated user through req.user
    const userId = req.user?.claims?.sub;
    console.log(`[OpenAI] Processing secured request for user: ${userId}`);
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant for Dale Loves Whales, responding with cosmic and ocean-related wisdom.' },
        { role: 'user', content }
      ],
      max_tokens: maxTokens,
    });
    
    const message = response.choices[0].message.content;
    
    return res.json({
      text: message,
      model: response.model,
      usage: response.usage
    });
  } catch (error) {
    console.error('[OpenAI] Error in secured endpoint:', error);
    return res.status(500).json({ 
      error: 'Error processing secured request', 
      message: error.message
    });
  }
});

export default router;