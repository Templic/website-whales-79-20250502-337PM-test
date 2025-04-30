/**
 * AI Theme Generator Routes
 * 
 * This module provides endpoints for AI-assisted theme generation.
 * It leverages OpenAI to create themes based on natural language descriptions.
 */

import express from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { isAuthenticated } from '../replitAuth';
import { ThemeTokens } from '../../shared/theme/tokens';
import { db } from '../db';
import { themes } from '../../shared/schema';

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema for theme generation request
const generateThemeSchema = z.object({
  prompt: z.string().min(3).max(500),
  mode: z.enum(['light', 'dark', 'system']).default('system'),
  style: z.enum(['vibrant', 'minimal', 'corporate', 'playful', 'natural']).default('vibrant'),
});

// Schema for theme enhancement request
const enhanceThemeSchema = z.object({
  tokens: z.any(), // Using any because ThemeTokens is complex to model in Zod
  prompt: z.string().min(3).max(500),
});

// Schema for theme accessibility improvement request
const improveAccessibilitySchema = z.object({
  tokens: z.any(), // Using any because ThemeTokens is complex to model in Zod
  contrast: z.enum(['standard', 'high']).default('standard'),
  colorBlindness: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia']).default('none'),
});

/**
 * Generate a theme based on a natural language prompt
 * POST /api/themes/ai/generate
 */
router.post(
  '/generate',
  validateRequest({ body: generateThemeSchema }),
  async (req, res) => {
    try {
      const { prompt, mode, style } = req.body;

      // Prepare system message with context
      const systemMessage = `You are an expert design assistant that helps generate theme tokens for web applications. 
      Generate a theme in ${mode} mode with a ${style} style that matches this description: "${prompt}".
      Your response should be JSON containing theme tokens following this structure:
      {
        "colors": {
          "primary": "hsl value",
          "primaryLight": "hsl value",
          "primaryDark": "hsl value",
          "secondary": "hsl value",
          "accent": "hsl value",
          "background": "hsl value",
          "foreground": "hsl value",
          "muted": "hsl value",
          "mutedForeground": "hsl value"
        },
        "borderRadius": {
          "small": "value in px",
          "medium": "value in px",
          "large": "value in px"
        },
        "spacing": {
          "xs": "value in px",
          "sm": "value in px",
          "md": "value in px",
          "lg": "value in px",
          "xl": "value in px"
        },
        "typography": {
          "fontFamily": "font stack",
          "headings": {
            "fontFamily": "font stack",
            "fontWeight": "value"
          },
          "body": {
            "fontFamily": "font stack",
            "fontWeight": "value",
            "lineHeight": "value"
          }
        },
        "metadata": {
          "name": "theme name based on prompt",
          "description": "brief description of theme based on prompt",
          "tags": ["tag1", "tag2", "tag3"]
        }
      }
      
      Use HSL color format. Ensure proper contrast ratios for accessibility.`;

      // Make OpenAI API call
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Extract the theme tokens from the response
      const content = response.choices[0].message.content;
      
      if (!content) {
        return res.status(500).json({
          error: 'Failed to generate theme',
          message: 'The AI model did not return any content'
        });
      }

      // Parse the response into a ThemeTokens object
      try {
        const themeData = JSON.parse(content);
        
        // Return the generated theme tokens
        res.json({
          tokens: themeData,
          prompt,
          mode,
          style,
          usage: response.usage
        });
      } catch (parseError) {
        console.error('Error parsing theme data:', parseError);
        return res.status(500).json({
          error: 'Failed to parse generated theme',
          message: 'The AI response could not be parsed as JSON'
        });
      }
    } catch (error) {
      console.error('Error generating theme:', error);
      res.status(500).json({
        error: 'Failed to generate theme',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Enhance an existing theme based on a natural language prompt
 * POST /api/themes/ai/enhance
 */
router.post(
  '/enhance',
  validateRequest({ body: enhanceThemeSchema }),
  async (req, res) => {
    try {
      const { tokens, prompt } = req.body;

      // Prepare system message with context
      const systemMessage = `You are an expert design assistant that helps enhance theme tokens for web applications.
      Modify the provided theme tokens according to this instruction: "${prompt}".
      Keep the same structure but update color values, typography, spacing, or border radius as needed.
      Return the complete modified theme as JSON.`;

      // Make OpenAI API call
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: JSON.stringify(tokens) + "\n\nEnhance with: " + prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Extract the enhanced theme tokens from the response
      const content = response.choices[0].message.content;
      
      if (!content) {
        return res.status(500).json({
          error: 'Failed to enhance theme',
          message: 'The AI model did not return any content'
        });
      }

      // Parse the response into a ThemeTokens object
      try {
        const enhancedTheme = JSON.parse(content);
        
        // Return the enhanced theme tokens
        res.json({
          original: tokens,
          enhanced: enhancedTheme,
          prompt,
          usage: response.usage
        });
      } catch (parseError) {
        console.error('Error parsing enhanced theme data:', parseError);
        return res.status(500).json({
          error: 'Failed to parse enhanced theme',
          message: 'The AI response could not be parsed as JSON'
        });
      }
    } catch (error) {
      console.error('Error enhancing theme:', error);
      res.status(500).json({
        error: 'Failed to enhance theme',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Improve the accessibility of a theme
 * POST /api/themes/ai/improve-accessibility
 */
router.post(
  '/improve-accessibility',
  validateRequest({ body: improveAccessibilitySchema }),
  async (req, res) => {
    try {
      const { tokens, contrast, colorBlindness } = req.body;

      // Prepare system message with context
      const systemMessage = `You are an expert in web accessibility that optimizes theme tokens for web applications.
      Modify the provided theme tokens to enhance accessibility with these requirements:
      - Contrast level: ${contrast === 'high' ? 'High (WCAG AAA)' : 'Standard (WCAG AA)'}
      - Color blindness adaptation: ${colorBlindness !== 'none' ? colorBlindness : 'No specific adaptation'}
      
      Return the complete modified theme as JSON with improved color contrast and accessibility.`;

      // Make OpenAI API call
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: JSON.stringify(tokens) }
        ],
        response_format: { type: "json_object" }
      });

      // Extract the accessible theme tokens from the response
      const content = response.choices[0].message.content;
      
      if (!content) {
        return res.status(500).json({
          error: 'Failed to improve accessibility',
          message: 'The AI model did not return any content'
        });
      }

      // Parse the response into a ThemeTokens object
      try {
        const accessibleTheme = JSON.parse(content);
        
        // Return the accessible theme tokens
        res.json({
          original: tokens,
          accessible: accessibleTheme,
          contrast,
          colorBlindness,
          usage: response.usage
        });
      } catch (parseError) {
        console.error('Error parsing accessible theme data:', parseError);
        return res.status(500).json({
          error: 'Failed to parse accessible theme',
          message: 'The AI response could not be parsed as JSON'
        });
      }
    } catch (error) {
      console.error('Error improving accessibility:', error);
      res.status(500).json({
        error: 'Failed to improve accessibility',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Analyze color harmony and accessibility of a theme
 * POST /api/themes/ai/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { tokens } = req.body;

    // Prepare system message with context
    const systemMessage = `You are an expert design analyst that evaluates theme tokens for web applications.
    Analyze the provided theme tokens and provide feedback on:
    1. Color harmony and visual appeal
    2. Accessibility and contrast issues
    3. Typography choices
    4. Overall consistency
    
    Provide the analysis in JSON format with these sections.`;

    // Make OpenAI API call
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: JSON.stringify(tokens) }
      ],
      response_format: { type: "json_object" }
    });

    // Extract the analysis from the response
    const content = response.choices[0].message.content;
    
    if (!content) {
      return res.status(500).json({
        error: 'Failed to analyze theme',
        message: 'The AI model did not return any content'
      });
    }

    // Parse the response into an analysis object
    try {
      const analysis = JSON.parse(content);
      
      // Return the analysis
      res.json({
        theme: tokens,
        analysis,
        usage: response.usage
      });
    } catch (parseError) {
      console.error('Error parsing theme analysis:', parseError);
      return res.status(500).json({
        error: 'Failed to parse theme analysis',
        message: 'The AI response could not be parsed as JSON'
      });
    }
  } catch (error) {
    console.error('Error analyzing theme:', error);
    res.status(500).json({
      error: 'Failed to analyze theme',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate theme variations
 * POST /api/themes/ai/variations
 */
router.post('/variations', async (req, res) => {
  try {
    const { tokens, count = 3 } = req.body;

    // Prepare system message with context
    const systemMessage = `You are an expert design assistant that generates theme variations for web applications.
    Create ${count} variations of the provided theme tokens, keeping the same structure but with different color palettes and subtle changes to typography and spacing.
    Return an array of ${count} complete theme variations as JSON.`;

    // Make OpenAI API call
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: JSON.stringify(tokens) }
      ],
      response_format: { type: "json_object" }
    });

    // Extract the variations from the response
    const content = response.choices[0].message.content;
    
    if (!content) {
      return res.status(500).json({
        error: 'Failed to generate variations',
        message: 'The AI model did not return any content'
      });
    }

    // Parse the response into variations
    try {
      const variations = JSON.parse(content);
      
      // Return the variations
      res.json({
        original: tokens,
        variations,
        count,
        usage: response.usage
      });
    } catch (parseError) {
      console.error('Error parsing theme variations:', parseError);
      return res.status(500).json({
        error: 'Failed to parse theme variations',
        message: 'The AI response could not be parsed as JSON'
      });
    }
  } catch (error) {
    console.error('Error generating theme variations:', error);
    res.status(500).json({
      error: 'Failed to generate variations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;