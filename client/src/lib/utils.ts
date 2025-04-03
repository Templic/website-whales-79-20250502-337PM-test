import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values using clsx and tailwind-merge
 * This util function helps to avoid class conflicts and overlaps
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generalized button variant styles for cosmic UI components
 */
export const buttonVariants = {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary:
        "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      primary: 
        "bg-cosmic-primary text-white shadow-sm hover:bg-cosmic-primary/90 transition duration-300",
      cosmic:
        "bg-cosmic-primary/20 border border-cosmic-primary/30 text-white shadow-sm hover:bg-cosmic-primary/30 transition duration-300 backdrop-blur-sm relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-cosmic-secondary/30 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 hover:shadow-cosmic-primary/20 hover:shadow-lg",
      highlight:
        "bg-cosmic-highlight/20 border border-cosmic-highlight/30 text-white shadow-sm hover:bg-cosmic-highlight/30 transition duration-300 backdrop-blur-sm",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
};

/**
 * Generate random number between min and max
 */
export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Format a date string to a more readable format
 */
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Truncate a string to a certain length
 */
export function truncateString(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Check if the app is running on mobile
 */
export function isMobile() {
  return window.innerWidth < 768;
}