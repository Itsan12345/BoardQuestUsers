import type { LucideIcon } from 'lucide-react';

export interface SubjectMetadata {
  name: string;
  icon: LucideIcon | any;
  color: string;
  enemy: string;
  imageUrl?: string;
  backgroundUrl?: string;
  arenaBackgroundUrl?: string;
  difficulty: number;
  biome: string;
  description: string;
  idleSpriteUrl?: string;
  attackSpriteUrl?: string;
  heavyAttackSpriteUrl?: string;
  normalAttackSfxUrl?: string;
  heavyAttackSfxUrl?: string;
  attackProjectileUrl?: string;
  undergroundSpikesUrl?: string;
  undergroundSpikesFrames?: number;
  lightningAttackUrl?: string;
  lightningAttackFrames?: number;
  idleFrames?: number;
  attackFrames?: number;
  heavyAttackFrames?: number;
  attackProjectileFrames?: number;
  idleFrameWidth?: number;
  attackFrameWidth?: number;
  heavyFrameWidth?: number;
  idleFrameHeight?: number;
  attackFrameHeight?: number;
  heavyFrameHeight?: number;
  idleDuration?: number;
  idleFps?: number;
}

export type UserAnswerRecord = {
  questionIndex: number;
  questionId?: string;
  selectedLetter: string;
  isCorrect: boolean;
  difficulty?: string;
};

export type QuizMode = 'learning' | 'test' | 'boss-battle';
export type BossDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

