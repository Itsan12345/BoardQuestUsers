
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

export const REAGENT_LEVEL_REQUIREMENTS: Record<string, { requiredLevel: number; requiredXp: number }> = {
  erlenmeyer_shield: { requiredLevel: 1, requiredXp: 0 },
  buffered_saline: { requiredLevel: 1, requiredXp: 0 },
  pipette_clarity: { requiredLevel: 2, requiredXp: 100 },
  immersion_oil: { requiredLevel: 3, requiredXp: 400 },
  spectrophotometer_prism: { requiredLevel: 4, requiredXp: 900 },
  blood_agar_plate: { requiredLevel: 5, requiredXp: 1600 },
  heparin_tube: { requiredLevel: 6, requiredXp: 2500 },
};

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
  equippedItemImageUrl?: string;
}

export function calculatePlayerStats(level: number, streak: number = 0, equippedItem?: string | null): PlayerStats {
  const safeLevel = Math.max(1, level);

  // Validate that the equipped item is unlocked for the player's current level
  const req = equippedItem ? REAGENT_LEVEL_REQUIREMENTS[equippedItem] : null;
  const validEquippedItem = (req && safeLevel >= req.requiredLevel) ? equippedItem : null;

  const hasShield = validEquippedItem === 'erlenmeyer_shield';
  const hasClarity = validEquippedItem === 'pipette_clarity';
  const hasSaline = validEquippedItem === 'buffered_saline';
  const hasImmersionOil = validEquippedItem === 'immersion_oil';
  const hasPrism = validEquippedItem === 'spectrophotometer_prism';
  const hasBap = validEquippedItem === 'blood_agar_plate';
  const hasHeparin = validEquippedItem === 'heparin_tube';

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

  // DEF: Base 5 + level * 1.2 (+15 if Shield equipped, +8 if Heparin Tube equipped)
  const defense = 5 + Math.floor(safeLevel * 1.2) + (hasShield ? 15 : 0) + (hasHeparin ? 8 : 0);

  // CRIT Rate: Base 15% + (streak * 2)% capped at +25% (+10% if Pipette of Clarity or Spectrophotometer Prism equipped)
  const critRate = Math.min(50, 15 + Math.min(25, streak * 2) + (hasClarity || hasPrism ? 10 : 0));

  // Multiplier: 1.0x to 1.50x based on streak
  let multiplier = 1.0;
  if (streak >= 30) multiplier = 1.50;
  else if (streak >= 14) multiplier = 1.30;
  else if (streak >= 7) multiplier = 1.15;
  else if (streak >= 3) multiplier = 1.05;

  let equippedItemName = 'None Equipped';
  let equippedItemBuff = 'No active combat buff';
  let equippedItemIcon = '🎒';
  let equippedItemImageUrl: string | undefined = undefined;

  if (hasShield) {
    equippedItemName = 'Erlenmeyer Shield';
    equippedItemBuff = 'Grants +20 blue shield HP in boss battles';
    equippedItemIcon = '🛡️';
    equippedItemImageUrl = '/images/bossbattleItems/ErlenmayerShield.png';
  } else if (hasClarity) {
    equippedItemName = 'Pipette of Clarity';
    equippedItemBuff = 'Removes 1 wrong answer choice (50:50 hint)';
    equippedItemIcon = '🧪';
    equippedItemImageUrl = '/images/bossbattleItems/PippeteofClarity.png';
  } else if (hasSaline) {
    equippedItemName = 'Buffered Saline';
    equippedItemBuff = 'Blocks the first poison or negative effect from the boss';
    equippedItemIcon = '💧';
    equippedItemImageUrl = '/images/bossbattleItems/BufferedSaline.png';
  } else if (hasImmersionOil) {
    equippedItemName = 'Immersion Oil';
    equippedItemBuff = 'Highlights the key clue word in the question';
    equippedItemIcon = '🔬';
    equippedItemImageUrl = '/images/bossbattleItems/ImmersionOil.svg';
  } else if (hasPrism) {
    equippedItemName = 'Spectrophotometer Prism';
    equippedItemBuff = 'Deals +25% bonus attack damage on a 2+ streak';
    equippedItemIcon = '🌈';
    equippedItemImageUrl = '/images/bossbattleItems/SpectroPrism.svg';
  } else if (hasBap) {
    equippedItemName = 'Blood Agar Plate';
    equippedItemBuff = 'Swaps your current question for a new one (1 per battle)';
    equippedItemIcon = '🧫';
    equippedItemImageUrl = '/images/bossbattleItems/BloodAgarPlate.svg';
  } else if (hasHeparin) {
    equippedItemName = 'Heparin Tube';
    equippedItemBuff = 'Survives a fatal hit from the boss with 1 HP remaining';
    equippedItemIcon = '🧪';
    equippedItemImageUrl = '/images/bossbattleItems/HeparinTube.svg';
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
    equippedItemImageUrl,
  };
}
