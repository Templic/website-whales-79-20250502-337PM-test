/**
 * Theme CSS Generator Script
 * 
 * This script generates a CSS file containing all theme variables
 * from the design token system. The result is a static CSS file that
 * can be included in the application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual implementation of CSS variable generation since we can't import TypeScript
function generateThemeVariables() {
  // Define base color values
  const colors = {
    purple: {
      500: 'hsl(265, 89%, 66%)', // Primary purple (#8B5CF6)
    },
    teal: {
      500: 'hsl(182, 100%, 40%)', // Accent teal (#00C2CB)
    },
    success: 'hsl(142, 71%, 45%)', // #22c55e
    warning: 'hsl(38, 92%, 50%)',  // #f59e0b
    danger: 'hsl(0, 84%, 60%)',    // #ef4444
    info: 'hsl(217, 91%, 60%)',    // #3b82f6
  };

  // Define theme mappings
  const themes = {
    light: {
      background: 'hsl(37, 20%, 95%)', // #f5f3f0
      foreground: 'hsl(0, 0%, 18%)',   // #2d2d2d
      card: 'hsl(0, 0%, 100%)',         // #ffffff
      cardForeground: 'hsl(0, 0%, 18%)', // #2d2d2d
      primary: 'hsl(263, 83%, 58%)',     // #7c3aed
      primaryForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
      secondary: 'hsl(37, 23%, 89%)',    // #e9e6df
      secondaryForeground: 'hsl(0, 0%, 18%)', // #2d2d2d
      accent: 'hsl(185, 100%, 40%)',     // #00c2cb
      accentForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
      muted: 'hsl(37, 23%, 89%)',        // #e9e6df
      mutedForeground: 'hsl(0, 0%, 43%)', // #6e6e6e
      border: 'hsl(40, 8%, 85%)',         // #e0dcdc
      input: 'hsl(0, 0%, 100%)',          // #ffffff
      ring: 'hsl(263, 83%, 58%)',         // #7c3aed
    },
    dark: {
      background: 'hsl(225, 23%, 5%)',    // #020817
      foreground: 'hsl(210, 40%, 96%)',   // #e1e7ef
      card: 'hsl(220, 47%, 14%)',         // #101b35
      cardForeground: 'hsl(210, 40%, 96%)', // #e1e7ef
      primary: 'hsl(263, 85%, 66%)',      // #8b5cf6
      primaryForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
      secondary: 'hsl(218, 45%, 18%)',    // #162447
      secondaryForeground: 'hsl(210, 40%, 96%)', // #e1e7ef
      accent: 'hsl(185, 100%, 40%)',      // #00c2cb
      accentForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
      muted: 'hsl(220, 45%, 15%)',        // #121f38
      mutedForeground: 'hsl(215, 25%, 67%)', // #8aa2c8
      border: 'hsl(218, 45%, 21%)',       // #1a2951
      input: 'hsl(220, 45%, 15%)',        // #121f38
      ring: 'hsl(263, 85%, 66%)',         // #8b5cf6
    },
    blackout: {
      background: 'hsl(0, 0%, 0%)',       // #000000
      foreground: 'hsl(280, 100%, 98%)',  // #f8f5ff
      card: 'hsl(260, 87%, 5%)',          // #03021a
      cardForeground: 'hsl(0, 0%, 100%)', // #ffffff
      primary: 'hsl(290, 100%, 50%)',     // #d100ff
      primaryForeground: 'hsl(0, 0%, 100%)', // #ffffff
      secondary: 'hsl(260, 65%, 9%)',     // #0d0a22
      secondaryForeground: 'hsl(0, 0%, 100%)', // #ffffff
      accent: 'hsl(290, 100%, 53%)',       // #c210ff
      accentForeground: 'hsl(0, 0%, 100%)', // #ffffff
      muted: 'hsl(260, 65%, 5%)',          // #070417
      mutedForeground: 'hsl(276, 100%, 86%)', // #c9b8ff
      border: 'hsl(270, 56%, 25%)',        // #2d1a66
      input: 'hsl(260, 65%, 5%)',          // #070417
      ring: 'hsl(290, 100%, 60%)',         // #d254ff
      cosmicGlow: 'rgba(209, 0, 255, 0.4)',
      cosmicShadow: '0 0 20px rgba(209, 0, 255, 0.25)',
      cosmicStardust: 'rgba(102, 0, 255, 0.15)',
    }
  };

  // Convert camelCase to kebab-case for CSS variables
  function toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  let cssVariables = '';
  
  // Generate root variables (shared across all themes)
  cssVariables += ':root {\n';
  
  // Add basic colors
  cssVariables += '  --color-purple-500: ' + colors.purple[500] + ';\n';
  cssVariables += '  --color-teal-500: ' + colors.teal[500] + ';\n';
  cssVariables += '  --color-success: ' + colors.success + ';\n';
  cssVariables += '  --color-warning: ' + colors.warning + ';\n';
  cssVariables += '  --color-danger: ' + colors.danger + ';\n';
  cssVariables += '  --color-info: ' + colors.info + ';\n';
  
  // Add some basic typography and spacing variables
  cssVariables += '  --font-sans: "Space Grotesk", system-ui, sans-serif;\n';
  cssVariables += '  --font-serif: "Cormorant Garamond", serif;\n';
  cssVariables += '  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;\n';
  cssVariables += '  --font-display: "Almendra", serif;\n';
  cssVariables += '  --font-nebula: "Nebula", sans-serif;\n';
  
  cssVariables += '  --radius: 0.5rem;\n';
  cssVariables += '  --radius-sm: 0.25rem;\n';
  cssVariables += '  --radius-md: 0.5rem;\n';
  cssVariables += '  --radius-lg: 0.75rem;\n';
  
  cssVariables += '  --transition-duration: 250ms;\n';
  cssVariables += '  --transition-timing: cubic-bezier(0.16, 1, 0.3, 1);\n';
  
  cssVariables += '}\n\n';
  
  // Generate theme-specific variables
  Object.entries(themes).forEach(([themeName, themeTokens]) => {
    // For each theme variant
    const selector = themeName === 'dark' ? '.dark' : 
                     themeName === 'blackout' ? '.blackout' : 
                     themeName === 'light' ? ':root' : `.${themeName}`;
    
    cssVariables += `${selector} {\n`;
    
    // Add the semantic color mappings
    Object.entries(themeTokens).forEach(([tokenName, value]) => {
      const cssVarName = toKebabCase(tokenName);
      cssVariables += `  --${cssVarName}: ${value};\n`;
    });
    
    // Add HSL versions for Tailwind compatibility
    cssVariables += '\n  /* HSL color values for Tailwind compatibility */\n';
    Object.entries(themeTokens).forEach(([tokenName, value]) => {
      if (typeof value === 'string' && value.startsWith('hsl(')) {
        const cssVarName = toKebabCase(tokenName);
        // Extract HSL values: hsl(222, 47%, 5%) -> 222 47% 5%
        const hslValues = value.replace('hsl(', '').replace(')', '');
        cssVariables += `  --${cssVarName}-hsl: ${hslValues};\n`;
      }
    });
    
    cssVariables += '}\n\n';
  });
  
  // Add contrast modes
  cssVariables += `.contrast-high {\n`;
  cssVariables += `  --contrast-multiplier: 1.2;\n`;
  cssVariables += `  --foreground: hsl(0, 0%, 100%);\n`;
  cssVariables += `  --muted-foreground: hsl(0, 0%, 90%);\n`;
  cssVariables += `  --border: hsl(0, 0%, 100%);\n`;
  cssVariables += `}\n\n`;
  
  cssVariables += `.contrast-maximum {\n`;
  cssVariables += `  --contrast-multiplier: 1.5;\n`;
  cssVariables += `  --background: hsl(0, 0%, 0%);\n`;
  cssVariables += `  --foreground: hsl(0, 0%, 100%);\n`;
  cssVariables += `  --card: hsl(0, 0%, 10%);\n`;
  cssVariables += `  --card-foreground: hsl(0, 0%, 100%);\n`;
  cssVariables += `  --primary: hsl(263, 100%, 70%);\n`;
  cssVariables += `  --accent: hsl(185, 100%, 60%);\n`;
  cssVariables += `  --border: hsl(0, 0%, 100%);\n`;
  cssVariables += `  --muted-foreground: hsl(0, 0%, 90%);\n`;
  cssVariables += `}\n\n`;
  
  // Add motion preferences
  cssVariables += `.motion-full {\n`;
  cssVariables += `  --transition-duration: 250ms;\n`;
  cssVariables += `  --transition-timing: cubic-bezier(0.16, 1, 0.3, 1);\n`;
  cssVariables += `}\n\n`;
  
  cssVariables += `.motion-reduced {\n`;
  cssVariables += `  --transition-duration: 150ms;\n`;
  cssVariables += `  --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);\n`;
  cssVariables += `}\n\n`;
  
  cssVariables += `.motion-none {\n`;
  cssVariables += `  --transition-duration: 0ms;\n`;
  cssVariables += `  --transition-timing: linear;\n`;
  cssVariables += `}\n\n`;
  
  // Add helper classes for reduced motion
  cssVariables += `.reduced-motion *, .motion-none * {\n`;
  cssVariables += `  animation-duration: 0.001ms !important;\n`;
  cssVariables += `  animation-iteration-count: 1 !important;\n`;
  cssVariables += `  transition-duration: 0.001ms !important;\n`;
  cssVariables += `  scroll-behavior: auto !important;\n`;
  cssVariables += `}\n\n`;
  
  return cssVariables;
}

// Main function
function main() {
  console.log('Generating theme CSS from design tokens...');
  
  try {
    // Generate CSS content
    const cssContent = generateThemeVariables();
    
    // Write to file
    const outputPath = path.join(__dirname, '../client/src/styles/generated-theme.css');
    
    // Ensure directory exists
    const directory = path.dirname(outputPath);
    if (!fs.existsSync(directory)) {
      console.log(`Creating directory: ${directory}`);
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(outputPath, cssContent);
    
    console.log(`Theme CSS generated at ${outputPath}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error generating theme CSS:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main();