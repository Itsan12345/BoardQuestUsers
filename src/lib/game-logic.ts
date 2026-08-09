
export const XP_PER_QUESTION = 50;
export const XP_BONUS_STREAK = 100;

export function calculateLevel(xp: number) {
  // Simple level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForNextLevel(currentLevel: number) {
  return Math.pow(currentLevel, 2) * 100;
}

export function progressToNextLevel(xp: number) {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForNextLevel(level - 1);
  const nextLevelXp = xpForNextLevel(level);
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export const SUBJECT_AREAS = [
  "Clinical Chemistry",
  "Microbiology",
  "Hematology",
  "Immunology & Serology and Immunohematology",
  "Clinical Microscopy & Parasitology",
  "Histopathology and Medtech Laws"
];

export interface PlayerStats {
  maxHp: number;
  baseDamage: number;
  bonusDamage: number;
  totalDamage: number;
  defense: number;
  critRate: number;
  multiplier: number;
  equippedItemName: string;
  equippedItemBuff: string;
  equippedItemIcon: string;
}

export function calculatePlayerStats(level: number, streak: number = 0, equippedItem?: string | null): PlayerStats {
  const safeLevel = Math.max(1, level);
  const hasShield = equippedItem === 'erlenmeyer_shield';
  const hasClarity = equippedItem === 'pipette_clarity';
  const hasSaline = equippedItem === 'buffered_saline';

  // HP: Base 100 + (level - 1) * 15 + (+20 HP if Shield is equipped)
  const maxHp = 100 + (safeLevel - 1) * 15 + (hasShield ? 20 : 0);

  // DMG: Base 25 + level * 2
  const baseDamage = 25 + safeLevel * 2;

  // Streak Damage Multiplier (up to +20% bonus DMG)
  let streakMul = 0;
  if (streak >= 30) streakMul = 0.20;
  else if (streak >= 14) streakMul = 0.15;
  else if (streak >= 7) streakMul = 0.10;
  else if (streak >= 3) streakMul = 0.05;

  const bonusDamage = Math.round(baseDamage * streakMul);
  const totalDamage = baseDamage + bonusDamage;

  // DEF: Base 5 + level * 1.2 (+15 if Shield equipped)
  const defense = 5 + Math.floor(safeLevel * 1.2) + (hasShield ? 15 : 0);

  // CRIT Rate: Base 15% + (streak * 2)% capped at +25% (+10% if Pipette of Clarity equipped)
  const critRate = Math.min(50, 15 + Math.min(25, streak * 2) + (hasClarity ? 10 : 0));

  // Multiplier: 1.0x to 2.0x based on streak
  let multiplier = 1.0;
  if (streak >= 30) multiplier = 2.0;
  else if (streak >= 14) multiplier = 1.5;
  else if (streak >= 7) multiplier = 1.25;
  else if (streak >= 3) multiplier = 1.1;

  let equippedItemName = 'None Equipped';
  let equippedItemBuff = 'No active combat buff';
  let equippedItemIcon = '🎒';

  if (hasShield) {
    equippedItemName = 'Erlenmeyer Shield';
    equippedItemBuff = '+20 Max HP & +15 Armor (Blocks initial boss attacks)';
    equippedItemIcon = '🛡️';
  } else if (hasClarity) {
    equippedItemName = 'Pipette of Clarity';
    equippedItemBuff = '+10% Crit Rate (Eliminates 2 wrong options)';
    equippedItemIcon = '🧪';
  } else if (hasSaline) {
    equippedItemName = 'Buffered Saline Solution';
    equippedItemBuff = 'Cures Poison & restores +40 HP on activation';
    equippedItemIcon = '💧';
  }

  return {
    maxHp,
    baseDamage,
    bonusDamage,
    totalDamage,
    defense,
    critRate,
    multiplier,
    equippedItemName,
    equippedItemBuff,
    equippedItemIcon,
  };
}

