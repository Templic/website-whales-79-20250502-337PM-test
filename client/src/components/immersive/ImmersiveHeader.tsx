/**
 * @deprecated This component has been renamed to ImmersivePageHeader to avoid confusion with the main site header.
 * This component is NOT a site header/navigation, but rather a page title section for immersive experiences.
 */

"use client"

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImmersivePageHeaderProps {
  title: string;
  description: string;
  className?: string;
}

// Renamed component to better reflect its purpose as a page title section
export function ImmersivePageHeader({ title, description, className }: ImmersivePageHeaderProps) {
  return (
    <div className={cn("pt-20 pb-12 md:pt-28 md:pb-16 relative", className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-500">
          {title}
        </h1>
        <p className="text-gray-300 max-w-xl mx-auto text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}

// Export the old name for backward compatibility
export const ImmersiveHeader = ImmersivePageHeader;