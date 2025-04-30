/**
 * Theme Accessibility Module
 * 
 * This module provides comprehensive accessibility tools for the theme system,
 * ensuring that all theme choices meet accessibility standards.
 */

import { getContrastRatio, parseColor, isDarkColor, getAccessibleTextColor as getAccessibleColor, rgbToHsl, hslToString, hslToRgb } from './colorUtils';
import { themeTokenMappings } from './tokens';

// Re-export the function with the name expected by themeTransformer.ts
export const getAccessibleTextColor = getAccessibleColor;

/**
 * Generate an accessible color palette based on a primary color
 * This ensures all generated colors have proper contrast against common backgrounds
 */

// Define minimum contrast ratios according to WCAG guidelines
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;
const WCAG_AAA_LARGE = 4.5;

/**
 * Interface for accessibility checking options
 */
export interface AccessibilityCheckOptions {
  standard: 'AA' | 'AAA';
  largeText: boolean;
  includeEnhanced: boolean;
}

/**
 * Interface for a contrast check result
 */
export interface ContrastCheckResult {
  foreground: string;
  background: string;
  ratio: number;
  passes: {
    aa: {
      normal: boolean;
      large: boolean;
    };
    aaa: {
      normal: boolean;
      large: boolean;
    };
  };
  suggestion?: {
    foreground?: string;
    background?: string;
  };
}

/**
 * Interface for a complete accessibility audit result
 */
export interface AccessibilityAuditResult {
  theme: string;
  timestamp: string;
  overview: {
    passRate: number;
    passCount: number;
    failCount: number;
    issueCount: number;
  };
  contrastChecks: ContrastCheckResult[];
  issues: AccessibilityIssue[];
  warnings: AccessibilityWarning[];
  recommendations: string[];
}

/**
 * Interface for an accessibility issue
 */
export interface AccessibilityIssue {
  type: string;
  component: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  wcagCriteria: string[];
  suggestedFix: string;
}

/**
 * Interface for an accessibility warning
 */
export interface AccessibilityWarning {
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

/**
 * Check contrast between foreground and background colors
 */
export function checkContrast(
  foreground: string,
  background: string,
  options: Partial<AccessibilityCheckOptions> = {}
): ContrastCheckResult {
  // Default options
  const defaultOptions: AccessibilityCheckOptions = {
    standard: 'AA',
    largeText: false,
    includeEnhanced: false
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Calculate contrast ratio
  const ratio = getContrastRatio(foreground, background);
  
  // Check if passes various standards
  const passes = {
    aa: {
      normal: ratio >= WCAG_AA_NORMAL,
      large: ratio >= WCAG_AA_LARGE
    },
    aaa: {
      normal: ratio >= WCAG_AAA_NORMAL,
      large: ratio >= WCAG_AAA_LARGE
    }
  };
  
  // Determine if the current standard is passed
  const standardPassed = opts.standard === 'AA'
    ? (opts.largeText ? passes.aa.large : passes.aa.normal)
    : (opts.largeText ? passes.aaa.large : passes.aaa.normal);
  
  // If not passing, generate suggestions
  let suggestion;
  if (!standardPassed) {
    suggestion = generateContrastSuggestion(foreground, background, opts);
  }
  
  return {
    foreground,
    background,
    ratio,
    passes,
    suggestion
  };
}

/**
 * Generate a suggestion to improve contrast
 */
function generateContrastSuggestion(
  foreground: string,
  background: string,
  options: AccessibilityCheckOptions
): { foreground?: string; background?: string } {
  // Determine minimum required contrast
  let targetRatio: number;
  if (options.standard === 'AA') {
    targetRatio = options.largeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  } else {
    targetRatio = options.largeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL;
  }
  
  // Parse colors
  const fgColor = parseColor(foreground);
  const bgColor = parseColor(background);
  
  // Determine if background is dark
  const isBgDark = isDarkColor(background);
  
  // Initial suggestion - default to adjusting foreground for optimal contrast
  const suggestionFg = getAccessibleTextColor(background);
  
  // Check if suggestion passes
  const suggestionRatio = getContrastRatio(suggestionFg, background);
  
  if (suggestionRatio >= targetRatio) {
    return { foreground: suggestionFg };
  }
  
  // If foreground adjustment doesn't work, suggest background adjustment
  // Darken light backgrounds or lighten dark backgrounds
  const suggestedBg = isBgDark ? '#000000' : '#FFFFFF';
  
  return { 
    foreground: suggestionFg,
    background: suggestedBg
  };
}

/**
 * Check all theme colors for accessibility
 */
export function auditThemeContrast(
  themeName: keyof typeof themeTokenMappings = 'dark',
  options: Partial<AccessibilityCheckOptions> = {}
): AccessibilityAuditResult {
  const theme = themeTokenMappings[themeName];
  const results: AccessibilityAuditResult = {
    theme: themeName,
    timestamp: new Date().toISOString(),
    overview: {
      passRate: 0,
      passCount: 0,
      failCount: 0,
      issueCount: 0
    },
    contrastChecks: [],
    issues: [],
    warnings: [],
    recommendations: []
  };
  
  // Define common color combinations to check
  const combinations = [
    // Text on backgrounds
    { foreground: theme.foreground, background: theme.background, name: 'Text on background' },
    { foreground: theme.foreground, background: theme.card, name: 'Text on card' },
    { foreground: theme.foreground, background: theme.secondary, name: 'Text on secondary' },
    
    // Button text
    { foreground: theme.primaryForeground, background: theme.primary, name: 'Text on primary button' },
    { foreground: theme.secondaryForeground, background: theme.secondary, name: 'Text on secondary button' },
    { foreground: theme.accentForeground, background: theme.accent, name: 'Text on accent element' },
    
    // Muted text
    { foreground: theme.mutedForeground, background: theme.background, name: 'Muted text on background' },
    { foreground: theme.mutedForeground, background: theme.card, name: 'Muted text on card' }
  ];
  
  // Check each combination
  combinations.forEach(combo => {
    const check = checkContrast(combo.foreground, combo.background, options);
    results.contrastChecks.push(check);
    
    // Determine if this passes the selected standard
    const minRatio = options.standard === 'AA'
      ? (options.largeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL)
      : (options.largeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL);
    
    if (check.ratio < minRatio) {
      // Add to issues
      results.issues.push({
        type: 'contrast',
        component: combo.name,
        description: `Insufficient contrast ratio (${check.ratio.toFixed(2)}:1, ${minRatio}:1 required)`,
        impact: check.ratio < 3 ? 'critical' : 'high',
        wcagCriteria: ['1.4.3 Contrast (Minimum)', '1.4.6 Contrast (Enhanced)'],
        suggestedFix: check.suggestion 
          ? `Adjust colors to: ${check.suggestion.foreground || check.foreground} on ${check.suggestion.background || check.background}`
          : 'Increase contrast between text and background'
      });
      
      results.failCount++;
    } else {
      results.passCount++;
    }
  });
  
  // Check for other potential issues
  
  // 1. Check for similar colors that might be hard to distinguish
  const uniqueColors = new Set([
    theme.primary,
    theme.secondary,
    theme.accent,
    theme.background,
    theme.foreground,
    theme.card,
    theme.border,
    theme.muted,
  ]);
  
  // Compare each color with others for similarity
  const colorArray = Array.from(uniqueColors);
  for (let i = 0; i < colorArray.length; i++) {
    for (let j = i + 1; j < colorArray.length; j++) {
      // Skip comparing foreground with background (they should be different)
      if (
        (colorArray[i] === theme.foreground && colorArray[j] === theme.background) ||
        (colorArray[i] === theme.background && colorArray[j] === theme.foreground)
      ) {
        continue;
      }
      
      const contrast = getContrastRatio(colorArray[i], colorArray[j]);
      
      // If colors are too similar, add a warning
      if (contrast < 1.5) {
        results.warnings.push({
          type: 'color-similarity',
          description: `Two colors are very similar (contrast ratio ${contrast.toFixed(2)}:1)`,
          impact: 'medium',
          recommendation: 'Increase difference between colors for better visual distinction'
        });
      }
    }
  }
  
  // 2. Add warnings for potential colorblindness issues
  // This is a simplified check - a complete solution would use color vision deficiency simulation
  results.warnings.push({
    type: 'colorblindness',
    description: 'Theme colors should be tested with colorblindness simulators',
    impact: 'high',
    recommendation: 'Ensure state is not communicated by color alone; use patterns, icons, or text'
  });
  
  // Generate recommendations
  if (results.issues.length > 0) {
    results.recommendations.push(
      'Adjust contrast ratios for failed combinations',
      'Consider using a more accessible color palette',
      'Test with real users including those with vision impairments'
    );
  }
  
  // Calculate pass rate
  const total = results.passCount + results.failCount;
  results.overview.passRate = total > 0 ? (results.passCount / total) * 100 : 100;
  results.overview.issueCount = results.issues.length + results.warnings.length;
  
  return results;
}

/**
 * Get WCAG guidelines for a given component
 */
export function getWcagGuidelines(component: string): string[] {
  const guidelines: Record<string, string[]> = {
    'color': [
      '1.4.1 Use of Color - Color is not used as the only visual means of conveying information',
      '1.4.3 Contrast (Minimum) - Text has a contrast ratio of at least 4.5:1',
      '1.4.6 Contrast (Enhanced) - Text has a contrast ratio of at least 7:1',
      '1.4.11 Non-text Contrast - UI components have at least 3:1 contrast against adjacent colors'
    ],
    'text': [
      '1.4.3 Contrast (Minimum) - Text has a contrast ratio of at least 4.5:1',
      '1.4.4 Resize Text - Text can be resized to 200% without loss of content or function',
      '1.4.5 Images of Text - Use text rather than images of text',
      '1.4.12 Text Spacing - No loss of content when increasing text spacing'
    ],
    'motion': [
      '2.2.2 Pause, Stop, Hide - Moving content can be paused, stopped, or hidden',
      '2.3.1 Three Flashes or Below - No content flashes more than three times per second',
      '2.3.3 Animation from Interactions - Motion animation can be disabled'
    ],
    'keyboard': [
      '2.1.1 Keyboard - All functionality is available from a keyboard',
      '2.1.2 No Keyboard Trap - Keyboard focus can be moved away from a component',
      '2.4.7 Focus Visible - Keyboard focus is clearly visible'
    ],
    'structure': [
      '1.3.1 Info and Relationships - Information and structure can be programmatically determined',
      '1.3.2 Meaningful Sequence - Content is presented in a meaningful order',
      '2.4.1 Bypass Blocks - A mechanism exists to bypass blocks of repeated content',
      '2.4.6 Headings and Labels - Headings and labels describe topic or purpose'
    ]
  };
  
  return guidelines[component] || [];
}

/**
 * Generate an accessible color palette from a base color
 */
export function generateAccessiblePalette(baseColor: string): Record<string, string> {
  const isBaseDark = isDarkColor(baseColor);
  const minContrast = 4.5; // WCAG AA for normal text
  
  // Base text colors
  const textOnDark = '#FFFFFF';
  const textOnLight = '#000000';
  
  // Determine base text color
  const baseText = isBaseDark ? textOnDark : textOnLight;
  
  // Check base contrast
  const baseContrast = getContrastRatio(baseText, baseColor);
  
  // If base doesn't have sufficient contrast, adjust it
  const adjustedBase = baseContrast < minContrast
    ? getAccessibleTextColor(baseColor)
    : baseColor;
  
  // Create the palette
  return {
    base: adjustedBase,
    text: getAccessibleTextColor(adjustedBase),
    border: isBaseDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    focus: isBaseDark ? '#FFFFFF' : '#000000',
    disabled: isBaseDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    overlay: isBaseDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'
  };
}

/**
 * Get optimal font size based on reading distance and visual acuity
 */
export function getOptimalFontSize(
  readingDistance: number = 50, // cm
  minVisualAngle: number = 0.3 // degrees, recommended minimum
): number {
  // Convert visual angle to radians
  const angle = (minVisualAngle * Math.PI) / 180;
  
  // Calculate height (tangent of angle multiplied by distance)
  const height = readingDistance * Math.tan(angle);
  
  // Convert to px (assuming 96 DPI, 1 inch = 2.54 cm)
  const pxPerCm = 96 / 2.54;
  const fontSizePx = height * pxPerCm;
  
  // Return in px
  return Math.round(fontSizePx);
}

/**
 * Check if a theme is accessible
 */
export function isThemeAccessible(
  themeName: keyof typeof themeTokenMappings = 'dark',
  standard: 'AA' | 'AAA' = 'AA'
): { accessible: boolean; issues: AccessibilityIssue[] } {
  const audit = auditThemeContrast(themeName, { standard });
  return {
    accessible: audit.overview.failCount === 0,
    issues: audit.issues
  };
}