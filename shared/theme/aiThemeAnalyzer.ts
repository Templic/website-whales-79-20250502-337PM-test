/**
 * AI-Powered Theme Analyzer
 * 
 * This module provides AI-assisted theme analysis and recommendations
 * using OpenAI's API. It helps analyze theme consistency, accessibility,
 * and provides suggestions for improvements.
 * 
 * Privacy-focused: This module will only send data when explicitly requested,
 * and never sends personally identifiable information.
 */

import OpenAI from 'openai';
import { baseTokens, extendedTokens, type ThemeTokens } from './tokens';
import { ThemeMode, ThemeContrast } from './ThemeContext';
import { checkContrast, type AccessibilityAuditResult } from './accessibility';
import { generatePalette, hexToRgb, rgbToHsl, type HSL } from './colorUtils';

// Setup OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Types for theme analysis
export interface ThemeAnalysis {
  consistency: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  accessibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  semantics: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  usability: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  overall: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export interface ThemeRecommendation {
  type: 'color' | 'spacing' | 'typography' | 'accessibility' | 'general';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix?: string;
  code?: string;
}

export interface ThemeGenerationOptions {
  baseColor?: string;
  mode?: ThemeMode;
  contrast?: ThemeContrast;
  style?: 'minimal' | 'vibrant' | 'professional' | 'playful' | 'elegant';
  industry?: string;
  brandIdentity?: string[];
}

// OpenAI Schema for theme analysis
const analysisSchema = {
  type: 'object',
  properties: {
    consistency: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Score from 0 to 100' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    },
    accessibility: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Score from 0 to 100' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    },
    semantics: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Score from 0 to 100' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    },
    usability: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Score from 0 to 100' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    },
    overall: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Score from 0 to 100' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

/**
 * Analyze a theme with AI assistance
 */
export async function analyzeTheme(
  tokens: ThemeTokens = { ...baseTokens, ...extendedTokens },
  accessibilityResults?: AccessibilityAuditResult
): Promise<ThemeAnalysis> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for AI-powered theme analysis');
  }
  
  try {
    // Prepare theme data for analysis
    const themeData = {
      colors: tokens.colors,
      typography: tokens.typography,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      shadows: tokens.shadows,
      darkMode: tokens.darkMode,
    };
    
    // Include accessibility results if available
    const analysisContext = accessibilityResults 
      ? {
        theme: themeData,
        accessibilityAudit: accessibilityResults,
      } 
      : { theme: themeData };
    
    // Prepare the prompt for AI analysis
    const prompt = `
      Analyze this theme design system for consistency, accessibility, semantic clarity, and usability.
      Provide scores from 0-100 for each category, with specific issues and recommendations.
      
      Focus on:
      1. Color palette consistency and harmony
      2. Typography scale and readability
      3. Spacing system consistency
      4. Semantic naming conventions
      5. Accessibility concerns like contrast and color blindness
      6. Overall usability and user experience
      
      The theme data is provided as a JSON object.
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert UI/UX designer and accessibility specialist who analyzes design systems." },
        { role: "user", content: [
          { type: "text", text: prompt },
          { type: "text", text: JSON.stringify(analysisContext, null, 2) }
        ]},
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    // Parse and return analysis
    const analysis = JSON.parse(response.choices[0].message.content) as ThemeAnalysis;
    return analysis;
  } catch (error) {
    console.error('Error analyzing theme with AI:', error);
    
    // Return a basic analysis if AI fails
    return {
      consistency: {
        score: 0,
        issues: ['AI analysis failed'],
        recommendations: ['Try again later or check your API key'],
      },
      accessibility: {
        score: 0,
        issues: ['AI analysis failed'],
        recommendations: ['Try again later or check your API key'],
      },
      semantics: {
        score: 0,
        issues: ['AI analysis failed'],
        recommendations: ['Try again later or check your API key'],
      },
      usability: {
        score: 0,
        issues: ['AI analysis failed'],
        recommendations: ['Try again later or check your API key'],
      },
      overall: {
        score: 0,
        strengths: [],
        weaknesses: ['AI analysis could not be completed'],
        recommendations: ['Try again later or check your API key'],
      },
    };
  }
}

/**
 * Get specific theme recommendations with AI assistance
 */
export async function getThemeRecommendations(
  tokens: ThemeTokens = { ...baseTokens, ...extendedTokens },
  focusArea?: 'color' | 'typography' | 'spacing' | 'accessibility' | 'all'
): Promise<ThemeRecommendation[]> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for AI-powered theme recommendations');
  }
  
  try {
    // Prepare theme data
    const themeData = focusArea === 'all' || !focusArea
      ? tokens
      : focusArea === 'color'
        ? { colors: tokens.colors, darkMode: tokens.darkMode }
        : focusArea === 'typography'
          ? { typography: tokens.typography }
          : focusArea === 'spacing'
            ? { spacing: tokens.spacing, borderRadius: tokens.borderRadius }
            : { colors: tokens.colors }; // For accessibility
    
    // Prepare focus area description
    const focusAreaDescription = focusArea === 'all' || !focusArea
      ? 'all aspects of the theme'
      : `the theme's ${focusArea} design`;
    
    // Define schema for recommendations
    const recommendationsSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['color', 'spacing', 'typography', 'accessibility', 'general'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          description: { type: 'string' },
          suggestedFix: { type: 'string' },
          code: { type: 'string' },
        },
        required: ['type', 'severity', 'description'],
      },
    };
    
    // Prepare the prompt
    const prompt = `
      Analyze ${focusAreaDescription} and provide specific, actionable recommendations.
      Focus on improving design consistency, accessibility, and user experience.
      
      For each recommendation, include:
      1. Type (color, spacing, typography, accessibility, or general)
      2. Severity (low, medium, high)
      3. Description of the issue
      4. Suggested fix
      5. Code snippet for implementation when applicable
      
      The theme data is provided as a JSON object.
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert UI/UX designer and accessibility specialist who provides actionable recommendations." },
        { role: "user", content: [
          { type: "text", text: prompt },
          { type: "text", text: JSON.stringify(themeData, null, 2) }
        ]},
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    // Parse and return recommendations
    const recommendations = JSON.parse(response.choices[0].message.content) as ThemeRecommendation[];
    return recommendations;
  } catch (error) {
    console.error('Error getting theme recommendations with AI:', error);
    
    // Return basic recommendations if AI fails
    return [{
      type: 'general',
      severity: 'low',
      description: 'Unable to generate AI-powered recommendations.',
      suggestedFix: 'Try again later or check your API key',
    }];
  }
}

/**
 * Generate a new theme with AI assistance
 */
export async function generateAITheme(options: ThemeGenerationOptions = {}): Promise<ThemeTokens> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for AI-powered theme generation');
  }
  
  try {
    // Set default options
    const {
      baseColor = '#3366FF',
      mode = 'light',
      contrast = 'default',
      style = 'professional',
      industry = 'technology',
      brandIdentity = [],
    } = options;
    
    // Derive HSL from base color for better manipulation
    const rgb = hexToRgb(baseColor) || { r: 0, g: 0, b: 0 };
    const hsl = rgbToHsl(rgb);
    
    // Generate a basic color palette
    const basicPalette = generatePalette(baseColor, 9);
    
    // Prepare the prompt for theme generation
    const prompt = `
      Generate a complete design system theme based on these specifications:
      
      Base color: ${baseColor} (H: ${hsl.h}, S: ${hsl.s}%, L: ${hsl.l}%)
      Theme mode: ${mode}
      Contrast level: ${contrast}
      Style: ${style}
      Industry: ${industry}
      Brand identity keywords: ${brandIdentity.join(', ')}
      
      Create a complete theme with:
      1. Color palette (primary, secondary, accent, neutrals, semantic colors)
      2. Typography (font sizes, weights, line heights)
      3. Spacing scale
      4. Border radii
      5. Shadows
      6. Dark mode color variations
      
      The response should be a valid JSON object matching the ThemeTokens structure.
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert design systems architect who creates cohesive, accessible themes." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // Parse generated theme
    const generatedTheme = JSON.parse(response.choices[0].message.content) as ThemeTokens;
    
    // Apply any missing defaults from base tokens
    const finalTheme: ThemeTokens = {
      ...baseTokens,
      ...generatedTheme,
      // Ensure typography has defaults if missing
      typography: {
        ...baseTokens.typography,
        ...generatedTheme.typography,
      },
      // Ensure animations have defaults if missing
      animation: {
        ...baseTokens.animation,
        ...generatedTheme.animation,
      },
    };
    
    return finalTheme;
  } catch (error) {
    console.error('Error generating theme with AI:', error);
    
    // Return base tokens if AI generation fails
    return { ...baseTokens };
  }
}

/**
 * Get AI-generated semantic names for colors
 */
export async function getSemanticColorNames(
  colors: Record<string, string>
): Promise<Record<string, string>> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for AI-powered semantic naming');
  }
  
  try {
    // Prepare the prompt
    const prompt = `
      For each of these colors, provide a semantic name that describes its purpose in a UI design system.
      
      Consider these aspects:
      1. Role (primary, secondary, accent, neutral, etc.)
      2. Function (background, foreground, border, etc.)
      3. State (hover, active, disabled, etc.)
      4. Semantic meaning (success, error, warning, info, etc.)
      
      Return the results as a JSON object with the original color codes as keys and semantic names as values.
      
      Colors to name:
      ${Object.entries(colors).map(([key, value]) => `${key}: ${value}`).join('\n')}
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert in color theory and design systems who creates semantic color naming systems." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
    
    // Parse and return semantic names
    const semanticNames = JSON.parse(response.choices[0].message.content) as Record<string, string>;
    return semanticNames;
  } catch (error) {
    console.error('Error generating semantic color names with AI:', error);
    
    // Return original colors if AI naming fails
    return colors;
  }
}

/**
 * Generate accessible color variations with AI assistance
 */
export async function generateAccessibleVariations(
  colors: Record<string, string>,
  contrastLevel: 'AA' | 'AAA' = 'AA',
  background: string = '#FFFFFF'
): Promise<Record<string, string>> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for AI-powered accessible color variations');
  }
  
  try {
    // Check current contrast scores
    const contrastResults = Object.entries(colors).map(([name, color]) => {
      const contrast = checkContrast(color, background);
      return {
        name,
        color,
        contrast: contrast.ratio,
        passes: contrastLevel === 'AA' ? contrast.AA : contrast.AAA,
      };
    });
    
    // Identify colors needing improvement
    const colorsNeedingImprovement = contrastResults
      .filter(result => !result.passes)
      .map(result => result.name);
    
    if (colorsNeedingImprovement.length === 0) {
      return colors; // All colors already pass contrast requirements
    }
    
    // Prepare the prompt
    const prompt = `
      Adjust these colors to meet ${contrastLevel} contrast requirements against ${background} background.
      
      Maintain the hue of each color as much as possible while adjusting saturation and lightness.
      Return all colors, including those that already pass.
      
      Colors that need improvement:
      ${colorsNeedingImprovement.map(name => `${name}: ${colors[name]}`).join('\n')}
      
      Return results as a JSON object with color names as keys and adjusted hex codes as values.
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an accessibility expert who specializes in creating accessible color combinations." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    // Parse and merge with original colors
    const adjustedColors = JSON.parse(response.choices[0].message.content) as Record<string, string>;
    
    // Return original colors with adjusted ones merged in
    return {
      ...colors,
      ...adjustedColors,
    };
  } catch (error) {
    console.error('Error generating accessible color variations with AI:', error);
    
    // Return original colors if AI adjustment fails
    return colors;
  }
}