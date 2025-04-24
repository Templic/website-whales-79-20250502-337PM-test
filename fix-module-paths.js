/**
 * Fix Module Path Errors
 * 
 * This script fixes module import path errors by creating necessary
 * UI components and utility modules when they're missing.
 * 
 * Usage: node fix-module-paths.js
 */

import fs from 'fs';
import path from 'path';
import colors from 'colors';

// Configuration
const ROOT_DIR = '.';
const CLIENT_DIR = path.join(ROOT_DIR, 'client', 'src');
const COMPONENTS_DIR = path.join(CLIENT_DIR, 'components');
const UI_COMPONENTS_DIR = path.join(COMPONENTS_DIR, 'ui');
const LIB_DIR = path.join(CLIENT_DIR, 'lib');
const BACKUP_DIR = './ts-fixes-backup/module-paths';
const LOG_FILE = 'module-paths-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Module Path Error Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  console.log(color(message));
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Ensure a directory exists
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, colors.green);
  }
}

/**
 * Create or update the utils.ts file
 */
function createUtilsModule() {
  const utilsPath = path.join(LIB_DIR, 'utils.ts');
  
  ensureDirectoryExists(LIB_DIR);
  
  if (!fs.existsSync(utilsPath)) {
    const utilsContent = `/**
 * Utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge multiple className values into a single string
 * using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Simple throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let result: ReturnType<T> | undefined;
  let last = 0;
  
  return function(...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    const remaining = wait - (now - last);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      last = now;
      result = func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now();
        timeout = null;
        result = func(...args);
      }, remaining);
    }
    
    return result;
  };
}

/**
 * Simple debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
`;
    
    fs.writeFileSync(utilsPath, utilsContent, 'utf8');
    log(`Created utils module at: ${utilsPath}`, colors.green);
  } else {
    // Make sure it includes the cn function
    const content = fs.readFileSync(utilsPath, 'utf8');
    
    if (!content.includes('export function cn(')) {
      const updatedContent = `${content}

/**
 * Merge multiple className values into a single string
 * using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
      
      fs.writeFileSync(utilsPath, updatedContent, 'utf8');
      log(`Updated utils module with cn function at: ${utilsPath}`, colors.green);
    }
  }
  
  return true;
}

/**
 * Create UI components that are commonly imported but missing
 */
function createMissingUIComponents() {
  ensureDirectoryExists(UI_COMPONENTS_DIR);
  
  const components = [
    {
      name: 'button',
      content: `/**
 * Button Component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'button' : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'underline-offset-4 hover:underline text-primary': variant === 'link',
          },
          {
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 rounded-md': size === 'sm',
            'h-11 px-8 rounded-md': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
`
    },
    {
      name: 'switch',
      content: `/**
 * Switch Component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={cn('inline-flex items-center cursor-pointer', className)}>
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-11 h-6 bg-gray-200 rounded-full peer",
            "dark:bg-gray-700 peer-checked:after:translate-x-full",
            "peer-checked:after:border-white after:content-['']",
            "after:absolute after:top-[2px] after:left-[2px]",
            "after:bg-white after:border-gray-300 after:border",
            "after:rounded-full after:h-5 after:w-5 after:transition-all",
            "dark:border-gray-600 peer-checked:bg-primary"
          )}></div>
        </div>
        {label && <span className="ml-3 text-sm font-medium">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
`
    },
    {
      name: 'label',
      content: `/**
 * Label Component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, optional, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {optional && <span className="text-sm text-muted-foreground ml-1">(Optional)</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { Label };
`
    },
    {
      name: 'select',
      content: `/**
 * Select Component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, error, ...props }, ref) => {
    const id = React.useId();
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <select
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background file:border-0 file:bg-transparent",
            "file:text-sm file:font-medium placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
`
    },
    {
      name: 'slider',
      content: `/**
 * Slider Component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, min = 0, max = 100, ...props }, ref) => {
    const id = React.useId();
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
            "accent-primary",
            "dark:bg-gray-700",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
`
    },
    {
      name: 'tabs',
      content: `/**
 * Tabs Component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

/* Tab Context */
type TabContextValue = {
  selectedTab: string;
  setSelectedTab: (id: string) => void;
};

const TabContext = React.createContext<TabContextValue | undefined>(undefined);

function useTabContext() {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error('Tab components must be used within a TabsRoot');
  }
  return context;
}

/* Root Component */
export interface TabsRootProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function TabsRoot({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsRootProps) {
  const [selectedTab, setSelectedTab] = React.useState(value || defaultValue || '');
  
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedTab(value);
    }
  }, [value]);
  
  const handleTabChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setSelectedTab(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);
  
  return (
    <TabContext.Provider
      value={{ selectedTab, setSelectedTab: handleTabChange }}
    >
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabContext.Provider>
  );
}

/* Tab List Component */
export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex border-b border-border",
        className
      )}
    >
      {children}
    </div>
  );
}

/* Tab Trigger Component */
export interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabTrigger({
  value,
  children,
  className,
  disabled = false,
}: TabTriggerProps) {
  const { selectedTab, setSelectedTab } = useTabContext();
  const isSelected = selectedTab === value;
  
  return (
    <button
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => setSelectedTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium",
        "border-b-2 border-transparent -mb-[1px]",
        "hover:text-foreground/80",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isSelected && "border-primary text-primary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

/* Tab Content Component */
export interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabContent({
  value,
  children,
  className,
}: TabContentProps) {
  const { selectedTab } = useTabContext();
  const isSelected = selectedTab === value;
  
  if (!isSelected) {
    return null;
  }
  
  return (
    <div
      role="tabpanel"
      className={cn("pt-4", className)}
    >
      {children}
    </div>
  );
}
`
    }
  ];
  
  for (const component of components) {
    const componentPath = path.join(UI_COMPONENTS_DIR, `${component.name}.tsx`);
    
    if (!fs.existsSync(componentPath)) {
      fs.writeFileSync(componentPath, component.content, 'utf8');
      log(`Created UI component: ${componentPath}`, colors.green);
    }
  }
  
  return components.length;
}

/**
 * Create an empty declaration file for jsdom
 */
function createJsdomDeclaration() {
  const declDir = path.join(ROOT_DIR, 'client', 'src', 'types');
  const jsdomDeclPath = path.join(declDir, 'jsdom.d.ts');
  
  ensureDirectoryExists(declDir);
  
  if (!fs.existsSync(jsdomDeclPath)) {
    const content = `/**
 * Type declarations for jsdom
 */
declare module 'jsdom';
`;
    
    fs.writeFileSync(jsdomDeclPath, content, 'utf8');
    log(`Created jsdom declaration file at: ${jsdomDeclPath}`, colors.green);
    return true;
  }
  
  return false;
}

/**
 * Create declaration files for three.js extensions
 */
function createThreeExtensionDeclarations() {
  const declDir = path.join(ROOT_DIR, 'client', 'src', 'types');
  const threeDeclPath = path.join(declDir, 'three-extensions.d.ts');
  
  ensureDirectoryExists(declDir);
  
  if (!fs.existsSync(threeDeclPath)) {
    const content = `/**
 * Type declarations for THREE.js extensions
 */

declare module 'three/examples/jsm/geometries/TextGeometry' {
  import { BufferGeometry, Material, Mesh } from 'three';
  
  export interface TextGeometryParameters {
    font: Font;
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
  }
  
  export class TextGeometry extends BufferGeometry {
    constructor(text: string, parameters: TextGeometryParameters);
  }
  
  export class TextMesh extends Mesh {
    constructor(
      text: string,
      parameters: TextGeometryParameters,
      material?: Material | Material[]
    );
  }
}

declare module 'three/examples/jsm/loaders/FontLoader' {
  import { Loader, LoadingManager } from 'three';
  
  export class Font {
    constructor(jsondata: any);
    static isFont: boolean;
    data: string;
    generateShapes(text: string, size: number): any[];
  }
  
  export class FontLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (font: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(json: any): Font;
  }
}
`;
    
    fs.writeFileSync(threeDeclPath, content, 'utf8');
    log(`Created THREE.js extensions declaration file at: ${threeDeclPath}`, colors.green);
    return true;
  }
  
  return false;
}

/**
 * Update tsconfig.json to add path aliases
 */
function updateTsConfig() {
  const tsconfigPath = path.join(ROOT_DIR, 'tsconfig.json');
  
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Backup the original tsconfig
      const backupPath = path.join(BACKUP_DIR, 'tsconfig.json');
      fs.writeFileSync(backupPath, JSON.stringify(tsconfig, null, 2), 'utf8');
      
      // Add or update compilerOptions.paths
      if (!tsconfig.compilerOptions) {
        tsconfig.compilerOptions = {};
      }
      
      if (!tsconfig.compilerOptions.paths) {
        tsconfig.compilerOptions.paths = {};
      }
      
      // Set path aliases
      tsconfig.compilerOptions.paths = {
        ...tsconfig.compilerOptions.paths,
        '@/*': ['./client/src/*'],
        '@components/*': ['./client/src/components/*'],
        '@lib/*': ['./client/src/lib/*'],
        '@utils/*': ['./client/src/utils/*']
      };
      
      // Update tsconfig
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
      log(`Updated tsconfig.json with path aliases`, colors.green);
      
      return true;
    } catch (error) {
      log(`Error updating tsconfig.json: ${error.message}`, colors.red);
      return false;
    }
  } else {
    log(`Warning: Could not find tsconfig.json at ${tsconfigPath}`, colors.yellow);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting module path error fixes...', colors.cyan);
  
  // Create necessary directories
  ensureDirectoryExists(CLIENT_DIR);
  ensureDirectoryExists(COMPONENTS_DIR);
  ensureDirectoryExists(UI_COMPONENTS_DIR);
  ensureDirectoryExists(LIB_DIR);
  
  // Create or update utils module
  const utilsCreated = createUtilsModule();
  
  // Create missing UI components
  const componentsCreated = createMissingUIComponents();
  
  // Create jsdom declaration
  const jsdomDeclCreated = createJsdomDeclaration();
  
  // Create THREE.js extension declarations
  const threeDeclCreated = createThreeExtensionDeclarations();
  
  // Update tsconfig.json with path aliases
  const tsconfigUpdated = updateTsConfig();
  
  log(`\nSummary:`, colors.cyan);
  
  if (utilsCreated) {
    log(`✅ Created or updated utils module`, colors.green);
  }
  
  log(`✅ Created ${componentsCreated} missing UI components`, colors.green);
  
  if (jsdomDeclCreated) {
    log(`✅ Created jsdom declaration file`, colors.green);
  }
  
  if (threeDeclCreated) {
    log(`✅ Created THREE.js extensions declaration file`, colors.green);
  }
  
  if (tsconfigUpdated) {
    log(`✅ Updated tsconfig.json with path aliases`, colors.green);
  }
  
  log(`\nModule path errors fixes completed.`, colors.cyan);
}

// Run the main function
main();