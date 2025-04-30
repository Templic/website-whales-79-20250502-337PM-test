/**
 * Theme System Types
 * 
 * This module defines TypeScript types used throughout the theme system.
 */

// RGB Color Type
export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// HSL Color Type
export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

// Font size with additional typography properties
export interface FontSizeConfig {
  size: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string;
}

// Typography configuration
export interface TypographyConfig {
  fontFamily?: Record<string, string | string[]>;
  fontSize?: Record<string, string | FontSizeConfig>;
  fontWeight?: Record<string, string>;
  lineHeight?: Record<string, string>;
  letterSpacing?: Record<string, string>;
}

// Animation configuration
export interface AnimationConfig {
  duration?: Record<string, string>;
  easing?: Record<string, string>;
  animations?: Record<string, string>;
  keyframes?: Record<string, Record<string, Record<string, string>>>;
}

// Responsive tokens configuration
export interface ResponsiveTokens {
  colors?: Record<string, string | Record<string, string>>;
  spacing?: Record<string, string>;
  typography?: Partial<TypographyConfig>;
}

// Theme tokens structure
export interface ThemeTokens {
  colors?: Record<string, string | Record<string, string>>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  typography?: TypographyConfig;
  shadows?: Record<string, string>;
  animation?: AnimationConfig;
  breakpoints?: Record<string, string>;
  zIndices?: Record<string, string | number>;
  opacity?: Record<string, string | number>;
  
  // Mode-specific overrides
  darkMode?: {
    colors?: Record<string, string | Record<string, string>>;
    shadows?: Record<string, string>;
  };
  
  blackoutMode?: {
    colors?: Record<string, string | Record<string, string>>;
  };
  
  // Responsive theme variations
  responsive?: Record<string, ResponsiveTokens>;
  
  // Custom extensions
  [key: string]: any;
}

// Theme transformation types
export interface ThemeTransformOptions {
  mode?: 'light' | 'dark' | 'blackout';
  contrast?: 'default' | 'low' | 'high' | 'maximum';
  preserveHues?: boolean;
  preserveRatio?: boolean;
  targetBackground?: string;
  targetForeground?: string;
}

export interface GeneratedTheme {
  tokens: ThemeTokens;
  sourceDescription?: string;
  generationMethod?: string;
  timestamp: number;
}

// Type for the result of a contrast check
export interface ContrastCheckResult {
  ratio: number;
  AA: boolean;
  AALarge: boolean;
  AAA: boolean;
  AAALarge: boolean;
  passes: boolean;
  levelAA?: 'pass' | 'fail';
  levelAAA?: 'pass' | 'fail';
}

// Type for accessibility check options
export interface AccessibilityCheckOptions {
  standards?: 'WCAG2' | 'WCAG3';
  level?: 'AA' | 'AAA';
  includeGraphics?: boolean;
  testColorBlindness?: boolean;
}

// Type for accessibility audit result
export interface AccessibilityAuditResult {
  checks: Array<{
    name: string;
    description: string;
    status: 'pass' | 'fail' | 'warning';
    impact: 'high' | 'medium' | 'low';
    details?: string;
  }>;
  summary: {
    pass: number;
    fail: number;
    warning: number;
    total: number;
    score: number;
  };
  recommendations: string[];
  passCount: number;
  failCount: number;
}

// Accessibility issue type
export interface AccessibilityIssue {
  element: string;
  issue: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  wcag?: string;
  suggestion: string;
}

// Accessibility warning type
export interface AccessibilityWarning {
  element: string;
  warning: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

// Semantic token analysis
export type SemanticColorRole = 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'background' 
  | 'foreground' 
  | 'surface' 
  | 'border' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral' 
  | 'disabled' 
  | 'focus' 
  | 'highlight' 
  | 'interactive';

export interface SemanticTokenAnalysis {
  key: string;
  value: string;
  semanticRole: string;
  suggestedName: string;
  description: string;
  usageContext: string[];
  bestPractices: string[];
  accessibilityNotes: string[];
  relatedTokens: string[];
}

export interface TokenUsageAnalysis {
  token: string;
  value: string;
  usageCount: number;
  locations: string[];
  suggestedAlternatives?: string[];
  inconsistencies?: TokenInconsistency[];
}

export interface TokenInconsistency {
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}