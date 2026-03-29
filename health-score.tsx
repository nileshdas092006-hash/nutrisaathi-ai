"use client";

import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HealthScore({ score, size = "md", className }: HealthScoreProps) {
  const getColor = (s: number) => {
    if (s >= 70) return "text-primary";
    if (s >= 40) return "text-orange-500";
    return "text-destructive";
  };

  const getBgColor = (s: number) => {
    if (s >= 70) return "bg-primary/5";
    if (s >= 40) return "bg-orange-50";
    return "bg-destructive/5";
  };

  const radius = size === "lg" ? 48 : size === "md" ? 32 : 18;
  const stroke = size === "lg" ? 6 : size === "md" ? 4 : 2;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-10 h-10 text-[10px]",
    md: "w-16 h-16 text-sm",
    lg: "w-24 h-24 text-2xl",
  };

  return (
    <div className={cn("relative flex items-center justify-center font-black", sizeClasses[size], className)}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg]"
      >
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          className="text-muted/30"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className={cn(getColor(score), "health-score-ring transition-all duration-1000 ease-out")}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className={cn("absolute inset-0 flex items-center justify-center", getColor(score))}>
        {score}
      </div>
    </div>
  );
}