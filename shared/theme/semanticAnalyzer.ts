/**
 * Theme Semantic Analyzer
 * 
 * This module helps analyze and create meaningful semantic mappings for design tokens,
 * ensuring tokens are named according to their function rather than their appearance.
 */

import { baseTokens } from './tokens';
import { isDarkColor, getAccessibleTextColor } from './colorUtils';

/**
 * Interface for a semantic token analysis result
 */
export interface SemanticTokenAnalysis {
  // Original token information
  key: string;
  value: string;
  
  // Semantic context
  semanticRole: string;
  suggestedName: string;
  description: string;
  
  // Usage information
  usageContext: string[];
  bestPractices: string[];
  accessibilityNotes: string[];
  
  // Related tokens
  relatedTokens: string[];
}

/**
 * Semantic roles for color tokens
 */
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

/**
 * Map of semantic roles to their descriptions
 */
const semanticRoleDescriptions: Record<SemanticColorRole, string> = {
  primary: 'Main brand color, used for primary actions and key elements',
  secondary: 'Secondary brand color, used for secondary actions and supporting elements',
  accent: 'Accent color used to draw attention to specific elements',
  background: 'Page or container background color',
  foreground: 'Primary text or icon color on a given background',
  surface: 'Card, dialog, or other container surfaces',
  border: 'Border, divider, or outline color',
  success: 'Indicates success or positive state',
  warning: 'Indicates warning or caution',
  danger: 'Indicates error, danger, or destructive actions',
  info: 'Indicates informational or neutral state',
  neutral: 'Neutral color, often used for secondary text or icons',
  disabled: 'Used for disabled elements or text',
  focus: 'Indicates focus state for interactive elements',
  highlight: 'Used to highlight content or sections',
  interactive: 'Indicates interactive elements like links'
};

/**
 * Map of semantic roles to their typical usage contexts
 */
const semanticRoleUsageContexts: Record<SemanticColorRole, string[]> = {
  primary: ['Buttons', 'Links', 'Active navigation items', 'Selected state indicators'],
  secondary: ['Secondary buttons', 'Less prominent UI elements', 'Alternate emphasis'],
  accent: ['Badges', 'Highlights', 'Call-to-action elements', 'Visual anchors'],
  background: ['Page background', 'Container background', 'App canvas'],
  foreground: ['Body text', 'Headings', 'Icons on backgrounds'],
  surface: ['Cards', 'Dialogs', 'Dropdown menus', 'Interactive surfaces'],
  border: ['Input fields', 'Cards', 'Dividers', 'Separators'],
  success: ['Success messages', 'Completed actions', 'Positive metrics'],
  warning: ['Warning messages', 'Alert states', 'Caution indicators'],
  danger: ['Error messages', 'Destructive actions', 'Critical alerts'],
  info: ['Information messages', 'Help text', 'Neutral indicators'],
  neutral: ['Secondary text', 'Subtle UI elements', 'Decorative elements'],
  disabled: ['Disabled buttons', 'Inactive elements', 'Unavailable features'],
  focus: ['Focus rings', 'Selected form elements', 'Keyboard navigation indicators'],
  highlight: ['Text selections', 'Search results', 'Content emphasis'],
  interactive: ['Links', 'Interactive controls', 'Clickable elements']
};

/**
 * Map of semantic roles to best practices
 */
const semanticRoleBestPractices: Record<SemanticColorRole, string[]> = {
  primary: [
    'Ensure sufficient contrast with backgrounds',
    'Use sparingly to maintain importance',
    'Consider cultural associations of the color'
  ],
  secondary: [
    'Should complement primary color',
    'Use for secondary actions and supporting elements',
    'Should be distinct but not compete with primary color'
  ],
  accent: [
    'Use sparingly to highlight important elements',
    'Ensure it stands out from primary and secondary colors',
    'Consider vibrant colors that grab attention'
  ],
  background: [
    'Should provide good contrast for foreground content',
    'Consider patterns and texture for visual interest',
    'Support for both light and dark modes'
  ],
  foreground: [
    'Must meet WCAG contrast requirements on background',
    'Consider multiple weight variants for varied emphasis',
    'Test readability at different font sizes'
  ],
  surface: [
    'Should be subtly different from background',
    'Consider elevation with subtle shadows',
    'Support for interactive states (hover, active)'
  ],
  border: [
    'Use to create subtle visual separation',
    'Consider varied opacity levels for different emphasis',
    'Should be visible but not dominant'
  ],
  success: [
    'Universally associated with positive outcomes (often green)',
    'Use consistently across the application',
    'Ensure it\'s distinguishable for colorblind users'
  ],
  warning: [
    'Universally associated with caution (often amber/yellow)',
    'Use when user attention is needed but not critical',
    'Ensure good contrast for text content'
  ],
  danger: [
    'Universally associated with errors or danger (often red)',
    'Use for destructive actions or critical errors',
    'Consider adding icons to reinforce meaning'
  ],
  info: [
    'Often blue or neutral in color',
    'Use for neutral or informational messaging',
    'Should be distinguishable from other status colors'
  ],
  neutral: [
    'Use for secondary content and subtle elements',
    'Should recede visually compared to primary content',
    'Consider multiple variants for hierarchy'
  ],
  disabled: [
    'Should clearly indicate element is not interactive',
    'Use reduced contrast but maintain readability',
    'Consider adding other visual cues beyond color'
  ],
  focus: [
    'Must be clearly visible for accessibility',
    'Should surround the focused element completely',
    'Consider high-contrast colors that stand out'
  ],
  highlight: [
    'Use to draw attention to specific content',
    'Should stand out from surrounding content',
    'Consider animation for temporary highlights'
  ],
  interactive: [
    'Should indicate element is clickable or interactive',
    'Consider hover, active, and focus states',
    'Consistent usage throughout application'
  ]
};

/**
 * Analyze a color token and suggest semantic naming
 */
export function analyzeColorToken(
  key: string,
  value: string,
  currentContext: string = ''
): SemanticTokenAnalysis {
  // Determine if the color is dark or light
  const isDark = isDarkColor(value);
  const suggestedTextColor = getAccessibleTextColor(value);
  
  // Attempt to determine semantic role based on name and context
  let semanticRole: SemanticColorRole = 'neutral';
  let suggestedName = key;
  
  // Check key for common naming patterns
  if (key.includes('primary')) semanticRole = 'primary';
  else if (key.includes('secondary')) semanticRole = 'secondary';
  else if (key.includes('accent')) semanticRole = 'accent';
  else if (key.includes('background')) semanticRole = 'background';
  else if (key.includes('foreground') || key.includes('text')) semanticRole = 'foreground';
  else if (key.includes('surface') || key.includes('card')) semanticRole = 'surface';
  else if (key.includes('border') || key.includes('divider')) semanticRole = 'border';
  else if (key.includes('success')) semanticRole = 'success';
  else if (key.includes('warning')) semanticRole = 'warning';
  else if (key.includes('danger') || key.includes('error')) semanticRole = 'danger';
  else if (key.includes('info')) semanticRole = 'info';
  else if (key.includes('disabled')) semanticRole = 'disabled';
  else if (key.includes('focus')) semanticRole = 'focus';
  else if (key.includes('highlight')) semanticRole = 'highlight';
  else if (key.includes('link') || key.includes('button')) semanticRole = 'interactive';
  
  // If context is provided, use it to refine the role
  if (currentContext) {
    if (currentContext.includes('button')) semanticRole = 'interactive';
    else if (currentContext.includes('alert') && currentContext.includes('success')) semanticRole = 'success';
    else if (currentContext.includes('alert') && currentContext.includes('warning')) semanticRole = 'warning';
    else if (currentContext.includes('alert') && currentContext.includes('error')) semanticRole = 'danger';
    else if (currentContext.includes('card') || currentContext.includes('dialog')) semanticRole = 'surface';
    // Add more context-based rules as needed
  }
  
  // Generate suggested semantic name based on role
  if (key.includes('color') || key.startsWith('color')) {
    // Replace generic 'color' with semantic role
    suggestedName = key.replace(/color|color-/i, `${semanticRole}-`);
  } else if (!Object.keys(semanticRoleDescriptions).some(role => key.includes(role))) {
    // If the key doesn't already contain a semantic role, suggest adding one
    suggestedName = `${semanticRole}-${key}`;
  }
  
  // Collect related tokens
  const relatedTokens = findRelatedTokens(key, semanticRole);
  
  // Find a better suggestion for names that are still generic
  if (suggestedName === key && !suggestedName.includes(semanticRole)) {
    suggestedName = `${semanticRole}${suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1)}`;
  }
  
  // Prepare accessibility notes
  const accessibilityNotes = [
    `Color is ${isDark ? 'dark' : 'light'}, best text color would be ${suggestedTextColor}`,
    `Use with caution in ${semanticRole === 'foreground' ? 'backgrounds' : 'text'} to ensure adequate contrast`,
  ];
  
  // If it's a status color, add specific accessibility notes
  if (['success', 'warning', 'danger', 'info'].includes(semanticRole)) {
    accessibilityNotes.push(
      'Remember that color alone should not convey meaning; use additional indicators',
      'Consider accessibility for colorblind users with additional visual cues'
    );
  }
  
  return {
    key,
    value,
    semanticRole,
    suggestedName,
    description: semanticRoleDescriptions[semanticRole] || 'General purpose color',
    usageContext: semanticRoleUsageContexts[semanticRole] || [],
    bestPractices: semanticRoleBestPractices[semanticRole] || [],
    accessibilityNotes,
    relatedTokens,
  };
}

/**
 * Find tokens related to the current token
 */
function findRelatedTokens(key: string, role: SemanticColorRole): string[] {
  const related: string[] = [];
  
  // Find tokens with similar role
  const relatedRoles: Record<SemanticColorRole, SemanticColorRole[]> = {
    primary: ['secondary', 'accent'],
    secondary: ['primary', 'accent'],
    accent: ['primary', 'secondary', 'highlight'],
    background: ['surface', 'foreground'],
    foreground: ['background', 'surface'],
    surface: ['background', 'border'],
    border: ['surface', 'background'],
    success: ['warning', 'danger', 'info'],
    warning: ['success', 'danger', 'info'],
    danger: ['success', 'warning', 'info'],
    info: ['success', 'warning', 'danger'],
    neutral: ['background', 'foreground', 'border'],
    disabled: ['neutral', 'interactive'],
    focus: ['interactive', 'highlight'],
    highlight: ['accent', 'focus'],
    interactive: ['primary', 'focus']
  };
  
  // Add related roles
  (relatedRoles[role] || []).forEach(relatedRole => {
    related.push(`${relatedRole}`);
  });
  
  // If token has variations (like primary-light, primary-dark)
  const baseNameMatch = key.match(/^([a-z]+)-([a-z]+)/);
  if (baseNameMatch) {
    const baseName = baseNameMatch[1];
    const variant = baseNameMatch[2];
    
    // Add opposite variant if exists
    if (variant === 'light') related.push(`${baseName}-dark`);
    if (variant === 'dark') related.push(`${baseName}-light`);
    
    // Add hover, active states if relevant
    if (['hover', 'active', 'focus'].includes(variant)) {
      ['hover', 'active', 'focus'].filter(v => v !== variant).forEach(v => {
        related.push(`${baseName}-${v}`);
      });
    }
  }
  
  return related;
}

/**
 * Analyze a spacing token and suggest semantic naming
 */
export function analyzeSpacingToken(
  key: string,
  value: string
): SemanticTokenAnalysis {
  // Determine numeric value if possible
  let numericValue = 0;
  if (typeof value === 'string') {
    const match = value.match(/^([\d.]+)(px|rem|em)$/);
    if (match) {
      numericValue = parseFloat(match[1]);
      if (match[2] === 'px') {
        numericValue = numericValue / 16; // Convert to approximate rem for comparison
      }
    }
  }
  
  // Semantic size categories
  const sizeCategories = [
    { name: 'none', range: [0, 0], description: 'No spacing' },
    { name: 'xs', range: [0.01, 0.25], description: 'Extra small spacing' },
    { name: 'sm', range: [0.26, 0.5], description: 'Small spacing' },
    { name: 'md', range: [0.51, 1], description: 'Medium spacing' },
    { name: 'lg', range: [1.01, 2], description: 'Large spacing' },
    { name: 'xl', range: [2.01, 3], description: 'Extra large spacing' },
    { name: '2xl', range: [3.01, 4], description: 'Double extra large spacing' },
    { name: '3xl', range: [4.01, 6], description: 'Triple extra large spacing' },
    { name: '4xl', range: [6.01, 8], description: 'Quadruple extra large spacing' },
    { name: '5xl', range: [8.01, 16], description: 'Maximum spacing' },
  ];
  
  // Determine size category
  let category = sizeCategories.find(cat => 
    numericValue >= cat.range[0] && numericValue <= cat.range[1]
  ) || sizeCategories[5]; // Default to 'xl' if not found
  
  // Common spacing use cases
  const usageContexts = {
    none: ['Adjacent elements with no spacing', 'Collapse spacing', 'Removing default spacing'],
    xs: ['Tight spacing between related elements', 'Icon padding', 'Compact UIs'],
    sm: ['Form field padding', 'Button padding', 'Compact list items'],
    md: ['Standard element spacing', 'Default padding', 'List item spacing'],
    lg: ['Section spacing', 'Card padding', 'Generous form spacing'],
    xl: ['Major section divisions', 'Large component padding', 'Hero section spacing'],
    '2xl': ['Page section spacing', 'Major layout divisions', 'Featured content highlighting'],
    '3xl': ['Major page sections', 'Dramatic separations', 'Large component spacing'],
    '4xl': ['Full-width section dividers', 'Major layout blocks', 'Showcase spacing'],
    '5xl': ['Maximum layout spacing', 'Hero separations', 'Dramatic whitespace']
  };
  
  // Best practices for spacing
  const bestPractices = [
    'Use consistent spacing throughout the interface',
    'Prefer the spacing scale over arbitrary values',
    'Consider component density and user tasks when selecting spacing',
    'Maintain hierarchy with varied spacing',
    'Scale spacing proportionally on different screen sizes'
  ];
  
  // Generate suggested semantic name
  let suggestedName = key;
  
  // Check for existing semantic naming pattern
  if (!key.includes('space-') && !key.includes('spacing-')) {
    suggestedName = `space-${category.name}`;
  }
  
  // Related tokens - find nearby sizes
  const categoryIndex = sizeCategories.findIndex(cat => cat.name === category.name);
  const relatedTokens = [];
  
  if (categoryIndex > 0) {
    relatedTokens.push(`space-${sizeCategories[categoryIndex - 1].name}`);
  }
  
  if (categoryIndex < sizeCategories.length - 1) {
    relatedTokens.push(`space-${sizeCategories[categoryIndex + 1].name}`);
  }
  
  return {
    key,
    value,
    semanticRole: 'spacing',
    suggestedName,
    description: category.description,
    usageContext: usageContexts[category.name] || [],
    bestPractices,
    accessibilityNotes: [
      'Adequate spacing improves readability and touch targets',
      'Consider larger spacing for accessibility-focused interfaces',
      'Maintain sufficient spacing between interactive elements (minimum 8px)'
    ],
    relatedTokens
  };
}

/**
 * Analyze token usage across the application
 */
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

/**
 * Analyze for inconsistencies in token naming
 */
export function analyzeTokenConsistency(): TokenInconsistency[] {
  const inconsistencies: TokenInconsistency[] = [];
  
  // Check for consistent naming patterns in colors
  const colorTokens = Object.entries(baseTokens.colors.cosmic);
  
  // Check for mixed naming conventions
  const namingPatterns = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    kebabCase: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    snakeCase: /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
  };
  
  let dominantPattern = '';
  const patternCounts = { camelCase: 0, kebabCase: 0, snakeCase: 0 };
  
  // Count naming patterns
  colorTokens.forEach(([key]) => {
    if (typeof key === 'string') {
      if (namingPatterns.camelCase.test(key)) patternCounts.camelCase++;
      else if (namingPatterns.kebabCase.test(key)) patternCounts.kebabCase++;
      else if (namingPatterns.snakeCase.test(key)) patternCounts.snakeCase++;
    }
  });
  
  // Determine dominant pattern
  dominantPattern = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Check for inconsistent patterns
  colorTokens.forEach(([key]) => {
    if (typeof key === 'string') {
      let currentPattern = '';
      if (namingPatterns.camelCase.test(key)) currentPattern = 'camelCase';
      else if (namingPatterns.kebabCase.test(key)) currentPattern = 'kebabCase';
      else if (namingPatterns.snakeCase.test(key)) currentPattern = 'snakeCase';
      
      if (currentPattern && currentPattern !== dominantPattern) {
        inconsistencies.push({
          issue: `Inconsistent naming pattern: ${key} uses ${currentPattern} while most tokens use ${dominantPattern}`,
          suggestion: `Rename to follow ${dominantPattern} convention`,
          impact: 'medium'
        });
      }
    }
  });
  
  return inconsistencies;
}

/**
 * Generate a comprehensive name suggestion for a token
 */
export function suggestTokenName(value: string, context: string = ''): string {
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
    const analysis = analyzeColorToken('color', value, context);
    return analysis.suggestedName;
  }
  
  if (typeof value === 'string' && value.match(/^[\d.]+(px|rem|em)$/)) {
    const analysis = analyzeSpacingToken('space', value);
    return analysis.suggestedName;
  }
  
  // Default with context
  if (context) {
    return `${context.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  return 'token';
}