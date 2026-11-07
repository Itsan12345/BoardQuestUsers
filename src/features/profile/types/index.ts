import type { UserBadgeDetails } from '@/app/actions/badge';
import type { GuidanceAssignmentRecord } from '@/app/actions/guidance';

export type { UserBadgeDetails, GuidanceAssignmentRecord };

export interface UserAchievement {
  id: string;
  task: string;
  type: string;
  xp: number;
  timestamp: Date;
  badge?: string;
  confidenceLevel?: string;
  accuracy?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  loginStreak?: number;
  equippedItem?: string | null;
  inventory?: string | Record<string, number>;
  location: string;
  arenaNickname?: string;
  avatarGender?: 'male' | 'female';
  createdAt: Date;
  classString: string;
  userRank: number;
  rankingPercentage: number;
  achievements: UserAchievement[];
}

export interface BadgeDefinition {
  id: string;
  title: string;
  sprite: string;
  bgGradient: string;
  borderColor: string;
  unlockCondition?: string;
  description?: string;
  xpReward?: number;
  category?: string;
  [key: string]: any;
}

