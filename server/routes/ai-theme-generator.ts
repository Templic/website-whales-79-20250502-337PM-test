/**
 * AI Theme Generator Routes
 * 
 * This module provides the API routes for AI-powered theme generation.
 * It interfaces with OpenAI to create themes based on user input.
 */

import express from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { defaultLightTokens, defaultDarkTokens } from '@shared/theme/defaultThemes';
import { ThemeTokens } from '@shared/theme/tokens';
import { validateRequest } from '../middlewares/validation';
import { analyzeThemeAccessibility } from '@shared/theme/accessibility';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Request validation schema
const themeGenerationSchema = z.object({
  prompt: z.string(),
  name: z.string(),
  baseStyle: z.enum(['modern', 'classic', 'playful', 'corporate', 'minimal']),
  colorPreference: z.enum(['warm', 'cool', 'neutral', 'vibrant', 'pastel', 'dark', 'light']),
  accessibility: z.boolean(),
  complexity: z.number().min(1).max(5),
  description: z.string().optional(),
});

const router = express.Router();

/**
 * POST /api/themes/ai/generate
 * Generates theme tokens using AI
 */
router.post('/generate', validateRequest({ body: themeGenerationSchema }), async (req, res) => {
  try {
    const {
      prompt,
      baseStyle,
      colorPreference,
      accessibility,
      complexity,
    } = req.body;

    // Create prompt for OpenAI
    const systemPrompt = `You are an expert UI/UX designer and design token specialist. 
    Your task is to generate a comprehensive theme for a web application based on the user's preferences.
    The theme should include a set of design tokens following a modern design system approach.
    Always output valid JSON that matches the TypeScript ThemeTokens interface.
    If accessibility is required, ensure all color combinations meet WCAG AA standards with appropriate contrast ratios.`;

    const userPrompt = `Create a theme with the following characteristics:
    - Description: "${prompt}"
    - Base style: ${baseStyle}
    - Color preference: ${colorPreference}
    - Accessibility optimized: ${accessibility ? 'Yes' : 'No'}
    - Complexity level: ${complexity} (on a scale of 1-5)
    
    Generate a complete ThemeTokens object including:
    1. Color tokens (background, foreground, primary, secondary, accent, muted, destructive, etc.)
    2. Typography tokens (font families, sizes, weights, line heights, etc.)
    3. Spacing tokens
    4. Border radius tokens
    5. Shadow tokens
    6. Animation tokens
    7. Component-specific tokens (for buttons, cards, inputs, badges, etc.)
    
    Format the response as a valid JSON object that matches the ThemeTokens interface. 
    Include design insights about your choices.`;

    // Generate tokens using OpenAI
    console.log('Generating theme tokens with OpenAI...');
    const completion = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response content from AI');
    }

    try {
      const jsonResponse = JSON.parse(responseContent);
      let generatedTokens: ThemeTokens;
      let insights: string[] = [];

      // Extract tokens and insights
      if (jsonResponse.tokens && jsonResponse.insights) {
        generatedTokens = jsonResponse.tokens;
        insights = jsonResponse.insights;
      } else if (jsonResponse.theme && jsonResponse.insights) {
        generatedTokens = jsonResponse.theme;
        insights = jsonResponse.insights;
      } else {
        // Assume the entire response is the tokens
        generatedTokens = jsonResponse;
        insights = [];
      }

      // Validate basic token structure
      const requiredProps = [
        'background', 'foreground', 'primary', 'secondary', 
        'typography', 'spacing', 'radius'
      ];
      
      // Check if all required properties exist
      const missingProps = requiredProps.filter(prop => !generatedTokens[prop]);
      
      if (missingProps.length > 0) {
        console.log(`Missing required properties: ${missingProps.join(', ')}`);
        // Fall back to merging with default tokens
        const baseTokens = colorPreference === 'dark' ? defaultDarkTokens : defaultLightTokens;
        generatedTokens = { ...baseTokens, ...generatedTokens };
      }

      // If accessibility is enabled, analyze the theme
      if (accessibility) {
        const accessibilityResults = analyzeThemeAccessibility(generatedTokens);
        const accessibilityInsight = `Accessibility Analysis: The theme has a contrast ratio of ${accessibilityResults.contrastRatio.toFixed(2)}:1 for primary text, which is ${accessibilityResults.passes ? 'compliant' : 'not compliant'} with WCAG AA standards.`;
        insights.push(accessibilityInsight);
      }

      // Return the generated theme
      res.json({
        theme: generatedTokens,
        insights,
        name: req.body.name,
        description: req.body.description || prompt,
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Response content:', responseContent);
      res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: (parseError as Error).message
      });
    }
  } catch (error) {
    console.error('Error generating theme with AI:', error);
    res.status(500).json({ 
      error: 'Failed to generate theme',
      details: (error as Error).message
    });
  }
});

/**
 * POST /api/themes/ai/enhance
 * Enhances an existing theme using AI
 */
router.post('/enhance', async (req, res) => {
  try {
    const { 
      tokens, 
      enhanceOptions = { 
        accessibility: true, 
        contrast: false, 
        colors: false, 
        typography: false 
      } 
    } = req.body;

    // Create prompt for OpenAI
    const systemPrompt = `You are an expert UI/UX designer specializing in enhancing design tokens.
    Your task is to improve an existing theme based on the enhancement options provided.
    Always output valid JSON that matches the TypeScript ThemeTokens interface.`;

    const userPrompt = `Enhance the following theme according to these options:
    - Improve accessibility: ${enhanceOptions.accessibility ? 'Yes' : 'No'}
    - Increase contrast: ${enhanceOptions.contrast ? 'Yes' : 'No'}
    - Refine color palette: ${enhanceOptions.colors ? 'Yes' : 'No'}
    - Optimize typography: ${enhanceOptions.typography ? 'Yes' : 'No'}
    
    Here is the current theme:
    ${JSON.stringify(tokens, null, 2)}
    
    Return the enhanced theme as a valid JSON object, and include a list of improvements made.`;

    // Generate enhanced tokens using OpenAI
    console.log('Enhancing theme tokens with OpenAI...');
    const completion = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response content from AI');
    }

    try {
      const jsonResponse = JSON.parse(responseContent);
      let enhancedTokens: ThemeTokens;
      let improvements: string[] = [];

      // Extract tokens and improvements
      if (jsonResponse.tokens && jsonResponse.improvements) {
        enhancedTokens = jsonResponse.tokens;
        improvements = jsonResponse.improvements;
      } else if (jsonResponse.theme && jsonResponse.improvements) {
        enhancedTokens = jsonResponse.theme;
        improvements = jsonResponse.improvements;
      } else {
        // Assume the entire response is the tokens
        enhancedTokens = jsonResponse;
        improvements = ["Theme enhanced with AI assistance"];
      }

      // Return the enhanced theme
      res.json({
        theme: enhancedTokens,
        improvements,
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: (parseError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error enhancing theme with AI:', error);
    res.status(500).json({ 
      error: 'Failed to enhance theme',
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/themes/ai/analyze
 * Analyzes a theme and provides insights
 */
router.post('/analyze', async (req, res) => {
  try {
    const { tokens } = req.body;

    // Create prompt for OpenAI
    const systemPrompt = `You are an expert UI/UX designer and accessibility specialist.
    Your task is to analyze a theme's design tokens and provide detailed insights.
    Focus on accessibility, visual harmony, usability, and areas for improvement.`;

    const userPrompt = `Analyze this theme and provide detailed insights:
    ${JSON.stringify(tokens, null, 2)}
    
    Please provide:
    1. Accessibility assessment (contrast ratios, readability)
    2. Color harmony analysis
    3. Typography evaluation
    4. Component token consistency
    5. Specific improvement suggestions
    6. Overall theme rating (1-10)
    
    Return your analysis as a JSON object with clear sections and explanations.`;

    // Analyze tokens using OpenAI
    console.log('Analyzing theme tokens with OpenAI...');
    const completion = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response content from AI');
    }

    try {
      const analysis = JSON.parse(responseContent);
      
      // Run local accessibility analysis as well
      const accessibilityResults = analyzeThemeAccessibility(tokens);
      
      // Combine AI analysis with local analysis
      const combinedAnalysis = {
        ...analysis,
        localAccessibility: {
          contrastRatio: accessibilityResults.contrastRatio,
          passes: accessibilityResults.passes,
          wcagLevel: accessibilityResults.wcagLevel,
        }
      };

      // Return the analysis
      res.json(combinedAnalysis);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ 
        error: 'Failed to parse AI analysis',
        details: (parseError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error analyzing theme with AI:', error);
    res.status(500).json({ 
      error: 'Failed to analyze theme',
      details: (error as Error).message 
    });
  }
});

export default router;