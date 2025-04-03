import React from 'react';
import {
  Star, 
  Moon, 
  Sun, 
  Music, 
  Sparkles, 
  Heart, 
  Headphones, 
  Zap,
  CloudLightning,
  CircleOff,
  GalleryHorizontal,
  Podcast,
  RefreshCcw,
  Award,
  Compass,
  LucideProps,
  LucideIcon
} from 'lucide-react';

type IconName = 
  | 'star' 
  | 'moon' 
  | 'sun' 
  | 'music' 
  | 'sparkles'
  | 'heart'
  | 'headphones'
  | 'zap'
  | 'lightning'
  | 'off'
  | 'gallery'
  | 'podcast'
  | 'refresh'
  | 'award'
  | 'compass';

interface CosmicIconProps extends Omit<LucideProps, 'size'> {
  name: IconName;
  size?: number;
}

// This maps icon names to their Lucide React components
const iconMap: Record<IconName, LucideIcon> = {
  star: Star,
  moon: Moon,
  sun: Sun,
  music: Music,
  sparkles: Sparkles,
  heart: Heart,
  headphones: Headphones,
  zap: Zap,
  lightning: CloudLightning,
  off: CircleOff,
  gallery: GalleryHorizontal,
  podcast: Podcast,
  refresh: RefreshCcw,
  award: Award,
  compass: Compass
};

export const CosmicIcon: React.FC<CosmicIconProps> = ({ 
  name, 
  size = 24, 
  ...props 
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  return <IconComponent size={size} {...props} />;
};

export default CosmicIcon;