/**
 * Font Loader
 * 
 * A privacy-focused font loading utility that prioritizes self-hosted fonts
 * and respects user preferences.
 * 
 * Features:
 * - Self-hosted fonts as primary source
 * - Optional fallback to CDN
 * - Respects privacy settings
 * - Uses modern Font Loading API when available
 */

import { getThemePrivacyOptions } from './privacyControls';

// Interface for font configuration
interface FontSource {
  selfHosted: string;
  cdn?: string;
}

interface FontConfig {
  family: string;
  weights: {
    [weight: string]: FontSource;
  };
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

// Define font sources with fallbacks
const fontConfigurations: FontConfig[] = [
  {
    family: 'Almendra',
    display: 'swap',
    weights: {
      '400': {
        selfHosted: '/fonts/Almendra-Regular.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Almendra&display=swap',
      },
      '700': {
        selfHosted: '/fonts/Almendra-Bold.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Almendra:wght@700&display=swap',
      },
    },
  },
  {
    family: 'Cormorant Garamond',
    display: 'swap',
    weights: {
      '300': {
        selfHosted: '/fonts/CormorantGaramond-Light.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&display=swap',
      },
      '400': {
        selfHosted: '/fonts/CormorantGaramond-Regular.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond&display=swap',
      },
      '500': {
        selfHosted: '/fonts/CormorantGaramond-Medium.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&display=swap',
      },
      '600': {
        selfHosted: '/fonts/CormorantGaramond-SemiBold.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap',
      },
      '700': {
        selfHosted: '/fonts/CormorantGaramond-Bold.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap',
      },
    },
  },
  {
    family: 'Space Grotesk',
    display: 'swap',
    weights: {
      '300': {
        selfHosted: '/fonts/SpaceGrotesk-Light.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300&display=swap',
      },
      '400': {
        selfHosted: '/fonts/SpaceGrotesk-Regular.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Space+Grotesk&display=swap',
      },
      '500': {
        selfHosted: '/fonts/SpaceGrotesk-Medium.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&display=swap',
      },
      '600': {
        selfHosted: '/fonts/SpaceGrotesk-SemiBold.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&display=swap',
      },
      '700': {
        selfHosted: '/fonts/SpaceGrotesk-Bold.woff2',
        cdn: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap',
      },
    },
  },
  {
    family: 'Nebula',
    display: 'block',
    weights: {
      '400': {
        selfHosted: '/fonts/Nebula-Regular.woff2',
      },
      '700': {
        selfHosted: '/fonts/Nebula-Bold.woff2',
      },
    },
  },
  // Add other fonts as needed...
];

// Font loading options
export interface FontLoadOptions {
  preferSelfHosted: boolean;
  loadAllWeights: boolean;
  criticalOnly: boolean;
  preload: boolean;
}

const defaultFontOptions: FontLoadOptions = {
  preferSelfHosted: true,
  loadAllWeights: false,
  criticalOnly: true,
  preload: true,
};

/**
 * Load fonts with privacy options
 */
export async function loadFonts(options: Partial<FontLoadOptions> = {}): Promise<void> {
  // Merge options with defaults
  const mergedOptions = { ...defaultFontOptions, ...options };
  
  // Check privacy settings
  const { allowFonts, allowNetworkRequests } = getThemePrivacyOptions();
  
  if (!allowFonts) {
    // Skip font loading if not allowed
    console.log('Font loading disabled by privacy settings');
    return;
  }
  
  // If network requests are disabled, force self-hosted only
  if (!allowNetworkRequests) {
    mergedOptions.preferSelfHosted = true;
  }
  
  // Critical fonts to load first (subset of all fonts)
  const criticalFonts = ['Cormorant Garamond', 'Almendra'];
  
  // Determine which fonts to load
  const fontsToLoad = mergedOptions.criticalOnly 
    ? fontConfigurations.filter(font => criticalFonts.includes(font.family))
    : fontConfigurations;
  
  try {
    // Modern approach: Font Loading API
    if (typeof document !== 'undefined' && 'fonts' in document) {
      await loadWithFontAPI(fontsToLoad, mergedOptions);
    }
    // Fallback approach: CSS @import
    else if (typeof document !== 'undefined') {
      loadWithCSSImport(fontsToLoad, mergedOptions);
    }
  } catch (e) {
    console.error('Error loading fonts:', e);
  }
}

/**
 * Load fonts using the Font Loading API
 */
async function loadWithFontAPI(
  fonts: FontConfig[],
  options: FontLoadOptions
): Promise<void> {
  try {
    // Load each font with fallbacks
    await Promise.all(
      fonts.map(async (fontConfig) => {
        const fontWeights = options.loadAllWeights 
          ? Object.entries(fontConfig.weights) 
          : Object.entries(fontConfig.weights).filter(([weight]) => 
              weight === '400' || weight === '700');
        
        for (const [weight, sources] of fontWeights) {
          // Choose source based on preferences
          const primarySource = options.preferSelfHosted 
            ? sources.selfHosted 
            : (sources.cdn || sources.selfHosted);
          
          try {
            // Create font face
            const font = new FontFace(
              fontConfig.family, 
              `url(${primarySource})`,
              { 
                weight, 
                display: fontConfig.display || 'swap'
              }
            );
            
            // Wait for font to load
            const loadedFont = await font.load();
            
            // Add to document fonts
            document.fonts.add(loadedFont);
            
            if (options.preload) {
              // Add a preload link for the font
              const preloadLink = document.createElement('link');
              preloadLink.rel = 'preload';
              preloadLink.href = primarySource;
              preloadLink.as = 'font';
              preloadLink.type = 'font/woff2';
              preloadLink.crossOrigin = 'anonymous';
              document.head.appendChild(preloadLink);
            }
            
            console.log(`Loaded ${fontConfig.family} (weight: ${weight})`);
          } catch (err) {
            console.warn(`Failed to load ${weight} weight for ${fontConfig.family}`, err);
            
            // Try fallback if primary fails and fallback exists
            const hasFallback = options.preferSelfHosted && sources.cdn;
            
            if (hasFallback) {
              try {
                const fallbackFont = new FontFace(
                  fontConfig.family, 
                  `url(${sources.cdn})`,
                  { 
                    weight, 
                    display: fontConfig.display || 'swap'
                  }
                );
                
                const loadedFallbackFont = await fallbackFont.load();
                document.fonts.add(loadedFallbackFont);
                console.log(`Loaded fallback for ${fontConfig.family} (weight: ${weight})`);
              } catch (fallbackErr) {
                console.error(`Failed to load fallback for ${fontConfig.family}`, fallbackErr);
              }
            }
          }
        }
      })
    );
    
    // Notify that fonts are ready
    document.documentElement.classList.add('fonts-loaded');
  } catch (e) {
    console.error('Font API loading error:', e);
    
    // Fallback to CSS method if Font API fails
    loadWithCSSImport(fonts, options);
  }
}

/**
 * Load fonts using CSS @import as a fallback
 */
function loadWithCSSImport(
  fonts: FontConfig[],
  options: FontLoadOptions
): void {
  if (typeof document === 'undefined') return;
  
  // Create a style element
  const style = document.createElement('style');
  style.type = 'text/css';
  
  let css = '';
  
  // Generate @font-face declarations
  fonts.forEach(fontConfig => {
    const fontWeights = options.loadAllWeights 
      ? Object.entries(fontConfig.weights) 
      : Object.entries(fontConfig.weights).filter(([weight]) => 
          weight === '400' || weight === '700');
    
    fontWeights.forEach(([weight, sources]) => {
      const source = options.preferSelfHosted 
        ? sources.selfHosted 
        : (sources.cdn || sources.selfHosted);
      
      css += `
        @font-face {
          font-family: '${fontConfig.family}';
          font-style: normal;
          font-weight: ${weight};
          font-display: ${fontConfig.display || 'swap'};
          src: url(${source}) format('woff2');
        }
      `;
    });
  });
  
  style.textContent = css;
  document.head.appendChild(style);
  
  // Add class to indicate fonts are loading
  document.documentElement.classList.add('fonts-loading');
  
  // Add class when fonts are loaded (best estimate)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
    });
  } else {
    // Fallback for browsers without document.fonts
    setTimeout(() => {
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
    }, 1000);
  }
}

/**
 * Preload critical fonts
 */
export function preloadCriticalFonts(): void {
  if (typeof document === 'undefined') return;
  
  const { allowFonts, allowNetworkRequests } = getThemePrivacyOptions();
  
  if (!allowFonts) return;
  
  // Critical weights to preload
  const criticalPairs = [
    { family: 'Cormorant Garamond', weight: '400' },
    { family: 'Almendra', weight: '700' }
  ];
  
  criticalPairs.forEach(({ family, weight }) => {
    const fontConfig = fontConfigurations.find(f => f.family === family);
    if (!fontConfig || !fontConfig.weights[weight]) return;
    
    const source = allowNetworkRequests && !fontConfig.weights[weight].selfHosted
      ? fontConfig.weights[weight].cdn
      : fontConfig.weights[weight].selfHosted;
    
    if (!source) return;
    
    // Create preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = source;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  });
}