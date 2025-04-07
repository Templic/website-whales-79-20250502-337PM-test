import { useEffect, useState } from "react";
import SacredGeometry from "./SacredGeometry";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface CosmicLoaderProps {
  size?: "small" | "medium" | "large";
  message?: string;
  variant?: "primary" | "secondary";
  fullScreen?: boolean;
  geometryType?: "flower-of-life" | "sri-yantra" | "metatron-cube" | "merkaba" | "pentagon-star" | "hexagon" | "vesica-piscis" | "golden-spiral" | "fibonacci-spiral" | "octagon";
}

export default function CosmicLoader({
  size = "medium",
  message = "Loading cosmic energy...",
  variant = "primary",
  fullScreen = false,
  geometryType = "flower-of-life"
}: CosmicLoaderProps) {
  const { reducedMotion } = useAccessibility();
  const [rotationDegree, setRotationDegree] = useState(0);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.8);

  // Size mapping
  const sizeMap = {
    small: {
      container: "w-16 h-16",
      geometry: "w-10 h-10",
      text: "text-xs",
      pulseDelay: 1200,
    },
    medium: {
      container: "w-24 h-24",
      geometry: "w-16 h-16",
      text: "text-sm",
      pulseDelay: 1500,
    },
    large: {
      container: "w-32 h-32",
      geometry: "w-24 h-24",
      text: "text-base",
      pulseDelay: 1800,
    },
  };

  // Color mapping
  const colorMap = {
    primary: {
      text: "text-[#00ebd6]",
      color: "text-[#00ebd6]",
      glow: "from-[#00ebd6]/40 to-[#5b78ff]/20",
      border: "border-[#00ebd6]/30",
    },
    secondary: {
      text: "text-[#fe0064]",
      color: "text-[#fe0064]",
      glow: "from-[#fe0064]/40 to-[#5b78ff]/20",
      border: "border-[#fe0064]/30",
    },
  };

  // Animation logic - respect reduced motion preferences
  useEffect(() => {
    if (reducedMotion) {
      // Simplified animation for users with reduced motion preference
      setRotationDegree(0);
      setScale(1);
      return;
    }

    // Rotation animation
    const rotationInterval = setInterval(() => {
      setRotationDegree((prev) => (prev + 1) % 360);
    }, 20);

    // Pulse animation
    const pulseInterval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.1 : 1));
      setOpacity((prev) => (prev === 0.8 ? 1 : 0.8));
    }, sizeMap[size].pulseDelay);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(pulseInterval);
    };
  }, [size, reducedMotion]);

  const containerClasses = fullScreen
    ? `fixed inset-0 flex items-center justify-center z-50 bg-[#050f28]/90 backdrop-blur-md`
    : `flex flex-col items-center justify-center ${sizeMap[size].container}`;

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer glow effect */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorMap[variant].glow} blur-xl z-0`}
          style={{
            transform: `scale(${scale * 1.5})`,
            opacity,
            transition: reducedMotion ? "none" : "all 0.5s ease-in-out",
          }}
        ></div>

        {/* Middle glow */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorMap[variant].glow} blur-md z-0`}
          style={{
            transform: `scale(${scale * 1.25})`,
            opacity: opacity * 0.8,
            transition: reducedMotion ? "none" : "all 0.3s ease-in-out",
          }}
        ></div>

        {/* Sacred geometry rotating element */}
        <div
          className={`relative ${sizeMap[size].container} flex items-center justify-center`}
          style={{
            transform: reducedMotion ? "none" : `rotate(${rotationDegree}deg)`,
            transition: reducedMotion ? "none" : "transform 0.1s linear",
          }}
        >
          <SacredGeometry
            type={geometryType}
            className={`${sizeMap[size].geometry} ${colorMap[variant].color}`}
            style={{
              transform: `scale(${scale})`,
              transition: reducedMotion ? "none" : "transform 0.5s ease-in-out",
            }}
          />
        </div>

        {/* Inner pulsing element */}
        <div
          className={`absolute inset-0 border-2 ${colorMap[variant].border} rounded-full z-10`}
          style={{
            transform: `scale(${scale})`,
            opacity: opacity * 0.7,
            transition: reducedMotion ? "none" : "all 0.5s ease-in-out",
          }}
        ></div>
      </div>

      {/* Loading text */}
      {message && (
        <p
          className={`mt-4 ${sizeMap[size].text} ${colorMap[variant].text} text-center font-medium`}
        >
          {message}
        </p>
      )}
    </div>
  );
}