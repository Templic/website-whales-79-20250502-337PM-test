/**
 * Theme System Build Plugins
 * 
 * This module provides utilities and plugins that integrate with popular
 * build tools like Vite, webpack, and Rollup to automate theme processing
 * during builds.
 */

import type { Plugin as VitePlugin } from 'vite';
import type { Configuration as WebpackConfig } from 'webpack';
import type { Plugin as RollupPlugin } from 'rollup';
import { baseTokens, extendedTokens, type ThemeTokens } from './tokens'; 
import { generateCssVariables, type ThemeVariablesConfig } from './tailwindVariables';
import { extendTailwindConfig } from './tailwindIntegration';
import type { Config as TailwindConfig } from 'tailwindcss';
import fs from 'fs';
import path from 'path';

// Shared plugin options
interface ThemePluginOptions {
  // Source of theme tokens
  tokens?: ThemeTokens;
  
  // Path to a JSON file containing theme tokens
  tokensPath?: string;
  
  // Output configuration for generated files
  output?: {
    // Directory for generated files
    dir?: string;
    
    // Generate CSS variables file
    cssVars?: {
      enabled: boolean;
      filename?: string;
      minify?: boolean;
    };
    
    // Generate JavaScript/TypeScript theme file
    js?: {
      enabled: boolean;
      filename?: string;
      format?: 'esm' | 'cjs';
      typescript?: boolean;
    };
    
    // Generate documentation
    docs?: {
      enabled: boolean;
      filename?: string;
      format?: 'markdown' | 'html' | 'json';
    };
  };
  
  // Theme variables configuration
  themeConfig?: ThemeVariablesConfig;
  
  // Customize Tailwind CSS integration
  tailwind?: {
    enabled: boolean;
    configPath?: string;
    theme?: TailwindConfig['theme'];
  };
  
  // Enable/disable features
  features?: {
    darkMode?: boolean;
    contrastModes?: boolean;
    motionModes?: boolean;
    responsiveTheme?: boolean;
  };
}

// Default plugin options
const defaultOptions: ThemePluginOptions = {
  tokens: { ...baseTokens, ...extendedTokens },
  output: {
    dir: './dist',
    cssVars: {
      enabled: true,
      filename: 'theme-variables.css',
      minify: false,
    },
    js: {
      enabled: true,
      filename: 'theme.js',
      format: 'esm',
      typescript: false,
    },
    docs: {
      enabled: false,
      filename: 'theme-documentation.md',
      format: 'markdown',
    },
  },
  features: {
    darkMode: true,
    contrastModes: true,
    motionModes: true,
    responsiveTheme: true,
  },
  tailwind: {
    enabled: true,
  },
};

/**
 * Load theme tokens from a file
 */
function loadTokensFromFile(filePath: string): ThemeTokens {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`[Theme Plugin] Error loading tokens from ${filePath}:`, error);
    return { ...baseTokens };
  }
}

/**
 * Generate theme files based on options
 */
function generateThemeFiles(options: ThemePluginOptions): void {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Determine theme tokens source
  const tokens = mergedOptions.tokensPath 
    ? loadTokensFromFile(mergedOptions.tokensPath) 
    : mergedOptions.tokens || { ...baseTokens, ...extendedTokens };
  
  // Create output directory if it doesn't exist
  if (mergedOptions.output?.dir) {
    fs.mkdirSync(mergedOptions.output.dir, { recursive: true });
  }
  
  // Generate CSS variables
  if (mergedOptions.output?.cssVars?.enabled) {
    const filename = path.join(
      mergedOptions.output?.dir || './dist',
      mergedOptions.output.cssVars.filename || 'theme-variables.css'
    );
    
    // Configure theme features
    const themeConfig: ThemeVariablesConfig = {
      ...mergedOptions.themeConfig,
      responsiveTheme: mergedOptions.features?.responsiveTheme ?? true,
    };
    
    // Generate CSS
    const css = generateCssVariables(tokens, themeConfig);
    
    // Write to file
    fs.writeFileSync(filename, css);
  }
  
  // Generate JS/TS theme file
  if (mergedOptions.output?.js?.enabled) {
    const filename = path.join(
      mergedOptions.output?.dir || './dist',
      mergedOptions.output.js.filename || 
        (mergedOptions.output.js.typescript ? 'theme.ts' : 'theme.js')
    );
    
    // Generate JS content
    const jsContent = mergedOptions.output.js.format === 'esm'
      ? `export const theme = ${JSON.stringify(tokens, null, 2)};\n\nexport default theme;\n`
      : `const theme = ${JSON.stringify(tokens, null, 2)};\n\nmodule.exports = theme;\n`;
    
    // Write to file
    fs.writeFileSync(filename, jsContent);
  }
  
  // Generate documentation if enabled
  if (mergedOptions.output?.docs?.enabled) {
    const filename = path.join(
      mergedOptions.output?.dir || './dist',
      mergedOptions.output.docs.filename || 'theme-documentation.md'
    );
    
    // Generate documentation based on format
    let content = '';
    
    switch (mergedOptions.output.docs.format) {
      case 'json':
        content = JSON.stringify({
          theme: tokens,
          metadata: {
            name: 'Harmonize Theme',
            version: '1.0.0',
            description: 'Generated theme documentation',
            features: mergedOptions.features,
          },
        }, null, 2);
        break;
        
      case 'html':
        content = generateHtmlDocumentation(tokens);
        break;
        
      case 'markdown':
      default:
        content = generateMarkdownDocumentation(tokens);
        break;
    }
    
    // Write to file
    fs.writeFileSync(filename, content);
  }
}

/**
 * Generate markdown documentation from theme tokens
 */
function generateMarkdownDocumentation(tokens: ThemeTokens): string {
  let markdown = `# Harmonize Theme Documentation\n\n`;
  
  // Colors
  if (tokens.colors) {
    markdown += `## Colors\n\n`;
    markdown += 'Color tokens used throughout the design system.\n\n';
    
    Object.entries(tokens.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        markdown += `- \`${key}\`: ${value}\n`;
      } else {
        markdown += `### ${key}\n\n`;
        Object.entries(value).forEach(([shade, color]) => {
          markdown += `- \`${key}-${shade}\`: ${color}\n`;
        });
        markdown += '\n';
      }
    });
  }
  
  // Spacing
  if (tokens.spacing) {
    markdown += `## Spacing\n\n`;
    markdown += 'Spacing tokens used for margin, padding, and layout.\n\n';
    
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      markdown += `- \`${key}\`: ${value}\n`;
    });
    markdown += '\n';
  }
  
  // Typography
  if (tokens.typography) {
    markdown += `## Typography\n\n`;
    
    if (tokens.typography.fontFamily) {
      markdown += `### Font Families\n\n`;
      Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
        markdown += `- \`${key}\`: ${Array.isArray(value) ? value.join(', ') : value}\n`;
      });
      markdown += '\n';
    }
    
    if (tokens.typography.fontSize) {
      markdown += `### Font Sizes\n\n`;
      Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
        if (typeof value === 'string') {
          markdown += `- \`${key}\`: ${value}\n`;
        } else {
          markdown += `- \`${key}\`: ${value.size} (line height: ${value.lineHeight})\n`;
        }
      });
      markdown += '\n';
    }
    
    if (tokens.typography.fontWeight) {
      markdown += `### Font Weights\n\n`;
      Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
        markdown += `- \`${key}\`: ${value}\n`;
      });
      markdown += '\n';
    }
  }
  
  // Borders
  if (tokens.borderRadius) {
    markdown += `## Border Radius\n\n`;
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      markdown += `- \`${key}\`: ${value}\n`;
    });
    markdown += '\n';
  }
  
  // Shadows
  if (tokens.shadows) {
    markdown += `## Shadows\n\n`;
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      markdown += `- \`${key}\`: ${value}\n`;
    });
    markdown += '\n';
  }
  
  // Animation
  if (tokens.animation) {
    markdown += `## Animation\n\n`;
    
    if (tokens.animation.duration) {
      markdown += `### Durations\n\n`;
      Object.entries(tokens.animation.duration).forEach(([key, value]) => {
        markdown += `- \`${key}\`: ${value}\n`;
      });
      markdown += '\n';
    }
    
    if (tokens.animation.easing) {
      markdown += `### Easing Functions\n\n`;
      Object.entries(tokens.animation.easing).forEach(([key, value]) => {
        markdown += `- \`${key}\`: ${value}\n`;
      });
      markdown += '\n';
    }
  }
  
  // Breakpoints
  if (tokens.breakpoints) {
    markdown += `## Breakpoints\n\n`;
    Object.entries(tokens.breakpoints).forEach(([key, value]) => {
      markdown += `- \`${key}\`: ${value}\n`;
    });
    markdown += '\n';
  }
  
  // Dark Mode
  if (tokens.darkMode) {
    markdown += `## Dark Mode\n\n`;
    markdown += 'Dark mode overrides specific tokens for dark themes.\n\n';
  }
  
  // Add usage instructions
  markdown += `## Usage\n\n`;
  markdown += `Tokens can be used via CSS variables, Tailwind CSS classes, or directly in JavaScript/TypeScript.\n\n`;
  markdown += `### CSS Variables\n\n`;
  markdown += `\`\`\`css
.element {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
\`\`\`\n\n`;
  
  markdown += `### Tailwind CSS\n\n`;
  markdown += `\`\`\`jsx
<div className="text-primary p-md rounded-md">
  Content
</div>
\`\`\`\n\n`;
  
  markdown += `### JavaScript\n\n`;
  markdown += `\`\`\`js
import { theme } from './theme';

console.log(theme.colors.primary);
\`\`\`\n\n`;
  
  return markdown;
}

/**
 * Generate HTML documentation from theme tokens
 */
function generateHtmlDocumentation(tokens: ThemeTokens): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonize Theme Documentation</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 2rem; }
    h2 { font-size: 2rem; margin-top: 3rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; margin-top: 2rem; }
    .color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
    .color-sample { padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; }
    .color-info { font-family: monospace; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; }
    table td, table th { padding: 0.75rem; border: 1px solid #ddd; }
    table th { background: #f5f5f5; }
    code { font-family: monospace; background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
    .token-section { margin-bottom: 3rem; }
    .token-row { display: flex; margin-bottom: 0.5rem; align-items: center; }
    .token-name { width: 200px; font-family: monospace; }
    .token-value { font-family: monospace; color: #666; }
    .token-visual { margin-left: 1rem; }
  </style>
</head>
<body>
  <h1>Harmonize Theme Documentation</h1>
`;

  // Colors
  if (tokens.colors) {
    html += `<div class="token-section">
      <h2>Colors</h2>
      <div class="color-grid">`;
    
    Object.entries(tokens.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        html += `
        <div>
          <div class="color-sample" style="background-color: ${value};"></div>
          <div class="color-info">
            <div>${key}</div>
            <div>${value}</div>
          </div>
        </div>`;
      } else {
        html += `<h3>${key}</h3><div class="color-grid">`;
        Object.entries(value).forEach(([shade, color]) => {
          html += `
          <div>
            <div class="color-sample" style="background-color: ${color};"></div>
            <div class="color-info">
              <div>${key}-${shade}</div>
              <div>${color}</div>
            </div>
          </div>`;
        });
        html += `</div>`;
      }
    });
    
    html += `</div></div>`;
  }
  
  // Spacing
  if (tokens.spacing) {
    html += `<div class="token-section">
      <h2>Spacing</h2>`;
    
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      html += `
      <div class="token-row">
        <div class="token-name">${key}</div>
        <div class="token-value">${value}</div>
        <div class="token-visual">
          <div style="width: ${value}; height: 20px; background-color: #0066cc;"></div>
        </div>
      </div>`;
    });
    
    html += `</div>`;
  }
  
  // Typography
  if (tokens.typography) {
    html += `<div class="token-section">
      <h2>Typography</h2>`;
    
    if (tokens.typography.fontFamily) {
      html += `<h3>Font Families</h3>`;
      Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
        const fontFamily = Array.isArray(value) ? value.join(', ') : value;
        html += `
        <div class="token-row">
          <div class="token-name">${key}</div>
          <div class="token-value">${fontFamily}</div>
          <div class="token-visual" style="font-family: ${fontFamily};">
            Sample text
          </div>
        </div>`;
      });
    }
    
    if (tokens.typography.fontSize) {
      html += `<h3>Font Sizes</h3>`;
      Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
        const fontSize = typeof value === 'string' ? value : value.size;
        const lineHeight = typeof value === 'string' ? '1.5' : value.lineHeight || '1.5';
        
        html += `
        <div class="token-row">
          <div class="token-name">${key}</div>
          <div class="token-value">${fontSize}</div>
          <div class="token-visual" style="font-size: ${fontSize}; line-height: ${lineHeight};">
            Sample text
          </div>
        </div>`;
      });
    }
    
    if (tokens.typography.fontWeight) {
      html += `<h3>Font Weights</h3>`;
      Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
        html += `
        <div class="token-row">
          <div class="token-name">${key}</div>
          <div class="token-value">${value}</div>
          <div class="token-visual" style="font-weight: ${value};">
            Sample text
          </div>
        </div>`;
      });
    }
    
    html += `</div>`;
  }
  
  // Border Radius
  if (tokens.borderRadius) {
    html += `<div class="token-section">
      <h2>Border Radius</h2>`;
    
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      html += `
      <div class="token-row">
        <div class="token-name">${key}</div>
        <div class="token-value">${value}</div>
        <div class="token-visual">
          <div style="width: 60px; height: 60px; background-color: #0066cc; border-radius: ${value};"></div>
        </div>
      </div>`;
    });
    
    html += `</div>`;
  }
  
  // Shadows
  if (tokens.shadows) {
    html += `<div class="token-section">
      <h2>Shadows</h2>`;
    
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      html += `
      <div class="token-row">
        <div class="token-name">${key}</div>
        <div class="token-value">${value}</div>
        <div class="token-visual">
          <div style="width: 80px; height: 80px; background-color: white; box-shadow: ${value};"></div>
        </div>
      </div>`;
    });
    
    html += `</div>`;
  }
  
  // Usage examples
  html += `
  <div class="token-section">
    <h2>Usage</h2>
    
    <h3>CSS Variables</h3>
    <pre><code>.element {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}</code></pre>

    <h3>Tailwind CSS</h3>
    <pre><code>&lt;div className="text-primary p-md rounded-md"&gt;
  Content
&lt;/div&gt;</code></pre>

    <h3>JavaScript</h3>
    <pre><code>import { theme } from './theme';

console.log(theme.colors.primary);</code></pre>
  </div>
  `;
  
  html += `
</body>
</html>`;

  return html;
}

/**
 * Vite plugin for theme processing
 */
export function harmonizeThemeVitePlugin(options: ThemePluginOptions = {}): VitePlugin {
  const pluginName = 'vite-plugin-harmonize-theme';
  let mergedOptions: ThemePluginOptions;
  
  return {
    name: pluginName,
    
    configResolved(config) {
      // Merge options with defaults once config is resolved
      mergedOptions = { ...defaultOptions, ...options };
      
      // Set output dir to match Vite's output dir if not specified
      if (!mergedOptions.output?.dir) {
        mergedOptions.output = {
          ...mergedOptions.output,
          dir: config.build.outDir,
        };
      }
    },
    
    buildStart() {
      // Generate theme files at build start
      generateThemeFiles(mergedOptions);
    },
    
    // Handle HMR for theme token files in dev mode
    async handleHotUpdate(ctx) {
      if (mergedOptions.tokensPath && ctx.file === mergedOptions.tokensPath) {
        generateThemeFiles(mergedOptions);
        
        // Reload CSS files to reflect theme changes
        return ctx.server.moduleGraph.getModulesByFile(/\.css$/).filter(Boolean);
      }
    },
    
    // Inject theme CSS if configured
    transformIndexHtml(html) {
      if (mergedOptions.output?.cssVars?.enabled) {
        const cssPath = path.join('/', 
          path.relative(mergedOptions.output?.dir || './dist', 
          mergedOptions.output.cssVars.filename || 'theme-variables.css')
        );
        
        return {
          html,
          tags: [
            {
              tag: 'link',
              attrs: {
                rel: 'stylesheet',
                href: cssPath,
              },
              injectTo: 'head',
            },
          ],
        };
      }
      
      return html;
    },
  };
}

/**
 * Webpack plugin for theme processing
 */
export function HarmonizeThemeWebpackPlugin(options: ThemePluginOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  class WebpackPlugin {
    apply(compiler: any) {
      const pluginName = 'HarmonizeThemeWebpackPlugin';
      
      // Hook into the compiler emission
      compiler.hooks.emit.tapAsync(pluginName, (compilation: any, callback: () => void) => {
        try {
          // Generate theme files
          generateThemeFiles(mergedOptions);
          
          // Add CSS file to output if enabled
          if (mergedOptions.output?.cssVars?.enabled) {
            const cssFilename = mergedOptions.output.cssVars.filename || 'theme-variables.css';
            const cssPath = path.join(mergedOptions.output?.dir || './dist', cssFilename);
            
            try {
              const cssContent = fs.readFileSync(cssPath, 'utf8');
              compilation.assets[cssFilename] = {
                source: () => cssContent,
                size: () => cssContent.length,
              };
            } catch (error) {
              console.error(`[${pluginName}] Error reading CSS file:`, error);
            }
          }
          
          // Add JS theme file to output if enabled
          if (mergedOptions.output?.js?.enabled) {
            const jsFilename = mergedOptions.output.js.filename || 'theme.js';
            const jsPath = path.join(mergedOptions.output?.dir || './dist', jsFilename);
            
            try {
              const jsContent = fs.readFileSync(jsPath, 'utf8');
              compilation.assets[jsFilename] = {
                source: () => jsContent,
                size: () => jsContent.length,
              };
            } catch (error) {
              console.error(`[${pluginName}] Error reading JS file:`, error);
            }
          }
          
          callback();
        } catch (error) {
          console.error(`[${pluginName}] Error during build:`, error);
          callback();
        }
      });
      
      // Process Tailwind config if specified
      if (mergedOptions.tailwind?.enabled && mergedOptions.tailwind.configPath) {
        try {
          const tailwindConfigPath = mergedOptions.tailwind.configPath;
          const tailwindConfig = require(path.resolve(tailwindConfigPath));
          const tokens = mergedOptions.tokensPath 
            ? loadTokensFromFile(mergedOptions.tokensPath) 
            : mergedOptions.tokens || { ...baseTokens, ...extendedTokens };
            
          // Extend the Tailwind config with theme tokens
          const extendedConfig = extendTailwindConfig(tailwindConfig, tokens);
          
          // Write the extended config back
          fs.writeFileSync(
            path.resolve(tailwindConfigPath),
            `module.exports = ${JSON.stringify(extendedConfig, null, 2)};`
          );
        } catch (error) {
          console.error(`[${pluginName}] Error processing Tailwind config:`, error);
        }
      }
    }
  }
  
  return new WebpackPlugin();
}

/**
 * Rollup plugin for theme processing
 */
export function harmonizeThemeRollupPlugin(options: ThemePluginOptions = {}): RollupPlugin {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return {
    name: 'harmonize-theme-rollup-plugin',
    
    buildStart() {
      // Generate theme files at build start
      generateThemeFiles(mergedOptions);
    },
    
    // Emit CSS file as part of bundle if enabled
    generateBundle(outputOptions, bundle) {
      if (mergedOptions.output?.cssVars?.enabled) {
        const cssFilename = mergedOptions.output.cssVars.filename || 'theme-variables.css';
        const cssPath = path.join(mergedOptions.output?.dir || './dist', cssFilename);
        
        try {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          this.emitFile({
            type: 'asset',
            fileName: cssFilename,
            source: cssContent,
          });
        } catch (error) {
          console.error('[HarmonizeThemeRollupPlugin] Error emitting CSS file:', error);
        }
      }
      
      // Emit JS theme file as part of bundle if enabled
      if (mergedOptions.output?.js?.enabled) {
        const jsFilename = mergedOptions.output.js.filename || 'theme.js';
        const jsPath = path.join(mergedOptions.output?.dir || './dist', jsFilename);
        
        try {
          const jsContent = fs.readFileSync(jsPath, 'utf8');
          this.emitFile({
            type: 'asset',
            fileName: jsFilename,
            source: jsContent,
          });
        } catch (error) {
          console.error('[HarmonizeThemeRollupPlugin] Error emitting JS file:', error);
        }
      }
    },
  };
}

/**
 * PostCSS plugin for theme processing
 */
export function harmonizeThemePostCssPlugin(options: ThemePluginOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return {
    postcssPlugin: 'postcss-harmonize-theme',
    Once(root: any) {
      // Get theme tokens
      const tokens = mergedOptions.tokensPath 
        ? loadTokensFromFile(mergedOptions.tokensPath) 
        : mergedOptions.tokens || { ...baseTokens, ...extendedTokens };
      
      // Configure theme variables
      const themeConfig: ThemeVariablesConfig = {
        ...mergedOptions.themeConfig,
        responsiveTheme: mergedOptions.features?.responsiveTheme ?? true,
      };
      
      // Generate CSS variables
      const cssVariables = generateCssVariables(tokens, themeConfig);
      
      // Insert at the beginning of the CSS file
      if (cssVariables) {
        const parsedCss = require('postcss').parse(cssVariables);
        root.prepend(parsedCss);
      }
    }
  };
}

harmonizeThemePostCssPlugin.postcss = true;