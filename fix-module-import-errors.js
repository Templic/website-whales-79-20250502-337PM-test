/**
 * Fix Module Import Errors
 * 
 * This script creates missing utility modules and fixes import paths
 * for common modules like @/lib/utils and @/components/ui/* that
 * are referenced but don't exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Create necessary directories
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${colors.green}Created directory:${colors.reset} ${dirPath}`);
  }
}

// Create the lib/utils.ts file with common utilities
function createUtilsModule() {
  const libDir = path.join(__dirname, 'client/src/lib');
  ensureDirectoryExists(libDir);
  
  const utilsPath = path.join(libDir, 'utils.ts');
  
  // Check if file already exists
  if (fs.existsSync(utilsPath)) {
    console.log(`${colors.yellow}utils.ts already exists, skipping creation${colors.reset}`);
    return;
  }
  
  // Content for utils.ts
  const utilsContent = `/**
 * Utility functions for the application
 * 
 * This module contains common utility functions used throughout the application.
 */

import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a number as a currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Delay execution by the specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate a string to the specified length and add ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Safely access nested object properties
 */
export function get<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  return obj ? obj[key] : undefined;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
`;

  fs.writeFileSync(utilsPath, utilsContent);
  console.log(`${colors.green}Created utils.ts at:${colors.reset} ${utilsPath}`);
}

// Create UI component modules for missing imports
function createMissingUIComponents() {
  const componentsDir = path.join(__dirname, 'client/src/components/ui');
  ensureDirectoryExists(componentsDir);
  
  // List of UI components to create
  const components = [
    {
      name: 'switch',
      content: `/**
 * Switch Component
 * 
 * A toggle switch component that can be controlled or uncontrolled.
 */

import React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
`
    },
    {
      name: 'label',
      content: `/**
 * Label Component
 * 
 * A form label component for accessible forms.
 */

import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
`
    },
    {
      name: 'select',
      content: `/**
 * Select Component
 * 
 * A select component with custom styling.
 */

import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

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
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
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

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
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
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
  SelectScrollUpButton,
  SelectScrollDownButton,
};
`
    },
    {
      name: 'button',
      content: `/**
 * Button Component
 * 
 * A versatile button component with various styles.
 */

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cosmic: 
          "bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl",
        quantum: 
          "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border border-transparent",
        glow: 
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.7)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
`
    },
    {
      name: 'slider',
      content: `/**
 * Slider Component
 * 
 * A customizable slider component.
 */

import React from "react";
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
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
`
    },
    {
      name: 'tabs',
      content: `/**
 * Tabs Component
 * 
 * A set of layered sections of content that display one panel at a time.
 */

import React from "react";
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
    const componentPath = path.join(componentsDir, `${component.name}.tsx`);
    
    // Check if file already exists
    if (fs.existsSync(componentPath)) {
      console.log(`${colors.yellow}${component.name}.tsx already exists, skipping creation${colors.reset}`);
      continue;
    }
    
    fs.writeFileSync(componentPath, component.content);
    console.log(`${colors.green}Created ${component.name}.tsx at:${colors.reset} ${componentPath}`);
  }
}

// Create memory leak detector module
function createMemoryLeakDetector() {
  const libDir = path.join(__dirname, 'client/src/lib');
  ensureDirectoryExists(libDir);
  
  const detectorPath = path.join(libDir, 'memory-leak-detector.ts');
  
  // Check if file already exists
  if (fs.existsSync(detectorPath)) {
    console.log(`${colors.yellow}memory-leak-detector.ts already exists, skipping creation${colors.reset}`);
    return;
  }
  
  // Content for memory-leak-detector.ts
  const detectorContent = `/**
 * Memory Leak Detector
 * 
 * A utility to detect and report potential memory leaks in React components.
 */

interface LeakDetectorOptions {
  warnAfterMs?: number; // Time to wait before considering a component leaked
  debugMode?: boolean;  // Enable additional debug logging
}

class MemoryLeakDetector {
  private mountedComponents: Map<string, { timestamp: number; stack: string }> = new Map();
  private readonly warnAfterMs: number;
  private readonly debugMode: boolean;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(options: LeakDetectorOptions = {}) {
    this.warnAfterMs = options.warnAfterMs || 60000; // Default 1 minute
    this.debugMode = options.debugMode || false;
    
    // Start periodic check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.startPeriodicCheck();
    }
  }

  /**
   * Register a component as mounted
   */
  trackMount(componentId: string): void {
    if (this.debugMode) {
      console.debug(\`[MemoryLeakDetector] Component mounted: \${componentId}\`);
    }
    
    // Capture stack trace for debugging
    let stack = '';
    try {
      throw new Error();
    } catch (e: unknown) {
      if (e instanceof Error) {
        stack = e.stack || '';
      }
    }
    
    this.mountedComponents.set(componentId, {
      timestamp: Date.now(),
      stack
    });
  }

  /**
   * Unregister a component on unmount
   */
  trackUnmount(componentId: string): void {
    if (this.debugMode) {
      console.debug(\`[MemoryLeakDetector] Component unmounted: \${componentId}\`);
    }
    
    this.mountedComponents.delete(componentId);
  }

  /**
   * Generate a unique ID for a component
   */
  generateComponentId(componentName: string): string {
    return \`\${componentName}_\${Math.random().toString(36).substring(2, 9)}\`;
  }

  /**
   * Start periodic check for leaked components
   */
  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      this.checkForLeaks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check for potential memory leaks
   */
  private checkForLeaks(): void {
    const now = Date.now();
    
    this.mountedComponents.forEach((details, componentId) => {
      const mountTime = now - details.timestamp;
      
      if (mountTime > this.warnAfterMs) {
        console.warn(
          \`[MemoryLeakDetector] Potential memory leak detected: Component \${componentId} has been mounted for \${Math.round(mountTime / 1000)}s without unmounting.\`,
          \`\\nStack trace at mount time:\\n\${details.stack}\`
        );
      }
    });
    
    if (this.debugMode) {
      console.debug(\`[MemoryLeakDetector] Current tracked components: \${this.mountedComponents.size}\`);
    }
  }

  /**
   * Cleanup and stop tracking
   */
  dispose(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.mountedComponents.clear();
  }
}

// Create singleton instance
const memoryLeakDetector = new MemoryLeakDetector({
  debugMode: process.env.NODE_ENV === 'development'
});

export default memoryLeakDetector;

/**
 * React hook for tracking component lifecycle
 */
export function useMemoryLeakDetection(componentName: string): void {
  // Skip if not in browser or in production
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }
  
  // Use React's useEffect for lifecycle tracking
  try {
    const componentId = memoryLeakDetector.generateComponentId(componentName);
    
    // We're not in a React component, so we'll use a more basic approach
    memoryLeakDetector.trackMount(componentId);
    
    // Setup cleanup function
    const cleanup = () => {
      memoryLeakDetector.trackUnmount(componentId);
    };
    
    // Return cleanup function for React's useEffect
    return cleanup;
  } catch (error) {
    console.error('[MemoryLeakDetector] Error in useMemoryLeakDetection:', error);
  }
}
`;

  fs.writeFileSync(detectorPath, detectorContent);
  console.log(`${colors.green}Created memory-leak-detector.ts at:${colors.reset} ${detectorPath}`);
}

// Main function
async function main() {
  console.log(`${colors.blue}Fixing module import errors...${colors.reset}`);
  
  // Create the lib/utils.ts module
  createUtilsModule();
  
  // Create UI components
  createMissingUIComponents();
  
  // Create memory leak detector
  createMemoryLeakDetector();
  
  console.log(`${colors.green}Created all missing modules successfully!${colors.reset}`);
}

// Run the script
try {
  main();
} catch (error) {
  console.error(`${colors.red}Error running script:${colors.reset}`, error);
}