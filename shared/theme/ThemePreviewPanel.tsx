/**
 * Theme Preview Panel
 * 
 * This component provides a visual preview of the current theme settings
 * and allows interactive exploration of theme capabilities. It uses all
 * aspects of the theming system to demonstrate its features.
 */

import React, { useState } from 'react';
import { baseTokens, type ThemeTokens } from './tokens';
import { useTheme, ThemeMode, ThemeContrast, ThemeMotion } from './ThemeContext';
import { hexToRgb, rgbToHsl, getContrastRatio, getAccessibleTextColor } from './colorUtils';
import { ThemeVariablesConfig } from './tailwindVariables';
import { checkContrast } from './accessibility';
import { createComponentStyle } from './componentStyles';

// Styles for the preview panel
const previewPanelStyle = createComponentStyle<{
  variant: 'default' | 'compact' | 'expanded';
  colorMode: 'light' | 'dark';
  floating: boolean;
}>('theme-preview-panel', {
  base: 'font-sans overflow-hidden rounded-lg shadow-lg border transition-all duration-300',
  variants: {
    variant: {
      default: 'w-96 max-w-full',
      compact: 'w-72 max-w-full',
      expanded: 'w-full max-w-4xl',
    },
    colorMode: {
      light: 'bg-white text-gray-800 border-gray-200',
      dark: 'bg-gray-800 text-gray-100 border-gray-700',
    },
    floating: {
      true: 'fixed bottom-4 right-4 z-50',
      false: 'relative',
    },
  },
  defaultVariants: {
    variant: 'default',
    colorMode: 'light',
    floating: false,
  },
});

// Type for color display properties
interface ColorDisplayProps {
  name: string;
  value: string;
  textColor?: string;
  onClick?: () => void;
}

// Color display component 
const ColorDisplay: React.FC<ColorDisplayProps> = ({
  name,
  value,
  textColor,
  onClick,
}) => {
  const rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 };
  const hsl = rgbToHsl(rgb);
  const defaultTextColor = getAccessibleTextColor(value);
  const contrastResult = checkContrast(value, '#FFFFFF');
  
  return (
    <div 
      className="flex flex-col mb-2 overflow-hidden rounded"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div 
        className="h-16 p-2 flex items-end justify-between"
        style={{ 
          backgroundColor: value,
          color: textColor || defaultTextColor,
        }}
      >
        <span className="font-medium">{name}</span>
        <span className="text-xs opacity-90">{value}</span>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs">
        <div className="flex justify-between">
          <span>HSL: {Math.round(hsl.h)}° {Math.round(hsl.s)}% {Math.round(hsl.l)}%</span>
          <span>RGB: {rgb.r}, {rgb.g}, {rgb.b}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Contrast: {contrastResult.ratio.toFixed(2)}:1</span>
          <span className={contrastResult.AA ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {contrastResult.AA ? 'AA Pass' : 'AA Fail'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Type for spacing display properties
interface SpacingDisplayProps {
  name: string;
  value: string;
}

// Spacing display component
const SpacingDisplay: React.FC<SpacingDisplayProps> = ({ name, value }) => (
  <div className="flex items-center mb-2">
    <div className="w-24 text-sm">{name}:</div>
    <div className="flex-1 h-8 flex items-center">
      <div 
        className="h-4 bg-primary rounded"
        style={{ width: value }}
      ></div>
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{value}</span>
    </div>
  </div>
);

// Type for typography display properties
interface TypographyDisplayProps {
  name: string;
  size: string;
  weight?: string;
  lineHeight?: string;
}

// Typography display component
const TypographyDisplay: React.FC<TypographyDisplayProps> = ({
  name,
  size,
  weight = 'normal',
  lineHeight = '1.5',
}) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
      <span>{name}</span>
      <span>{size} / {weight} / {lineHeight}</span>
    </div>
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        lineHeight,
      }}
    >
      The quick brown fox jumps over the lazy dog.
    </div>
  </div>
);

// Type for shadow display properties
interface ShadowDisplayProps {
  name: string;
  value: string;
}

// Shadow display component
const ShadowDisplay: React.FC<ShadowDisplayProps> = ({ name, value }) => (
  <div className="flex items-center mb-4">
    <div className="w-24 text-sm">{name}:</div>
    <div 
      className="h-16 w-16 bg-white dark:bg-gray-700 rounded-lg"
      style={{ boxShadow: value }}
    ></div>
    <div className="ml-4 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto max-w-[150px]">
      {value}
    </div>
  </div>
);

// Type for radius display properties
interface RadiusDisplayProps {
  name: string;
  value: string;
}

// Radius display component
const RadiusDisplay: React.FC<RadiusDisplayProps> = ({ name, value }) => (
  <div className="flex items-center mb-3">
    <div className="w-24 text-sm">{name}:</div>
    <div 
      className="h-16 w-16 bg-primary"
      style={{ borderRadius: value }}
    ></div>
    <div className="ml-4 text-sm text-gray-600 dark:text-gray-300">
      {value}
    </div>
  </div>
);

// Main theme preview panel component
export interface ThemePreviewPanelProps {
  tokens?: ThemeTokens;
  variant?: 'default' | 'compact' | 'expanded';
  floating?: boolean;
  showTokenValues?: boolean;
  onSelectColor?: (name: string, value: string) => void;
}

export const ThemePreviewPanel: React.FC<ThemePreviewPanelProps> = ({
  tokens = baseTokens,
  variant = 'default',
  floating = false,
  showTokenValues = true,
  onSelectColor,
}) => {
  const { mode, setMode, contrast, setContrast, motion, setMotion } = useTheme();
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'components'>('colors');
  
  // Calculate actual color mode for styling
  const colorMode = mode === 'light' ? 'light' : 'dark';
  
  // Get class names from our component style utility
  const className = previewPanelStyle.classNames({
    variant,
    colorMode,
    floating,
  });
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium">Harmonize Theme</h3>
        
        {/* Theme mode switcher */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'light' 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'dark' 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Dark
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === 'colors' 
              ? 'border-b-2 border-primary font-medium' 
              : 'text-gray-600 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('colors')}
        >
          Colors
        </button>
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === 'typography' 
              ? 'border-b-2 border-primary font-medium' 
              : 'text-gray-600 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('typography')}
        >
          Typography
        </button>
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === 'spacing' 
              ? 'border-b-2 border-primary font-medium' 
              : 'text-gray-600 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('spacing')}
        >
          Spacing
        </button>
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === 'components' 
              ? 'border-b-2 border-primary font-medium' 
              : 'text-gray-600 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div>
            <h4 className="font-medium mb-3">Primary Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tokens.colors && typeof tokens.colors === 'object' && (
                Object.entries(tokens.colors)
                  .filter(([key]) => ['primary', 'secondary', 'accent'].includes(key))
                  .map(([key, value]) => {
                    if (typeof value === 'string') {
                      return (
                        <ColorDisplay 
                          key={key} 
                          name={key} 
                          value={value} 
                          onClick={() => onSelectColor?.(key, value)} 
                        />
                      );
                    } else if (typeof value === 'object') {
                      // For color palettes (e.g., primary.500)
                      return (
                        <div key={key}>
                          <h5 className="font-medium mt-2 mb-1">{key}</h5>
                          {Object.entries(value).map(([shade, color]) => (
                            <ColorDisplay 
                              key={`${key}-${shade}`} 
                              name={`${key}.${shade}`} 
                              value={color as string} 
                              onClick={() => onSelectColor?.(`${key}.${shade}`, color as string)} 
                            />
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })
              )}
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Semantic Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tokens.colors && typeof tokens.colors === 'object' && (
                Object.entries(tokens.colors)
                  .filter(([key]) => ['success', 'warning', 'error', 'info'].includes(key))
                  .map(([key, value]) => {
                    if (typeof value === 'string') {
                      return (
                        <ColorDisplay 
                          key={key} 
                          name={key} 
                          value={value} 
                          onClick={() => onSelectColor?.(key, value)} 
                        />
                      );
                    }
                    return null;
                  })
              )}
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Neutral Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tokens.colors && typeof tokens.colors === 'object' && (
                Object.entries(tokens.colors)
                  .filter(([key]) => ['background', 'foreground', 'muted', 'border'].includes(key))
                  .map(([key, value]) => {
                    if (typeof value === 'string') {
                      return (
                        <ColorDisplay 
                          key={key} 
                          name={key} 
                          value={value} 
                          onClick={() => onSelectColor?.(key, value)} 
                        />
                      );
                    }
                    return null;
                  })
              )}
            </div>
          </div>
        )}
        
        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div>
            <h4 className="font-medium mb-3">Font Families</h4>
            {tokens.typography?.fontFamily && (
              <div className="mb-6">
                {Object.entries(tokens.typography.fontFamily).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{key}:</div>
                    <div 
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded"
                      style={{ 
                        fontFamily: Array.isArray(value) ? value.join(', ') : value 
                      }}
                    >
                      The quick brown fox jumps over the lazy dog. 0123456789
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <h4 className="font-medium mb-3">Font Sizes</h4>
            {tokens.typography?.fontSize && (
              <div className="mb-6">
                {Object.entries(tokens.typography.fontSize).map(([key, value]) => {
                  const size = typeof value === 'string' ? value : value.size;
                  const lineHeight = typeof value === 'string' ? '1.5' : value.lineHeight || '1.5';
                  
                  return (
                    <TypographyDisplay
                      key={key}
                      name={key}
                      size={size}
                      lineHeight={lineHeight}
                    />
                  );
                })}
              </div>
            )}
            
            <h4 className="font-medium mb-3">Font Weights</h4>
            {tokens.typography?.fontWeight && (
              <div className="mb-6">
                {Object.entries(tokens.typography.fontWeight).map(([key, value]) => (
                  <TypographyDisplay
                    key={key}
                    name={key}
                    size="1rem"
                    weight={value}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Spacing Tab */}
        {activeTab === 'spacing' && (
          <div>
            <h4 className="font-medium mb-3">Spacing Scale</h4>
            {tokens.spacing && (
              <div className="mb-6">
                {Object.entries(tokens.spacing).map(([key, value]) => (
                  <SpacingDisplay key={key} name={key} value={value} />
                ))}
              </div>
            )}
            
            <h4 className="font-medium mt-6 mb-3">Border Radius</h4>
            {tokens.borderRadius && (
              <div className="mb-6">
                {Object.entries(tokens.borderRadius).map(([key, value]) => (
                  <RadiusDisplay key={key} name={key} value={value} />
                ))}
              </div>
            )}
            
            <h4 className="font-medium mt-6 mb-3">Shadows</h4>
            {tokens.shadows && (
              <div className="mb-6">
                {Object.entries(tokens.shadows).map(([key, value]) => (
                  <ShadowDisplay key={key} name={key} value={value} />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Components Tab */}
        {activeTab === 'components' && (
          <div>
            <h4 className="font-medium mb-3">Buttons</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              <button className="bg-primary text-white px-4 py-2 rounded">Primary</button>
              <button className="bg-secondary text-white px-4 py-2 rounded">Secondary</button>
              <button className="border border-primary text-primary px-4 py-2 rounded">Outline</button>
              <button className="text-primary underline">Link</button>
              <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded">Default</button>
              <button className="bg-gray-100 dark:bg-gray-600 text-gray-400 px-4 py-2 rounded cursor-not-allowed">Disabled</button>
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Card Title</h3>
                <p className="text-gray-600 dark:text-gray-300">This is a card component with a border and subtle shadow.</p>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-medium mb-2">Elevated Card</h3>
                <p className="text-gray-600 dark:text-gray-300">This card has a stronger shadow and no border.</p>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Form Elements</h4>
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Text Input</label>
                <input 
                  type="text" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                  placeholder="Enter text..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="checkbox" className="h-4 w-4 rounded border-input" />
                <label htmlFor="checkbox" className="ml-2 text-sm">Checkbox</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="radio" name="radio-group" className="h-4 w-4 rounded-full border-input" />
                <label htmlFor="radio" className="ml-2 text-sm">Radio Button</label>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Alerts</h4>
            <div className="space-y-3 mb-6">
              <div className="bg-success/15 text-success-foreground border border-success/30 rounded-lg p-4">
                Success alert message
              </div>
              <div className="bg-warning/15 text-warning-foreground border border-warning/30 rounded-lg p-4">
                Warning alert message
              </div>
              <div className="bg-error/15 text-error-foreground border border-error/30 rounded-lg p-4">
                Error alert message
              </div>
              <div className="bg-info/15 text-info-foreground border border-info/30 rounded-lg p-4">
                Information alert message
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600 dark:text-gray-300">Contrast:</span>
          <select 
            value={contrast}
            onChange={(e) => setContrast(e.target.value as ThemeContrast)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-transparent"
          >
            <option value="default">Default</option>
            <option value="low">Low</option>
            <option value="high">High</option>
            <option value="maximum">Maximum</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600 dark:text-gray-300">Motion:</span>
          <select 
            value={motion}
            onChange={(e) => setMotion(e.target.value as ThemeMotion)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-transparent"
          >
            <option value="normal">Normal</option>
            <option value="reduced">Reduced</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
    </div>
  );
};