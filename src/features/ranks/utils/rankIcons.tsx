import React from 'react';
import {
  Crown,
  Trophy,
  Star,
  Medal,
  Shield,
  Zap,
  Flame,
  Award,
} from 'lucide-react';

export function renderRankIcon(iconName: string, className: string = "w-5 h-5 sm:w-7 sm:h-7") {
  const name = (iconName || '').toLowerCase();
  switch (name) {
    case 'crown':
      return <Crown className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'medal':
      return <Medal className={className} />;
    case 'shield':
    case 'shieldalert':
      return <Shield className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'award':
    default:
      return <Award className={className} />;
  }
}

