import React from "react";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Separator({
  orientation = "horizontal",
  className = "",
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={`${
        orientation === "horizontal"
          ? "h-px w-full"
          : "h-full w-px"
      } bg-white/10 ${className}`}
    />
  );
}