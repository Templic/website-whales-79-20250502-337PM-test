/**
 * Theme System - Main Exports
 * 
 * This file exports all the components and utilities of the theme system,
 * making them available through a single import.
 * 
 * The enhanced theme system provides comprehensive tools for:
 * - Theme design and management
 * - Accessibility compliance
 * - Privacy controls
 * - Dynamic theme generation
 * - Color manipulation
 * - Semantic analysis
 * - Tailwind CSS integration
 * - Component styling
 * - AI-powered theme analysis
 */

// Token System
export * from './tokens';

// Theme Provider
export { 
  ThemeProvider, 
  useTheme, 
  type ThemeMode, 
  type ThemeContrast, 
  type ThemeMotion 
} from './ThemeContext';

// Privacy Controls
export {
  setThemePrivacyOptions,
  getThemePrivacyOptions,
  resetPrivacyOptions,
  clearAllThemeData
} from './privacyControls';

// Font Loading
export {
  loadFonts,
  preloadCriticalFonts,
  type FontLoadOptions
} from './fontLoader';

// CSS Generation
export {
  generateThemeVariables,
  getThemeVariablesObject,
  injectThemeVariables,
  applyThemeVariablesInline
} from './cssVariables';

// Color Utilities
export {
  // Core color manipulation
  parseColor,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hslToString,
  rgbToString,
  
  // Color operations
  lighten,
  darken,
  saturate,
  desaturate,
  adjustAlpha,
  getComplementary,
  mix,
  
  // Color analysis
  isDarkColor,
  getLuminance,
  getContrastRatio,
  
  // Color generation
  generatePalette,
  getAccessibleTextColor,
  
  // Types
  type RGB,
  type HSL
} from './colorUtils';

// Semantic Analysis
export {
  // Semantic token analysis
  analyzeColorToken,
  analyzeSpacingToken,
  analyzeTokenConsistency,
  suggestTokenName,
  
  // Types
  type SemanticTokenAnalysis,
  type SemanticColorRole,
  type TokenUsageAnalysis,
  type TokenInconsistency
} from './semanticAnalyzer';

// Accessibility
export {
  // Contrast checking
  checkContrast,
  auditThemeContrast,
  isThemeAccessible,
  
  // Accessibility utilities
  getWcagGuidelines,
  generateAccessiblePalette,
  getOptimalFontSize,
  
  // Types
  type AccessibilityCheckOptions,
  type ContrastCheckResult,
  type AccessibilityAuditResult,
  type AccessibilityIssue,
  type AccessibilityWarning
} from './accessibility';

// Theme Transformation
export {
  // Theme generation
  generateTheme,
  themeFromImage,
  
  // Theme conversion
  lightToDarkTheme,
  darkToLightTheme,
  
  // Import/Export
  exportTheme,
  importTheme,
  
  // Types
  type ThemeTransformOptions,
  type GeneratedTheme
} from './themeTransformer';

// PHASE 2: Tailwind CSS Integration

// Tailwind Integration
export {
  // Core utilities
  tokenToTailwindFormat,
  generateTailwindTheme,
  extendTailwindConfig,
  
  // CSS utilities
  tailwindThemeToCssVars,
  generateTailwindUtilities,
  
  // Runtime utilities
  tw,
  cx,
  createVariants,
  
  // Types
  type TailwindThemeExtension
} from './tailwindIntegration';

// Tailwind Variables
export {
  // CSS variable generation
  generateThemeModeVariables,
  generateContrastVariables,
  generateMotionVariables,
  generateSystemPreferenceRules,
  generateResponsiveVariables,
  generateCssVariables,
  injectThemeStylesheet,
  
  // Types
  type ThemeVariablesConfig
} from './tailwindVariables';

// Component Styles
export {
  // Core utilities
  createComponentStyle,
  createComponentLibrary,
  
  // Preset component patterns
  commonComponentPatterns,
  
  // Types
  type StyleVariant,
  type ComponentStyle
} from './componentStyles';

// Build Tool Plugins
export {
  // Vite plugin
  harmonizeThemeVitePlugin,
  
  // Webpack plugin
  HarmonizeThemeWebpackPlugin,
  
  // Rollup plugin
  harmonizeThemeRollupPlugin,
  
  // PostCSS plugin
  harmonizeThemePostCssPlugin
} from './plugins';

// AI-Powered Theme Analysis
export {
  // Analysis utilities
  analyzeTheme,
  getThemeRecommendations,
  generateAITheme,
  getSemanticColorNames,
  generateAccessibleVariations,
  
  // Types
  type ThemeAnalysis,
  type ThemeRecommendation,
  type ThemeGenerationOptions
} from './aiThemeAnalyzer';

// Theme Preview Component
export {
  ThemePreviewPanel,
  type ThemePreviewPanelProps
} from './ThemePreviewPanel';

// Common theme utilities
export const isDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark') || 
         document.documentElement.classList.contains('blackout');
};

export const isHighContrast = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('contrast-high') || 
         document.documentElement.classList.contains('contrast-maximum');
};

export const isReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('motion-reduced') || 
         document.documentElement.classList.contains('motion-none') ||
         document.documentElement.classList.contains('reduced-motion');
};