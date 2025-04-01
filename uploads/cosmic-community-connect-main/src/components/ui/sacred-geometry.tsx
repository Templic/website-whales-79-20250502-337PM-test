
import React from "react";
import { cn } from "@/lib/utils";

type GeometryVariant = 
  | "hexagon" 
  | "pentagon" 
  | "tetrahedron" 
  | "flower-of-life" 
  | "sri-yantra" 
  | "metatron"
  | "dodecahedron"
  | "torus"
  | "vesica-piscis"
  | "seed-of-life";

interface SacredGeometryProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GeometryVariant;
  intensity?: "subtle" | "medium" | "strong";
  animate?: boolean;
  children: React.ReactNode;
}

export function SacredGeometry({
  variant = "hexagon",
  intensity = "medium",
  animate = false,
  children,
  className,
  ...props
}: SacredGeometryProps) {
  const getClipPath = () => {
    switch (variant) {
      case "hexagon":
        return "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
      case "pentagon":
        return "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)";
      case "tetrahedron":
        return "polygon(50% 0%, 100% 100%, 0% 100%)";
      case "dodecahedron":
        return "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)";
      case "torus":
        // A circular shape
        return "";
      case "vesica-piscis":
        // Special shape made from two overlapping circles
        return "";
      case "seed-of-life":
        // Based on the Flower of Life but simpler
        return "";
      case "flower-of-life":
        // A simplified flower of life pattern using rounded borders
        return "";
      case "sri-yantra":
        // A simplified Sri Yantra pattern with multiple triangles
        return "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)";
      case "metatron":
        // A simplified Metatron's Cube pattern
        return "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
      default:
        return "";
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case "flower-of-life":
        return {
          borderRadius: "50%",
          boxShadow: `
            0 0 0 2px rgba(155, 135, 245, 0.3),
            0 0 0 10px rgba(155, 135, 245, 0.1),
            0 0 0 18px rgba(155, 135, 245, 0.05)
          `
        };
      case "torus":
        return {
          borderRadius: "50%",
          boxShadow: `
            0 0 0 2px rgba(155, 135, 245, 0.5),
            0 0 0 12px rgba(155, 135, 245, 0.2),
            0 0 0 5px rgba(155, 135, 245, 0.1)
          `
        };
      case "vesica-piscis":
        return {
          borderRadius: "30% 30% 30% 30% / 45% 45% 45% 45%",
          transform: "rotate(45deg)"
        };
      case "seed-of-life":
        return {
          borderRadius: "50%",
          boxShadow: `
            0 0 0 2px rgba(155, 135, 245, 0.3),
            0 0 0 7px rgba(155, 135, 245, 0.15)
          `
        };
      default:
        return {};
    }
  };

  const getIntensityStyle = () => {
    switch (intensity) {
      case "subtle":
        return { 
          borderWidth: "1px", 
          backgroundColor: "rgba(155, 135, 245, 0.05)" 
        };
      case "medium":
        return { 
          borderWidth: "2px", 
          backgroundColor: "rgba(155, 135, 245, 0.1)" 
        };
      case "strong":
        return { 
          borderWidth: "3px", 
          backgroundColor: "rgba(155, 135, 245, 0.15)" 
        };
      default:
        return {};
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden border-cosmic-primary",
        animate && "transition-all duration-500 hover:border-cosmic-vivid hover:shadow-lg hover:scale-[1.02]",
        className
      )}
      style={{
        clipPath: getClipPath(),
        ...getBorderStyle(),
        ...getIntensityStyle(),
      }}
      {...props}
    >
      {/* Sacred geometry background patterns */}
      {variant === "metatron" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-75 rotate-45"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-90"></div>
            <div className="absolute inset-0 border border-cosmic-primary transform rotate-45 scale-75"></div>
            <div className="absolute inset-0 border border-cosmic-primary transform rotate-[30deg] scale-90"></div>
            <div className="absolute inset-0 border border-cosmic-primary transform rotate-[60deg] scale-90"></div>
          </div>
        </div>
      )}
      {variant === "flower-of-life" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 translate-x-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 -translate-x-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 translate-y-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 -translate-y-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 translate-x-1/4 translate-y-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 -translate-x-1/4 translate-y-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50 translate-x-1/4 -translate-y-1/4"></div>
          </div>
        </div>
      )}
      {variant === "sri-yantra" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-45 scale-75"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[135deg] scale-75"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[22.5deg] scale-50"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[67.5deg] scale-50"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[112.5deg] scale-50"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[157.5deg] scale-50"></div>
          </div>
        </div>
      )}
      {variant === "dodecahedron" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-0 scale-90"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[30deg] scale-90"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[60deg] scale-90"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[15deg] scale-75"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary transform rotate-[45deg] scale-75"></div>
          </div>
        </div>
      )}
      {variant === "seed-of-life" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-50"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-40 translate-y-1/6"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-40 translate-x-[0.14] translate-y-[0.08]"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-40 translate-x-[0.14] translate-y-[-0.08]"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-40 translate-y-[-1/6]"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-40 translate-x-[-0.14] translate-y-[-0.08]"></div>
            <div className="absolute inset-0 border-2 border-cosmic-primary rounded-full transform scale-40 translate-x-[-0.14] translate-y-[0.08]"></div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}
