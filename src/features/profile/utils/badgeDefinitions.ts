import type { BadgeDefinition } from '../types';

export const BADGE_SPRITE_DEFINITIONS: Record<
  string,
  {
    title: string;
    sprite: string;
    bgGradient: string;
    borderColor: string;
  }
> = {
  speed: {
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  'swift-solver': {
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  master: {
    title: 'Master',
    sprite: '/ui/master-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  adept: {
    title: 'Adept',
    sprite: '/ui/adept-badge.png',
    bgGradient: 'from-[#7986CB] via-[#5C6BC0] to-[#3F51B5]',
    borderColor: 'border-[#303F9F]',
  },
  bronze: {
    title: 'Bronze',
    sprite: '/ui/bronze-badge.png',
    bgGradient: 'from-[#9C7A68] via-[#5D4037] to-[#2E1C14]',
    borderColor: 'border-[#271B17]',
  },
  gold: {
    title: 'Gold',
    sprite: '/ui/gold-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  silver: {
    title: 'Silver',
    sprite: '/ui/silver-badge.png',
    bgGradient: 'from-[#EEEEEE] via-[#757575] to-[#37474F]',
    borderColor: 'border-[#263238]',
  },
  'streak-7': {
    title: 'Adept',
    sprite: '/ui/adept-badge.png',
    bgGradient: 'from-[#7986CB] via-[#5C6BC0] to-[#3F51B5]',
    borderColor: 'border-[#303F9F]',
  },
  'streak-14': {
    title: 'Master',
    sprite: '/ui/master-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  'streak-30': {
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
};

export const ALL_BADGE_TYPES: BadgeDefinition[] = [
  {
    id: 'gold',
    title: 'Master Gold',
    sprite: '/ui/gold-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Complete a quest with 100% accuracy',
    description: 'Perfect execution! Awarded for answering all quest questions correctly.',
    xpReward: 200,
  },
  {
    id: 'silver',
    title: 'Adept Silver',
    sprite: '/ui/silver-badge.png',
    bgGradient: 'from-[#EEEEEE] via-[#757575] to-[#37474F]',
    borderColor: 'border-[#263238]',
    unlockCondition: 'Complete a quest with 60-79% accuracy',
    description: 'Solid performance demonstrating strong diagnostic capability.',
    xpReward: 100,
  },
  {
    id: 'bronze',
    title: 'Bronze Aspirant',
    sprite: '/ui/bronze-badge.png',
    bgGradient: 'from-[#9C7A68] via-[#5D4037] to-[#2E1C14]',
    borderColor: 'border-[#271B17]',
    unlockCondition: 'Complete a quest with 40-59% accuracy',
    description: 'Completed a diagnostic quest with good effort.',
    xpReward: 50,
  },
  {
    id: 'speed',
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Complete a quest in under 2 minutes',
    description: 'Lightning fast problem solving under extreme time pressure!',
    xpReward: 75,
  },
  {
    id: 'streak-7',
    title: '7-Day Champion',
    sprite: '/ui/adept-badge.png',
    bgGradient: 'from-[#7986CB] via-[#5C6BC0] to-[#3F51B5]',
    borderColor: 'border-[#303F9F]',
    unlockCondition: 'Maintain a 7-day study streak',
    description: 'Demonstrated dedication with 7 continuous days of learning.',
    xpReward: 150,
  },
  {
    id: 'streak-14',
    title: '14-Day Unstoppable',
    sprite: '/ui/master-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Maintain a 14-day study streak',
    description: 'Unstoppable momentum! 14 days of active questing.',
    xpReward: 200,
  },
  {
    id: 'streak-30',
    title: '30-Day Legend',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Maintain a 30-day study streak',
    description: 'True legendary pathology master! 30 consecutive days.',
    xpReward: 300,
  },
];

