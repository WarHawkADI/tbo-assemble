"use client";

import { useMemo } from "react";

interface GuestAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showInitials?: boolean;
}

// Generate a consistent color based on name
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a pleasant hue (avoiding grey tones)
  const h = Math.abs(hash % 360);
  const s = 65 + (hash % 20); // 65-85% saturation
  const l = 45 + (hash % 15); // 45-60% lightness
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// Generate a lighter shade for gradient
const lightenColor = (hsl: string, amount: number = 15): string => {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hsl;
  const [, h, s, l] = match;
  return `hsl(${h}, ${s}%, ${Math.min(95, parseInt(l) + amount)}%)`;
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function GuestAvatar({ 
  name, 
  size = "md", 
  className = "",
  showInitials = true 
}: GuestAvatarProps) {
  const { color, lightColor, initials, uniqueId } = useMemo(() => {
    const baseColor = stringToColor(name);
    return {
      color: baseColor,
      lightColor: lightenColor(baseColor),
      initials: getInitials(name),
      uniqueId: Math.abs(name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 1000),
    };
  }, [name]);

  // Generate unique avatar based on name using DiceBear-style pseudo-random elements
  const avatarPath = useMemo(() => {
    const seed = uniqueId;
    // Generate a simple face pattern based on the seed
    const eyeType = seed % 4;
    const mouthType = seed % 3;
    
    // SVG paths for different features
    const eyes: Record<number, string> = {
      0: "M35,45 L40,45 M60,45 L65,45", // dots
      1: "M33,45 A3,3 0 1,1 39,45 A3,3 0 1,1 33,45 M61,45 A3,3 0 1,1 67,45 A3,3 0 1,1 61,45", // circles
      2: "M34,43 L38,48 L34,48 Z M62,43 L66,48 L62,48 Z", // triangles
      3: "M32,45 Q36,42 40,45 M60,45 Q64,42 68,45", // curved
    };
    
    const mouths: Record<number, string> = {
      0: "M40,65 Q50,72 60,65", // smile
      1: "M42,68 L58,68", // neutral
      2: "M40,68 Q50,62 60,68", // slight frown
    };
    
    return {
      eyes: eyes[eyeType],
      mouth: mouths[mouthType],
    };
  }, [uniqueId]);

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-semibold overflow-hidden relative ${sizeClasses[size]} ${className}`}
      style={{ 
        background: `linear-gradient(135deg, ${color}, ${lightColor})`,
      }}
      title={name}
    >
      {showInitials ? (
        <span className="text-white drop-shadow-sm relative z-10">{initials}</span>
      ) : (
        <svg 
          viewBox="0 0 100 100" 
          className="absolute inset-0 w-full h-full"
        >
          {/* Background shape */}
          <circle cx="50" cy="50" r="50" fill={color} />
          <circle cx="50" cy="40" r="25" fill={lightColor} opacity="0.5" />
          
          {/* Face features */}
          <g stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d={avatarPath.eyes} />
            <path d={avatarPath.mouth} />
          </g>
        </svg>
      )}
      
      {/* Subtle shine effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}

// Stacked avatars for groups
interface AvatarStackProps {
  names: string[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarStack({ names, maxDisplay = 4, size = "md" }: AvatarStackProps) {
  const displayNames = names.slice(0, maxDisplay);
  const remaining = names.length - maxDisplay;
  
  const overlapClass = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
  };
  
  return (
    <div className="flex items-center">
      {displayNames.map((name, i) => (
        <div 
          key={i} 
          className={`${i > 0 ? overlapClass[size] : ''} ring-2 ring-white dark:ring-zinc-900 rounded-full`}
        >
          <GuestAvatar name={name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div 
          className={`${overlapClass[size]} flex items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-900 text-xs font-semibold text-gray-600 dark:text-zinc-300 ${sizeClasses[size]}`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
