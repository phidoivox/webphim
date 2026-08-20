import React from "react";

interface GenreBadgeProps {
  name: string;
  className?: string;
  onClick?: () => void;
}

export function GenreBadge({ name, className = "", onClick }: GenreBadgeProps) {
  const Component = onClick ? "button" : "span";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium text-[11px] sm:text-xs text-white/90 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {name}
    </Component>
  );
}
