"use client";

import {
  Play,
  Pause,
  X,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

// Map of icon names to lucide-react components
const iconMap = {
  "icon-play": Play,
  "icon-pause": Pause,
  "icon-close": X,
  "icon-settings": Settings,
  "icon-sound-on": Volume2,
  "icon-sound-off": VolumeX,
} as const;

type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
}

/**
 * Icon component that renders lucide-react icons.
 * Provides the same API as the previous SVG sprite system.
 */
export function Icon({ name, size = 24, className, "aria-hidden": ariaHidden = true }: IconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} className={className} aria-hidden={ariaHidden} data-testid="icon" />;
}

/**
 * Hook to get icon href for backward compatibility with <use href={...}> pattern.
 * @deprecated Use <Icon name="..." /> directly instead.
 */
export function useIconHref(name: IconName): `#${string}` {
  return `#${name}`;
}

// Re-export for backward compatibility
export { iconMap };