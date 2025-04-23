/**
 * Comprehensive TypeScript Error Fixer
 * 
 * This script automatically fixes common TypeScript errors across the entire codebase.
 * It handles malformed type annotations, duplicate React imports, string-to-number conversions,
 * missing module errors, and other common TypeScript issues.
 * 
 * Usage: node ts-error-fixer-comprehensive.js
 * 
 * The script will create backups of all modified files and apply fixes based on error patterns.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import colors from 'colors';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', BACKUP_DIR, '.config', '.cache', '.vscode'];
const EXCLUDED_PREFIXES = ['.', 'node_'];
const LOG_FILE = 'typescript-error-fixes.log';

// Error patterns to fix
const ERROR_PATTERNS = [
  // Malformed type annotations with $2
  { pattern: /(\w+)\$2(\s*):/, replacement: '$1: any$2', description: 'Malformed type annotation with $2' },
  
  // Duplicate React imports
  { pattern: /import \* as React from ['"]react['"]([\s\S]*?)import React from ['"]react['"];?/g, 
    replacement: 'import React from "react";$1', description: 'Duplicate React imports' },
  
  // String to number conversions in style properties
  { pattern: /(width|height|top|bottom|left|right|margin|padding|fontSize)\s*:\s*['"]([\d.]+)['"]/g, 
    replacement: '$1: $2', description: 'String to number conversion' },
  
  // Catch clauses with Error type
  { pattern: /catch\s*\(\s*(\w+)\s*:\s*Error\s*\)/g, 
    replacement: 'catch ($1: unknown)', description: 'Error type in catch clause' },
  
  // Malformed import statements
  { pattern: /nimport\s+(\w+)\s+from/g,
    replacement: 'import $1 from', description: 'Malformed import statement' },
    
  // Invalid JSX attributes
  { pattern: /(\w+)={"([^"]*)"}/g,
    replacement: (match, attr, value) => {
      // Only fix numeric values
      if (/^[\d.]+$/.test(value)) {
        return `${attr}={${value}}`;
      }
      return match;
    },
    description: 'JSX string attributes that should be numbers'
  }
];

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(colors.green(`Created backup directory: ${BACKUP_DIR}`));
  }
}

// Create backup of file before modifying
function createBackup(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  fs.copyFileSync(filePath, backupPath);
  console.log(colors.yellow(`Backed up ${filePath} to ${backupPath}`));
}

// Find all TypeScript files recursively
function findTypeScriptFiles(dir) {
  const result = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !EXCLUDED_DIRS.includes(file)) {
      result.push(...findTypeScriptFiles(filePath));
    } else if (stat.isFile() && /\.(ts|tsx)$/.test(file)) {
      result.push(filePath);
    }
  }
  
  return result;
}

// Fix a specific file
function fixFile(filePath) {
  console.log(colors.cyan(`Processing ${filePath}...`));
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = false;
    
    // Apply each error pattern
    for (const errorPattern of ERROR_PATTERNS) {
      const newContent = content.replace(errorPattern.pattern, errorPattern.replacement);
      
      if (newContent !== content) {
        console.log(colors.green(`  Fixed ${errorPattern.description} in ${filePath}`));
        content = newContent;
        changes = true;
      }
    }
    
    // Only write and backup if changes were made
    if (changes) {
      createBackup(filePath);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(colors.green(`Updated ${filePath}`));
      logFix(filePath, 'Fixed multiple TypeScript errors');
    }
  } catch (error) {
    console.error(colors.red(`Error fixing ${filePath}: ${error.message}`));
    logFix(filePath, `Error: ${error.message}`, true);
  }
}

// Fix missing @/lib/utils module
function fixMissingLibUtils() {
  const libDir = path.join(ROOT_DIR, 'client', 'src', 'lib');
  const utilsPath = path.join(libDir, 'utils.ts');
  
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
    console.log(colors.green(`Created directory: ${libDir}`));
  }
  
  if (!fs.existsSync(utilsPath)) {
    const utilsContent = `/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind classes
 * Uses clsx and tailwind-merge to handle conditional classes and conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
`;
    fs.writeFileSync(utilsPath, utilsContent);
    console.log(colors.green(`Created ${utilsPath}`));
    logFix(utilsPath, 'Created missing utils module');
  }
}

// Fix missing memory-leak-detector module
function fixMissingMemoryLeakDetector() {
  const libDir = path.join(ROOT_DIR, 'client', 'src', 'lib');
  const detectorPath = path.join(libDir, 'memory-leak-detector.ts');
  
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
    console.log(colors.green(`Created directory: ${libDir}`));
  }
  
  if (!fs.existsSync(detectorPath)) {
    const detectorContent = `/**
 * Memory Leak Detector
 * 
 * Detects potential memory leaks in React components.
 */

/**
 * Register a component instance for leak detection
 */
export function registerComponent(componentName: string): () => void {
  if (process.env.NODE_ENV !== 'development') {
    return () => {}; // No-op in production
  }
  
  console.debug(\`[MemoryLeakDetector] Registered component: \${componentName}\`);
  
  return () => {
    console.debug(\`[MemoryLeakDetector] Unregistered component: \${componentName}\`);
  };
}

/**
 * Check for memory leaks in a specific component
 */
export function checkComponentLeaks(componentName: string): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // No-op in production
  }
  
  // This would be expanded in a real implementation
  console.debug(\`[MemoryLeakDetector] Checking component for leaks: \${componentName}\`);
}

/**
 * Clear all registered component instances
 * Useful for tests or hot reloading
 */
export function clearAllRegistrations(): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // No-op in production
  }
  
  console.debug('[MemoryLeakDetector] Cleared all registrations');
}
`;
    fs.writeFileSync(detectorPath, detectorContent);
    console.log(colors.green(`Created ${detectorPath}`));
    logFix(detectorPath, 'Created missing memory-leak-detector module');
  }
}

// Create missing UI components
function createMissingUIComponents() {
  const uiComponentsDir = path.join(ROOT_DIR, 'client', 'src', 'components', 'ui');
  
  if (!fs.existsSync(uiComponentsDir)) {
    fs.mkdirSync(uiComponentsDir, { recursive: true });
    console.log(colors.green(`Created directory: ${uiComponentsDir}`));
  }
  
  // Define basic UI components to create
  const components = [
    {
      name: 'label.tsx',
      content: `import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
`
    },
    {
      name: 'button.tsx',
      content: `import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          variant === 'outline' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
          variant === 'link' && "text-primary underline-offset-4 hover:underline",
          size === 'default' && "h-10 px-4 py-2",
          size === 'sm' && "h-9 rounded-md px-3",
          size === 'lg' && "h-11 rounded-md px-8",
          size === 'icon' && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
`
    },
    {
      name: 'switch.tsx',
      content: `import React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
`
    },
    {
      name: 'select.tsx',
      content: `import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
      "text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none",
      "focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
        position === "popper" && "translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
      "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
`
    },
    {
      name: 'slider.tsx',
      content: `import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"
    >
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
`
    },
    {
      name: 'tabs.tsx',
      content: `import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
`
    }
  ];
  
  // Create each component
  for (const component of components) {
    const componentPath = path.join(uiComponentsDir, component.name);
    
    if (!fs.existsSync(componentPath)) {
      fs.writeFileSync(componentPath, component.content);
      console.log(colors.green(`Created ${componentPath}`));
      logFix(componentPath, 'Created missing UI component');
    }
  }
}

// Fix frequency-visualizer-3d.tsx component
function fixFrequencyVisualizer() {
  const filePath = path.join(ROOT_DIR, 'client', 'src', 'components', 'features', 'audio', 'frequency-visualizer-3d.tsx');
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix corrupted import line
    content = content.replace(
      /nimport.+Switch.+from/,
      'import { Switch } from "@/components/ui/switch"'
    );
    
    // Fix props interface
    if (!content.includes('interface FrequencyVisualizer3DProps')) {
      const propInterfaceAddition = `
interface FrequencyVisualizer3DProps {
  audioSrc?: string;
  title?: string;
  frequency?: number;
  chakra?: boolean;
  chakraColor?: string;
}`;
      
      // Add interface before the component definition
      content = content.replace(
        /export\s+function\s+FrequencyVisualizer3D/,
        `${propInterfaceAddition}\n\nexport function FrequencyVisualizer3D`
      );
    }
    
    // Fix string to number conversions
    content = content.replace(/position={(?:['"])(-?[\d.]+)(?:['"])}/g, 'position={$1}');
    content = content.replace(/scale={(?:['"])([\d.]+)(?:['"])}/g, 'scale={$1}');
    content = content.replace(/rotation={(?:['"])(-?[\d.]+)(?:['"])}/g, 'rotation={$1}');
    
    createBackup(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(colors.green(`Fixed FrequencyVisualizer3D component in ${filePath}`));
    logFix(filePath, 'Fixed FrequencyVisualizer3D component');
  }
}

// Log fixes to file
function logFix(filePath, description, isError = false) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${isError ? 'ERROR' : 'FIXED'} - ${filePath}: ${description}\n`;
  
  fs.appendFileSync(LOG_FILE, logEntry);
}

// Main execution function
async function main() {
  console.log(colors.blue.bold('Starting TypeScript Error Fixer...'));
  
  ensureBackupDir();
  
  // Log start of run
  fs.appendFileSync(LOG_FILE, `\n=== TypeScript Error Fixing Run: ${new Date().toISOString()} ===\n`);
  
  try {
    // Create missing modules and components first
    fixMissingLibUtils();
    fixMissingMemoryLeakDetector();
    createMissingUIComponents();
    
    // Fix specific components
    fixFrequencyVisualizer();
    
    // Find and fix all TypeScript files
    const tsFiles = findTypeScriptFiles(ROOT_DIR);
    console.log(colors.blue(`Found ${tsFiles.length} TypeScript files to process`));
    
    // Process files in batches to avoid memory issues
    const BATCH_SIZE = 20;
    for (let i = 0; i < tsFiles.length; i += BATCH_SIZE) {
      const batch = tsFiles.slice(i, i + BATCH_SIZE);
      
      console.log(colors.blue(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tsFiles.length / BATCH_SIZE)}`));
      
      for (const file of batch) {
        fixFile(file);
      }
    }
    
    console.log(colors.green.bold('TypeScript Error Fixing completed successfully!'));
    console.log(colors.cyan(`Check ${LOG_FILE} for detailed fix log`));
  } catch (error) {
    console.error(colors.red.bold(`Error in TypeScript Error Fixer: ${error.message}`));
    console.error(error);
    fs.appendFileSync(LOG_FILE, `ERROR: ${error.message}\n${error.stack}\n`);
  }
}

// Run the main function
main();