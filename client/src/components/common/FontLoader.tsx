/**
 * Font Loader Component
 * 
 * Optimizes font loading and rendering using resource hints, preloading, and font-display strategies.
 * Supports Google Fonts, local fonts, and custom font loading strategies.
 */

import React, { useEffect, useState } from 'react';

export interface FontDefinition {
  /** Font family name */
  family: string;
  /** Font weights to load (400, 700, etc.) */
  weights?: number[];
  /** Font styles to load (normal, italic, etc.) */
  styles?: ('normal' | 'italic')[];
  /** Font display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** URL for self-hosted fonts (if not using Google Fonts) */
  url?: string;
  /** Whether this is a variable font */
  variable?: boolean;
  /** Font source (defaults to 'google') */
  source?: 'google' | 'local' | 'custom';
  /** Custom font format for self-hosted fonts */
  format?: 'woff' | 'woff2' | 'truetype' | 'opentype' | 'svg' | 'embedded-opentype';
  /** CSS unicode-range for the font */
  unicodeRange?: string;
  /** Whether this font is critical for first paint */
  critical?: boolean;
}

export interface FontLoaderProps {
  /** Font definitions to load */
  fonts: FontDefinition[];
  /** Default font display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Default font weights to load */
  weights?: number[];
  /** Default font styles to load */
  styles?: ('normal' | 'italic')[];
  /** Whether to preload fonts */
  preload?: boolean;
  /** Whether to add font-loading classes to body */
  addBodyClass?: boolean;
  /** Timeout in ms for font loading (0 = disable) */
  timeout?: number;
  /** Custom font loading callback */
  onFontsLoaded?: () => void;
}

/**
 * Font Loader Component
 * 
 * Optimizes font loading using best practices:
 * - Preconnect to font sources
 * - Preload critical fonts
 * - Use font-display for progressive enhancement
 * - Add body classes for font loading states
 */
const FontLoader: React.FC<FontLoaderProps> = ({
  fonts,
  display = 'swap',
  weights = [400, 700],
  styles = ['normal'],
  preload = true,
  addBodyClass = true,
  timeout = 3000,
  onFontsLoaded
}) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Sort fonts by criticality
  const criticalFonts = fonts.filter(font => font.critical);
  const nonCriticalFonts = fonts.filter(font => !font.critical);
  
  useEffect(() => {
    // Add font loading class to body if enabled
    if (addBodyClass) {
      document.body.classList.add('fonts-loading');
    }
    
    // Track loaded fonts
    const fontFacePromises: Promise<FontFace>[] = [];
    const fontFaceObservers: Promise<void>[] = [];
    
    // Load Google Fonts
    const googleFonts = fonts.filter(font => !font.url || font.source === 'google');
    
    if (googleFonts.length > 0) {
      const googleFontUrl = createGoogleFontUrl(googleFonts, weights, styles, display);
      
      // Create a link element for Google Fonts
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = googleFontUrl;
      
      // Create a promise to track when the font stylesheet is loaded
      const linkPromise = new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => {
          console.error(`Failed to load Google Fonts: ${googleFontUrl}`);
          resolve(); // Resolve anyway to prevent blocking
        };
      });
      
      fontFaceObservers.push(linkPromise);
      document.head.appendChild(link);
    }
    
    // Load self-hosted fonts
    const selfHostedFonts = fonts.filter(font => font.url);
    
    selfHostedFonts.forEach(font => {
      const fontWeights = font.weights || weights;
      const fontStyles = font.styles || styles;
      const fontDisplay = font.display || display;
      
      fontWeights.forEach(weight => {
        fontStyles.forEach(style => {
          try {
            const fontFace = new FontFace(
              font.family,
              `url(${font.url})`,
              {
                weight: weight.toString(),
                style,
                display: fontDisplay,
                unicodeRange: font.unicodeRange
              }
            );
            
            // Add font to document fonts collection
            const fontPromise = fontFace.load().then(loadedFace => {
              document.fonts.add(loadedFace);
              return loadedFace;
            }).catch(err => {
              console.error(`Failed to load font: ${font.family}`, err);
              return fontFace; // Return anyway to prevent blocking
            });
            
            fontFacePromises.push(fontPromise);
          } catch (err) {
            console.error(`Error creating FontFace: ${font.family}`, err);
          }
        });
      });
    });
    
    // Wait for all font faces to load or timeout
    const allPromise = Promise.all([
      ...fontFacePromises,
      ...fontFaceObservers
    ]);
    
    const fontLoadingPromise = timeout > 0
      ? Promise.race([
          allPromise, 
          new Promise(resolve => setTimeout(resolve, timeout))
        ])
      : allPromise;
    
    fontLoadingPromise.then(() => {
      setFontsLoaded(true);
      
      if (addBodyClass) {
        document.body.classList.remove('fonts-loading');
        document.body.classList.add('fonts-loaded');
      }
      
      if (onFontsLoaded) {
        onFontsLoaded();
      }
    });
    
    // Add preconnect and preload hints
    addResourceHints(
      fonts.map(f => f.source === 'google' || !f.source ? 'google' : 'custom'),
      criticalFonts,
      preload
    );
    
    // Cleanup
    return () => {
      // Nothing to clean up for Google Fonts (they remain in the page)
      // Font faces added to document.fonts remain as well
    };
  }, [fonts, weights, styles, display, preload, addBodyClass, timeout, onFontsLoaded]);
  
  return (
    <>
      {/* Add font loading CSS to help with FOUT (Flash of Unstyled Text) */}
      <style>{`
        .fonts-loading {
          /* Apply font loading treatments */
          visibility: visible;
        }
        
        .fonts-loaded {
          /* Apply font loaded treatments */
          visibility: visible;
        }
        
        /* Optimize CLS (Cumulative Layout Shift) by reserving space */
        .fonts-loading h1, .fonts-loading h2, .fonts-loading h3 {
          /* Adjust these values based on your specific font metrics */
          letter-spacing: -0.02em;
          word-spacing: 0.02em;
        }
      `}</style>
    </>
  );
};

/**
 * Create a Google Font URL with the specified fonts, weights, styles, and display strategy
 * @param fonts Font definitions
 * @param defaultWeights Default weights to use if not specified in the font
 * @param defaultStyles Default styles to use if not specified in the font
 * @param defaultDisplay Default display strategy to use if not specified in the font
 * @returns Google Font URL
 */
function createGoogleFontUrl(
  fonts: FontDefinition[],
  defaultWeights: number[] = [400],
  defaultStyles: ('normal' | 'italic')[] = ['normal'],
  defaultDisplay: FontLoaderProps['display'] = 'swap'
): string {
  // Convert font definition to Google Fonts format
  const fontFamilies = fonts.map(font => {
    const family = font.family.replace(/\s+/g, '+');
    const weights = font.weights || defaultWeights;
    const styles = font.styles || defaultStyles;
    
    // Create combinations of weights and styles
    const variants: string[] = [];
    
    weights.forEach(weight => {
      styles.forEach(style => {
        if (style === 'normal') {
          variants.push(weight.toString());
        } else {
          variants.push(`${weight}i`);
        }
      });
    });
    
    // Special case for variable fonts
    if (font.variable) {
      return `${family}:wght@${weights.join(';')}`;
    }
    
    // Return font with variants
    return variants.length > 0 
      ? `${family}:${variants.join(',')}`
      : family;
  });
  
  // Combine all font families into a single URL
  const display = defaultDisplay || 'swap';
  return `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=${display}`;
}

/**
 * Add resource hints (preconnect, preload) for font resources
 * @param sources Font sources (google, custom)
 * @param criticalFonts Critical fonts that should be preloaded
 * @param preload Whether to add preload hints
 */
function addResourceHints(
  sources: ('google' | 'custom')[],
  criticalFonts: FontDefinition[],
  preload: boolean
): void {
  const uniqueSources = Array.from(new Set(sources));
  
  // Add preconnect for Google Fonts
  if (uniqueSources.includes('google')) {
    createResourceHint('preconnect', 'https://fonts.googleapis.com');
    createResourceHint('preconnect', 'https://fonts.gstatic.com', true);
  }
  
  // Add preload for critical fonts if enabled
  if (preload && criticalFonts.length > 0) {
    criticalFonts.forEach(font => {
      if (font.url) {
        // Preload self-hosted fonts
        createResourceHint('preload', font.url, false, 'font', font.format || 'woff2');
      } else {
        // For Google Fonts, we would need to know the exact URL
        // We can't easily preload them without knowledge of the final URL
      }
    });
  }
}

/**
 * Create and add a resource hint link element to the document head
 * @param rel Relationship (preconnect, preload, etc.)
 * @param href URL for the resource
 * @param crossorigin Whether to add crossorigin attribute
 * @param as Resource type (for preload)
 * @param type MIME type (for preload)
 */
function createResourceHint(
  rel: 'preconnect' | 'preload' | 'prefetch' | 'dns-prefetch',
  href: string,
  crossorigin: boolean = false,
  as?: string,
  type?: string
): void {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  
  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }
  
  if (as) {
    link.setAttribute('as', as);
  }
  
  if (type) {
    link.setAttribute('type', `font/${type}`);
  }
  
  document.head.appendChild(link);
}

export default FontLoader;