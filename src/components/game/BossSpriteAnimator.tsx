"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { preloadSpecterSounds, playSpecterAttack, preloadBiohazardSounds, playBiohazardAttack, preloadStaphSentinelSounds, playStaphSentinelAttack, preloadCrystalGolemSounds, playCrystalGolemAttack, preloadMicrobeSwarmSounds, playMicrobeSwarmAttack, preloadSickleCellReaperSounds, playSickleCellReaperAttack, preloadAcidSlimeSounds, playAcidSlimeAttack, preloadSickleCellMinionSounds, playSickleCellMinionAttack, preloadAnemiaShadeSounds, playAnemiaShadeAttack, preloadGramPositiveSounds, playGramPositiveAttack, preloadFungalSporeSounds, playFungalSporeAttack, preloadReagentStripSlimeSounds, playReagentStripSlimeAttack, preloadHydraSounds, playHydraAttack, preloadKetoacidosisSounds, playKetoacidosisAttack, preloadLegalBeholderSounds, preloadHyperglycemicMutantSounds, playHyperglycemicMutantAttack, preloadImmuneArchonSounds, playImmuneArchonAttack, playAudioFile } from "@/lib/audio-manager";

export type BossAnimState = "idle" | "normal_attack" | "heavy_attack";

interface BossSpriteAnimatorProps {
  bossName?: string;
  normalAttackSfxUrl?: string;
  heavyAttackSfxUrl?: string;
  idleSpriteUrl: string;
  attackSpriteUrl: string;
  heavyAttackSpriteUrl?: string;
  slashSpriteUrl?: string;
  attackProjectileUrl?: string;
  attackProjectileFrames?: number;
  undergroundSpikesUrl?: string;
  undergroundSpikesFrames?: number;
  idleFrames?: number;
  attackFrames?: number;
  heavyAttackFrames?: number;
  idleFrameWidth?: number;
  attackFrameWidth?: number;
  heavyFrameWidth?: number;
  idleFrameHeight?: number;
  attackFrameHeight?: number;
  heavyFrameHeight?: number;
  idleFps?: number;
  idleDuration?: number;
  animState: BossAnimState;
  onAttackComplete?: () => void;
  className?: string;
  scale?: number;
  isHit?: boolean;
  isEnraged?: boolean;
  isShielded?: boolean;
}

export function BossSpriteAnimator({
  bossName,
  normalAttackSfxUrl,
  heavyAttackSfxUrl,
  idleSpriteUrl,
  attackSpriteUrl,
  heavyAttackSpriteUrl,
  slashSpriteUrl,
  attackProjectileUrl,
  attackProjectileFrames = 5,
  undergroundSpikesUrl,
  idleFrames = 7,
  attackFrames = 17,
  heavyAttackFrames = 11,
  idleFrameWidth = 128,
  attackFrameWidth = 128,
  heavyFrameWidth = 176,
  idleFrameHeight = 128,
  attackFrameHeight = 128,
  heavyFrameHeight = 128,
  idleFps,
  idleDuration,
  animState,
  onAttackComplete,
  className,
  scale = 1,
  isHit = false,
  isEnraged = false,
  isShielded = false,
}: BossSpriteAnimatorProps) {
  const isAttacking = animState === "normal_attack" || animState === "heavy_attack";
  const isHeavy = animState === "heavy_attack";
  const isNormalAttack = animState === "normal_attack";
  const isSpecter = Boolean(
    bossName?.toLowerCase().includes('specter') ||
    idleSpriteUrl?.includes('clinchem_finalboss') ||
    heavyAttackSpriteUrl?.includes('clinchem_finalboss') ||
    attackSpriteUrl?.includes('clinchem_finalboss') ||
    attackProjectileUrl?.includes('clinchem_finalboss')
  );
  const hasProjectile = isNormalAttack && (!!attackProjectileUrl || isSpecter);

  const isSickleCellMinionAttack = !heavyAttackSpriteUrl?.includes('hematology_finalboss') && !attackSpriteUrl?.includes('hematology_finalboss') && isAttacking && (
    attackSpriteUrl?.includes('hematology_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('hematology_chapterOneMinion') ||
    (bossName?.toLowerCase().includes('sickle cell') && !bossName?.toLowerCase().includes('reaper'))
  );
  const isSickleCellMinionHeavy = isHeavy && isSickleCellMinionAttack;
  const isSickleCellMinionNormal = !isHeavy && isSickleCellMinionAttack;
  const isSickleCellMinionIdle = !heavyAttackSpriteUrl?.includes('hematology_finalboss') && !attackSpriteUrl?.includes('hematology_finalboss') && !idleSpriteUrl?.includes('hematology_finalboss') && !isAttacking && (
    idleSpriteUrl?.includes('hematology_chapterOneMinion') ||
    (bossName?.toLowerCase().includes('sickle cell') && !bossName?.toLowerCase().includes('reaper'))
  );

  const isAnemiaShadeAttack = isAttacking && (
    attackSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
    idleSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
    bossName?.toLowerCase().includes('anemia shade')
  );
  const isAnemiaShadeHeavy = isHeavy && isAnemiaShadeAttack;
  const isAnemiaShadeNormal = !isHeavy && isAnemiaShadeAttack;
  const isAnemiaShadeIdle = !isAttacking && (
    idleSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
    bossName?.toLowerCase().includes('anemia shade')
  );
  const isAnemiaShade = (
    bossName?.toLowerCase().includes('anemia shade') ||
    idleSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
    attackSpriteUrl?.includes('hematology_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('hematology_chapterOneMiniBoss')
  );

  const hasUndergroundSpikes = !isSickleCellMinionAttack && !isAnemiaShadeAttack && isNormalAttack && !!undergroundSpikesUrl;

  const currentSpriteUrl = isHeavy
    ? (heavyAttackSpriteUrl || attackSpriteUrl)
    : (isNormalAttack && hasProjectile)
      ? idleSpriteUrl
      : isAttacking
        ? attackSpriteUrl
        : idleSpriteUrl;

  const isHydraAttack = isAttacking && (
    attackSpriteUrl?.includes('immunohema_chapterThreeFinalBoss') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterThreeFinalBoss') ||
    idleSpriteUrl?.includes('immunohema_chapterThreeFinalBoss') ||
    bossName?.toLowerCase().includes('hydra')
  );
  const isHydraHeavy = isHeavy && isHydraAttack;
  const isHydraNormal = !isHeavy && isHydraAttack;
  const isAntiSerumHydra = Boolean(
    bossName?.toLowerCase().includes('hydra') ||
    idleSpriteUrl?.includes('immunohema_chapterThreeFinalBoss') ||
    attackSpriteUrl?.includes('immunohema_chapterThreeFinalBoss') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterThreeFinalBoss')
  );
  const isHydraVerticalSprite = Boolean(
    currentSpriteUrl?.includes('immunohema_chapterThreeFinalBoss_idleAnimation') ||
    (!isAttacking && isAntiSerumHydra)
  );

  const isLymphocyteSwarmAttack = isAttacking && (
    attackSpriteUrl?.includes('immunohema_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterOneMinion') ||
    idleSpriteUrl?.includes('immunohema_chapterOneMinion') ||
    bossName?.toLowerCase().includes('lymphocyte')
  );
  const isLymphocyteSwarmHeavy = isHeavy && isLymphocyteSwarmAttack;
  const isLymphocyteSwarmNormal = !isHeavy && isLymphocyteSwarmAttack;
  const isLymphocyteSwarmIdle = !isAttacking && (
    idleSpriteUrl?.includes('immunohema_chapterOneMinion') ||
    bossName?.toLowerCase().includes('lymphocyte')
  );
  const isLymphocyteSwarm = (
    bossName?.toLowerCase().includes('lymphocyte') ||
    idleSpriteUrl?.includes('immunohema_chapterOneMinion') ||
    attackSpriteUrl?.includes('immunohema_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterOneMinion')
  );

  const isHyperglycemicMutantAttack = !isSpecter && isAttacking && (
    attackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
    idleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
    (bossName?.toLowerCase().includes('mutant') && !bossName?.toLowerCase().includes('specter')) ||
    bossName?.toLowerCase().includes('hyperglemic mutant') ||
    bossName?.toLowerCase().includes('hyperglycemic mutant')
  );
  const isHyperglycemicMutantHeavy = isHeavy && isHyperglycemicMutantAttack;
  const isHyperglycemicMutantNormal = !isHeavy && isHyperglycemicMutantAttack;
  const isHyperglycemicMutantIdle = !isSpecter && !isAttacking && (
    idleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
    (bossName?.toLowerCase().includes('mutant') && !bossName?.toLowerCase().includes('specter')) ||
    bossName?.toLowerCase().includes('hyperglemic mutant') ||
    bossName?.toLowerCase().includes('hyperglycemic mutant')
  );
  const isHyperglycemicMutant = !isSpecter && (
    (bossName?.toLowerCase().includes('mutant') && !bossName?.toLowerCase().includes('specter')) ||
    bossName?.toLowerCase().includes('hyperglemic mutant') ||
    bossName?.toLowerCase().includes('hyperglycemic mutant') ||
    idleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
    attackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneMiniBoss')
  );

  const isImmuneArchonAttack = isAttacking && (
    attackSpriteUrl?.includes('immunohema_chapterOneBoss') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterOneBoss') ||
    bossName?.toLowerCase().includes('immune archon') ||
    (bossName?.toLowerCase().includes('archon') && !bossName?.toLowerCase().includes('hydra'))
  );
  const isImmuneArchonHeavy = isHeavy && isImmuneArchonAttack;
  const isImmuneArchonNormal = !isHeavy && isImmuneArchonAttack;
  const isImmuneArchonIdle = !isAttacking && (
    idleSpriteUrl?.includes('immunohema_chapterOneBoss') ||
    bossName?.toLowerCase().includes('immune archon') ||
    (bossName?.toLowerCase().includes('archon') && !bossName?.toLowerCase().includes('hydra'))
  );
  const isImmuneArchon = (
    bossName?.toLowerCase().includes('immune archon') ||
    (bossName?.toLowerCase().includes('archon') && !bossName?.toLowerCase().includes('hydra')) ||
    idleSpriteUrl?.includes('immunohema_chapterOneBoss') ||
    attackSpriteUrl?.includes('immunohema_chapterOneBoss') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterOneBoss')
  );

  const currentTotalFrames = isHydraHeavy
    ? 14
    : isHydraNormal
      ? (attackFrames && attackFrames >= 31 ? attackFrames : 31)
      : isHydraVerticalSprite
        ? 19
        : isLymphocyteSwarmHeavy
          ? 10
          : isLymphocyteSwarmNormal
            ? 14
            : isLymphocyteSwarmIdle
              ? 11
              : isHyperglycemicMutantHeavy
                ? 8
                : isHyperglycemicMutantNormal
                  ? 8
                  : isHyperglycemicMutantIdle
                    ? 9
                    : isAnemiaShadeHeavy
                      ? 15
                      : isAnemiaShadeNormal
                        ? 18
                        : isAnemiaShadeIdle
                          ? 7
                          : isImmuneArchonHeavy
                            ? 18
                            : isImmuneArchonNormal
                              ? 11
                              : isImmuneArchonIdle
                                ? 7
                                : isHeavy
                      ? (heavyAttackFrames || 11)
                      : (isNormalAttack && hasProjectile)
                        ? idleFrames
                        : isAttacking
                          ? attackFrames
                          : idleFrames;

  const currentFrameWidth = isHydraHeavy
    ? 143
    : isHydraNormal
      ? (attackFrameWidth && attackFrameWidth >= 300 ? attackFrameWidth : 384)
      : isHydraVerticalSprite
        ? 143
        : isLymphocyteSwarm
          ? 257
          : isHyperglycemicMutantHeavy
            ? (heavyFrameWidth || 190)
            : isHyperglycemicMutantNormal
              ? (attackFrameWidth || 250)
              : isHyperglycemicMutantIdle
                ? (idleFrameWidth || 183)
                : isImmuneArchonHeavy
                  ? 247
                  : isImmuneArchonNormal
                    ? 252
                    : isImmuneArchonIdle
                      ? 284
                      : isHeavy
                  ? (heavyFrameWidth || 176)
                  : (isNormalAttack && hasProjectile)
                    ? (idleFrameWidth || 128)
                    : isAttacking
                      ? (attackFrameWidth || 128)
                      : (idleFrameWidth || 128);

  const currentFrameHeight = isHydraHeavy
    ? 144
    : isHydraNormal
      ? (attackFrameHeight && attackFrameHeight >= 200 ? attackFrameHeight : 256)
      : isHydraVerticalSprite
        ? 144
        : isLymphocyteSwarm
          ? 218
          : isHyperglycemicMutantHeavy
            ? (heavyFrameHeight || 154)
            : isHyperglycemicMutantNormal
              ? (attackFrameHeight || 210)
              : isHyperglycemicMutantIdle
                ? (idleFrameHeight || 194)
                : isImmuneArchonHeavy
                  ? 228
                  : isImmuneArchonNormal
                    ? 177
                    : isImmuneArchonIdle
                      ? 220
                      : isHeavy
                  ? (heavyFrameHeight || (heavyFrameWidth && heavyFrameWidth >= 300 ? 256 : 128))
                  : (isNormalAttack && hasProjectile)
                    ? (idleFrameHeight || 128)
                    : isAttacking
                      ? (attackFrameHeight || (attackFrameWidth && attackFrameWidth >= 300 ? 256 : 128))
                      : (idleFrameHeight || 128);

  const isReagentStripSlimeAttack = isAttacking && (
    attackSpriteUrl?.includes('clinmicro_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('clinmicro_chapterOneMinion') ||
    bossName?.toLowerCase().includes('reagent strip')
  );
  const isReagentStripSlimeHeavy = isHeavy && isReagentStripSlimeAttack;
  const isReagentStripSlimeNormal = !isHeavy && isReagentStripSlimeAttack;
  const isReagentStripSlimeIdle = !isAttacking && (
    idleSpriteUrl?.includes('clinmicro_chapterOneMinion') ||
    bossName?.toLowerCase().includes('reagent strip')
  );
  const isReagentStripSlime = (
    bossName?.toLowerCase().includes('reagent strip') ||
    idleSpriteUrl?.includes('clinmicro_chapterOneMinion') ||
    attackSpriteUrl?.includes('clinmicro_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('clinmicro_chapterOneMinion')
  );

  const isKetoacidosisColossusAttack = !isSpecter && isAttacking && (
    attackSpriteUrl?.includes('clinchem_chapterOneBoss') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneBoss') ||
    bossName?.toLowerCase().includes('ketoacidosis') ||
    bossName?.toLowerCase().includes('colossus')
  );
  const isKetoacidosisColossusHeavy = isHeavy && isKetoacidosisColossusAttack;
  const isKetoacidosisColossusNormal = !isHeavy && isKetoacidosisColossusAttack;
  const isKetoacidosisColossusIdle = !isSpecter && !isAttacking && (
    idleSpriteUrl?.includes('clinchem_chapterOneBoss') ||
    bossName?.toLowerCase().includes('ketoacidosis') ||
    bossName?.toLowerCase().includes('colossus')
  );
  const isKetoacidosisColossus = !isSpecter && (
    bossName?.toLowerCase().includes('ketoacidosis') ||
    bossName?.toLowerCase().includes('colossus') ||
    idleSpriteUrl?.includes('clinchem_chapterOneBoss') ||
    attackSpriteUrl?.includes('clinchem_chapterOneBoss') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneBoss')
  );

  const isAntigenTitanAttack = !isLymphocyteSwarm && isAttacking && (
    attackSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
    bossName?.toLowerCase().includes('antigen titan') ||
    (bossName?.toLowerCase().includes('antigen') && !bossName?.toLowerCase().includes('abo'))
  );
  const isAntigenTitanHeavy = isHeavy && isAntigenTitanAttack;
  const isAntigenTitanNormal = !isHeavy && isAntigenTitanAttack;
  const isAntigenTitanIdle = !isLymphocyteSwarm && !isAttacking && (
    idleSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
    bossName?.toLowerCase().includes('antigen titan') ||
    (bossName?.toLowerCase().includes('antigen') && !bossName?.toLowerCase().includes('abo'))
  );
  const isAntigenTitan = !isLymphocyteSwarm && (
    bossName?.toLowerCase().includes('antigen titan') ||
    (bossName?.toLowerCase().includes('antigen') && !bossName?.toLowerCase().includes('abo')) ||
    idleSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
    attackSpriteUrl?.includes('immunohema_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('immunohema_chapterOneMiniBoss')
  );

  const isWideBeam = isAttacking && currentFrameWidth >= 300 && !isReagentStripSlimeAttack && !isHydraAttack && !isKetoacidosisColossusAttack && !isAntigenTitanAttack && !isImmuneArchonAttack;

  const effectiveScale = isHyperglycemicMutant
    ? scale * 1.55
    : isAntigenTitan
      ? scale * 1.85
      : isKetoacidosisColossus
        ? scale * 1.18
        : isImmuneArchon
          ? scale * 1.35
          : isReagentStripSlimeAttack
          ? Math.min(scale, 1.0)
          : scale;

  // Frame rates (fps) - Tuned for fast, immediate and punchy combat animations
  const fps = isHeavy
    ? (currentTotalFrames <= 6 ? 9 : Math.max(18, currentTotalFrames))
    : (isNormalAttack && hasProjectile)
      ? 8
      : (isNormalAttack && hasUndergroundSpikes)
        ? 14
        : isAttacking
          ? Math.max(16, currentTotalFrames)
          : 8;
  const isBiohazardIdle = !isAttacking && (idleSpriteUrl?.includes('microbio_finalboss_idleAnimation') || idleFps !== undefined || idleDuration !== undefined);

  const isGramPositiveAttack = isAttacking && (
    attackSpriteUrl?.includes('microbio_chapterOneBoss_normalAttackAnimation') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneBoss_normalAttackAnimation') ||
    bossName?.toLowerCase().includes('gram positive') ||
    heavyAttackSfxUrl?.includes('GramPositive') ||
    normalAttackSfxUrl?.includes('GramPositive')
  );
  const isGramPositiveHeavy = isHeavy && isGramPositiveAttack;
  const isGramPositiveNormal = !isHeavy && isGramPositiveAttack;

  const isStaphSentinelAttack = isAttacking && (
    attackSpriteUrl?.includes('microbio_chapterOneMiniBoss_normalAttackAnimation') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneMiniBoss_normalAttackAnimation') ||
    bossName?.toLowerCase().includes('staph')
  );
  const isStaphSentinelHeavy = isHeavy && isStaphSentinelAttack;
  const isStaphSentinelNormal = !isHeavy && isStaphSentinelAttack;

  const isBiohazardAttack = !isStaphSentinelAttack && isAttacking && (
    attackSpriteUrl?.includes('microbio_finalboss') ||
    heavyAttackSpriteUrl?.includes('microbio_finalboss') ||
    bossName?.toLowerCase().includes('biohazard') ||
    heavyAttackSfxUrl?.includes('Biohazard') ||
    normalAttackSfxUrl?.includes('Biohazard')
  );
  const isBiohazardHeavy = isHeavy && isBiohazardAttack;
  const isBiohazardNormal = !isHeavy && isBiohazardAttack;

  const isCrystalGolemAttack = isAttacking && (
    attackSpriteUrl?.includes('clinmicro_finalboss') ||
    heavyAttackSpriteUrl?.includes('clinmicro_finalboss') ||
    bossName?.toLowerCase().includes('crystal golem') ||
    heavyAttackSfxUrl?.includes('CrystalGolem') ||
    normalAttackSfxUrl?.includes('CrystalGolem')
  );

  const isMicrobeSwarmAttack = isAttacking && (
    attackSpriteUrl?.includes('microbio_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneMinion') ||
    bossName?.toLowerCase().includes('microbe swarm') ||
    heavyAttackSfxUrl?.includes('MicrobeSwarm') ||
    normalAttackSfxUrl?.includes('MicrobeSwarm')
  );
  const isMicrobeSwarmHeavy = isHeavy && isMicrobeSwarmAttack;
  const isMicrobeSwarmNormal = !isHeavy && isMicrobeSwarmAttack;

  const isSickleCellReaperAttack = isAttacking && (
    heavyAttackSpriteUrl?.includes('hematology_finalboss') ||
    attackSpriteUrl?.includes('hematology_finalboss') ||
    undergroundSpikesUrl?.includes('hematology_finalboss') ||
    bossName?.toLowerCase().includes('reaper') ||
    (bossName?.toLowerCase().includes('sickle') && !bossName?.toLowerCase().includes('sickle cell')) ||
    (heavyAttackSfxUrl?.includes('SickleCellReaper') && !attackSpriteUrl?.includes('hematology_chapterOneMinion')) ||
    (normalAttackSfxUrl?.includes('SickleCellReaper') && !attackSpriteUrl?.includes('hematology_chapterOneMinion'))
  );
  const isSickleCellReaperHeavy = isHeavy && isSickleCellReaperAttack;
  const isSickleCellReaperNormal = !isHeavy && isSickleCellReaperAttack;
  const isReaperGlintNormal = !isHeavy && isAttacking && (
    attackSpriteUrl?.includes('hematology_finalboss_normalAttackGlintAnimation') ||
    isSickleCellReaperNormal ||
    hasUndergroundSpikes
  );
  const isReaperGlintSprite = isReaperGlintNormal && (
    currentSpriteUrl?.includes('hematology_finalboss_normalAttackGlintAnimation') ||
    attackSpriteUrl?.includes('hematology_finalboss_normalAttackGlintAnimation')
  );

  const isAcidSlimeAttack = !isSpecter && !isReagentStripSlimeAttack && !isHyperglycemicMutant && !isHyperglycemicMutantAttack && isAttacking && (
    attackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    bossName?.toLowerCase().includes('acid slime') ||
    (bossName?.toLowerCase().includes('slime') && !bossName?.toLowerCase().includes('reagent')) ||
    (!idleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') && !attackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') && !heavyAttackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') && (heavyAttackSfxUrl?.includes('AcidSlime') || normalAttackSfxUrl?.includes('AcidSlime')))
  );
  const isAcidSlimeHeavy = isHeavy && isAcidSlimeAttack;
  const isAcidSlimeNormal = !isHeavy && isAcidSlimeAttack;
  const isAcidSlimeIdle = !isSpecter && !isAttacking && !isReagentStripSlimeIdle && (
    idleSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    bossName?.toLowerCase().includes('acid slime') ||
    (bossName?.toLowerCase().includes('slime') && !bossName?.toLowerCase().includes('reagent'))
  );

  const isGmsFungalSporeAttack = isAttacking && (
    attackSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    bossName?.toLowerCase().includes('fungal spore') ||
    bossName?.toLowerCase().includes('gms') ||
    heavyAttackSfxUrl?.includes('GmsFungalSpore') ||
    normalAttackSfxUrl?.includes('GmsFungalSpore')
  );
  const isGmsFungalSporeHeavy = isHeavy && isGmsFungalSporeAttack;
  const isGmsFungalSporeNormal = !isHeavy && isGmsFungalSporeAttack;
  const isGmsFungalSporeIdle = !isAttacking && (
    idleSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    bossName?.toLowerCase().includes('fungal spore') ||
    bossName?.toLowerCase().includes('gms')
  );

  const isLegalBeholderAttack = isAttacking && (
    attackSpriteUrl?.includes('hispatho_chapterThreeFinalBoss') ||
    heavyAttackSpriteUrl?.includes('hispatho_chapterThreeFinalBoss') ||
    idleSpriteUrl?.includes('hispatho_chapterThreeFinalBoss') ||
    bossName?.toLowerCase().includes('legal beholder')
  );
  const isLegalBeholderNormal = !isHeavy && isLegalBeholderAttack;
  const isLegalBeholderHeavy = isHeavy && isLegalBeholderAttack;

  const spriteDuration = (isNormalAttack && hasProjectile)
    ? 0.38
    : (isNormalAttack && hasUndergroundSpikes)
      ? 0.42
      : isGramPositiveHeavy
        ? 0.625
        : isGramPositiveNormal
          ? 0.72
          : isStaphSentinelHeavy
            ? 0.50
            : isStaphSentinelNormal
              ? 0.58
              : isMicrobeSwarmHeavy
                ? 0.75
                : isMicrobeSwarmNormal
                  ? 0.65
                  : isSickleCellMinionHeavy
                          ? 0.85
                          : isSickleCellMinionNormal
                            ? 0.72
                            : isSickleCellMinionIdle
                              ? (idleDuration || 1.3)
                              : isAnemiaShadeHeavy
                                ? 1.55
                                : isAnemiaShadeNormal
                                  ? 1.25
                                  : isAnemiaShadeIdle
                                    ? (idleDuration || 1.0)
                                    : isSickleCellReaperHeavy
                                ? 0.70
                                : isReaperGlintNormal
                                  ? 0.45
                                  : isSickleCellReaperNormal
                                    ? 0.45
                                    : isHyperglycemicMutantHeavy
                                      ? 0.95
                                      : isHyperglycemicMutantNormal
                                        ? 0.80
                                        : isHyperglycemicMutantIdle
                                          ? (idleDuration || 0.9)
                                          : isBiohazardHeavy
                                            ? 0.82
                                            : isBiohazardNormal
                                              ? 0.48
                                              : isLegalBeholderHeavy
                                                ? 1.15
                                                : isLegalBeholderNormal
                                                  ? 0.66
                                                  : isHydraHeavy
                                                    ? 1.05
                                                    : isHydraNormal
                                                      ? 1.25
                                                      : isAcidSlimeHeavy
                                                        ? 0.82
                                                        : isAcidSlimeNormal
                                                          ? 0.58
                                                          : isAcidSlimeIdle
                                                            ? (idleDuration || 2.8)
                                                            : isGmsFungalSporeHeavy
                                                              ? 0.81
                                                              : isGmsFungalSporeNormal
                                                                ? 0.67
                                                                : isGmsFungalSporeIdle
                                                                  ? (idleDuration || 1.0)
                                                                  : isReagentStripSlimeHeavy
                                                                    ? 1.03
                                                                    : isReagentStripSlimeNormal
                                                                      ? 0.80
                                                                      : isReagentStripSlimeIdle
                                                                        ? (idleDuration || 1.0)
                                                                        : isLymphocyteSwarmHeavy
                                                                          ? 0.82
                                                                          : isLymphocyteSwarmNormal
                                                                            ? 0.78
                                                                            : isLymphocyteSwarmIdle
                                                                              ? (idleDuration || 1.2)
                                                                              : isKetoacidosisColossusHeavy
                                                                                ? 0.85
                                                                                : isKetoacidosisColossusNormal
                                                                                  ? 0.70
                                                                                  : isKetoacidosisColossusIdle
                                                                                    ? (idleDuration || 1.0)
                                                                                    : isAntigenTitanHeavy
                                                                                      ? 0.85
                                                                                      : isAntigenTitanNormal
                                                                                        ? 0.70
                                                                                        : isAntigenTitanIdle
                                                                                          ? (idleDuration || 1.0)
                                                                                          : isImmuneArchonHeavy
                                                                                            ? 1.55
                                                                                            : isImmuneArchonNormal
                                                                                              ? 0.80
                                                                                              : isImmuneArchonIdle
                                                                                                ? (idleDuration || 1.0)
                                                                                          : isBiohazardIdle
                                                                                            ? (idleDuration || (idleFps ? currentTotalFrames / idleFps : 1.05))
                                                                                            : Math.max(0.48, Math.min(0.62, currentTotalFrames / fps));

  const totalAttackDuration = isGramPositiveHeavy
    ? spriteDuration * 2
    : isGramPositiveNormal
      ? 0.72
      : isStaphSentinelHeavy
        ? spriteDuration * 2
        : isStaphSentinelNormal
          ? 0.58
          : isMicrobeSwarmHeavy
            ? 0.75
            : isMicrobeSwarmNormal
              ? 0.65
              : isSickleCellMinionHeavy
                ? 0.85
                : isSickleCellMinionNormal
                  ? 0.72
                  : isAnemiaShadeHeavy
                    ? 1.55
                    : isAnemiaShadeNormal
                      ? 1.25
                      : isSickleCellReaperHeavy
                    ? 0.70
                    : isReaperGlintNormal
                      ? 1.05
                      : isSickleCellReaperNormal
                        ? 1.05
                        : isHyperglycemicMutantHeavy
                          ? 0.95
                          : isHyperglycemicMutantNormal
                            ? 0.80
                            : isBiohazardHeavy
                              ? 0.82
                              : isBiohazardNormal
                                ? 0.48
                                : isLegalBeholderHeavy
                                  ? 1.15
                                  : isLegalBeholderNormal
                                    ? 0.66
                                    : isHydraHeavy
                                      ? 1.05
                                      : isHydraNormal
                                        ? 1.85
                                        : isAcidSlimeHeavy
                                          ? 0.82
                                          : isAcidSlimeNormal
                                            ? 0.58
                                            : isGmsFungalSporeHeavy
                                              ? 0.81
                                              : isGmsFungalSporeNormal
                                                ? 0.67
                                                : isReagentStripSlimeHeavy
                                                  ? 1.03
                                                  : isReagentStripSlimeNormal
                                                    ? 0.80
                                                    : isLymphocyteSwarmHeavy
                                                      ? 0.82
                                                      : isLymphocyteSwarmNormal
                                                        ? 0.78
                                                        : isKetoacidosisColossusHeavy
                                                          ? 0.85
                                                          : isKetoacidosisColossusNormal
                                                            ? 0.70
                                                            : isAntigenTitanHeavy
                                                              ? 0.85
                                                              : isAntigenTitanNormal
                                                                ? 0.70
                                                                : isImmuneArchonHeavy
                                                                  ? 1.55
                                                                  : isImmuneArchonNormal
                                                                    ? 0.80
                                                                : spriteDuration;

  const lungeDuration = isAttacking
    ? (hasProjectile ? 0.45 : isAnemiaShadeHeavy ? 1.55 : isAnemiaShadeNormal ? 1.25 : isReaperGlintNormal ? 1.05 : hasUndergroundSpikes ? 1.05 : isLegalBeholderHeavy ? 1.15 : isLegalBeholderNormal ? 1.05 : isHydraHeavy ? 1.05 : isHydraNormal ? 1.85 : isHyperglycemicMutantHeavy ? 0.95 : isHyperglycemicMutantNormal ? 0.80 : isKetoacidosisColossusHeavy ? 0.85 : isKetoacidosisColossusNormal ? 0.70 : isAntigenTitanHeavy ? 0.85 : isAntigenTitanNormal ? 0.70 : isImmuneArchonHeavy ? 1.55 : isImmuneArchonNormal ? 0.90 : totalAttackDuration + (isStaphSentinelHeavy ? 0.38 : (isBiohazardHeavy ? 0.36 : (isSickleCellMinionAttack ? 0.16 : (isGmsFungalSporeAttack ? 0.18 : (isReagentStripSlimeAttack ? 0.08 : (isLymphocyteSwarmAttack ? 0.12 : 0.35)))))))
    : spriteDuration;

  // Store callback in ref to prevent parent re-render reference changes from restarting timer
  const onCompleteRef = useRef(onAttackComplete);
  useEffect(() => {
    onCompleteRef.current = onAttackComplete;
  }, [onAttackComplete]);


  const isStaphSentinel = (
    bossName?.toLowerCase().includes('staph') ||
    idleSpriteUrl?.includes('microbio_chapterOneMiniBoss') ||
    attackSpriteUrl?.includes('microbio_chapterOneMiniBoss') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneMiniBoss')
  );

  const isBiohazard = !isStaphSentinel && (
    bossName?.toLowerCase().includes('biohazard') ||
    idleSpriteUrl?.includes('microbio_finalboss') ||
    heavyAttackSpriteUrl?.includes('microbio_finalboss') ||
    attackSpriteUrl?.includes('microbio_finalboss') ||
    heavyAttackSfxUrl?.includes('Biohazard') ||
    normalAttackSfxUrl?.includes('Biohazard')
  );

  const isCrystalGolem = (
    bossName?.toLowerCase().includes('crystal golem') ||
    idleSpriteUrl?.includes('clinmicro_finalboss') ||
    heavyAttackSpriteUrl?.includes('clinmicro_finalboss') ||
    attackSpriteUrl?.includes('clinmicro_finalboss') ||
    heavyAttackSfxUrl?.includes('CrystalGolem') ||
    normalAttackSfxUrl?.includes('CrystalGolem')
  );

  const isMicrobeSwarm = (
    bossName?.toLowerCase().includes('microbe swarm') ||
    idleSpriteUrl?.includes('microbio_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneMinion') ||
    attackSpriteUrl?.includes('microbio_chapterOneMinion') ||
    heavyAttackSfxUrl?.includes('MicrobeSwarm') ||
    normalAttackSfxUrl?.includes('MicrobeSwarm')
  );

  const isSickleCellMinion = !heavyAttackSpriteUrl?.includes('hematology_finalboss') && !attackSpriteUrl?.includes('hematology_finalboss') && !idleSpriteUrl?.includes('hematology_finalboss') && (
    idleSpriteUrl?.includes('hematology_chapterOneMinion') ||
    attackSpriteUrl?.includes('hematology_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('hematology_chapterOneMinion') ||
    (bossName?.toLowerCase().includes('sickle cell') && !bossName?.toLowerCase().includes('reaper'))
  );

  const isSickleCellReaper = (
    heavyAttackSpriteUrl?.includes('hematology_finalboss') ||
    attackSpriteUrl?.includes('hematology_finalboss') ||
    idleSpriteUrl?.includes('hematology_finalboss') ||
    undergroundSpikesUrl?.includes('hematology_finalboss') ||
    bossName?.toLowerCase().includes('reaper') ||
    (bossName?.toLowerCase().includes('sickle') && !bossName?.toLowerCase().includes('sickle cell')) ||
    (heavyAttackSfxUrl?.includes('SickleCellReaper') && !attackSpriteUrl?.includes('hematology_chapterOneMinion')) ||
    (normalAttackSfxUrl?.includes('SickleCellReaper') && !attackSpriteUrl?.includes('hematology_chapterOneMinion'))
  );

  const isGramPositive = (
    bossName?.toLowerCase().includes('gram positive') ||
    idleSpriteUrl?.includes('microbio_chapterOneBoss') ||
    attackSpriteUrl?.includes('microbio_chapterOneBoss') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneBoss') ||
    heavyAttackSfxUrl?.includes('GramPositive') ||
    normalAttackSfxUrl?.includes('GramPositive')
  );

  const isAcidSlime = !isSpecter && !isReagentStripSlime && !isHyperglycemicMutant && !isHyperglycemicMutantAttack && (
    bossName?.toLowerCase().includes('acid slime') ||
    (bossName?.toLowerCase().includes('slime') && !bossName?.toLowerCase().includes('reagent')) ||
    idleSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    attackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    (!idleSpriteUrl?.includes('clinchem_chapterOneMiniBoss') && !attackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') && !heavyAttackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') && (heavyAttackSfxUrl?.includes('AcidSlime') || normalAttackSfxUrl?.includes('AcidSlime')))
  );

  const isGmsFungalSpore = (
    bossName?.toLowerCase().includes('fungal spore') ||
    bossName?.toLowerCase().includes('gms') ||
    idleSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    attackSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    heavyAttackSfxUrl?.includes('FungalSpore') ||
    normalAttackSfxUrl?.includes('FungalSpore')
  );

  // Preload Specter, Staph Sentinel, Biohazard, Crystal Golem, Microbe Swarm, Sickle-Cell Reaper, Acid Slime, Gram Positive Overlord, and GMS Fungal Spore audio files immediately so playback starts with 0ms latency
  useEffect(() => {
    if (isSpecter || heavyAttackSfxUrl?.includes('Specter') || normalAttackSfxUrl?.includes('Specter')) {
      preloadSpecterSounds();
    }
    if (isStaphSentinel) {
      preloadStaphSentinelSounds();
    }
    if (isBiohazard || heavyAttackSfxUrl?.includes('Biohazard') || normalAttackSfxUrl?.includes('Biohazard')) {
      preloadBiohazardSounds();
    }
    if (isCrystalGolem || isAntigenTitan || isAntigenTitanAttack || heavyAttackSfxUrl?.includes('CrystalGolem') || normalAttackSfxUrl?.includes('CrystalGolem')) {
      preloadCrystalGolemSounds();
    }
    if (isMicrobeSwarm || heavyAttackSfxUrl?.includes('MicrobeSwarm') || normalAttackSfxUrl?.includes('MicrobeSwarm')) {
      preloadMicrobeSwarmSounds();
    }
    if (isSickleCellReaper || isSickleCellReaperAttack || heavyAttackSpriteUrl?.includes('hematology_finalboss') || heavyAttackSfxUrl?.includes('SickleCellReaper') || normalAttackSfxUrl?.includes('SickleCellReaper')) {
      preloadSickleCellReaperSounds();
    }
    if (isSickleCellMinion || isSickleCellMinionAttack || heavyAttackSfxUrl?.includes('SickleCellHeavyAttack') || normalAttackSfxUrl?.includes('SickleCellNormalAttack')) {
      preloadSickleCellMinionSounds();
    }
    if (isAnemiaShade || isAnemiaShadeAttack) {
      preloadAnemiaShadeSounds();
    }
    if (isAcidSlime || heavyAttackSfxUrl?.includes('AcidSlime') || normalAttackSfxUrl?.includes('AcidSlime')) {
      preloadAcidSlimeSounds();
    }
    if (isSpecter || heavyAttackSfxUrl?.includes('Specter') || normalAttackSfxUrl?.includes('Specter')) {
      preloadSpecterSounds();
    }
    if (isGramPositive || isGramPositiveAttack || heavyAttackSfxUrl?.includes('GramPositive') || normalAttackSfxUrl?.includes('GramPositive')) {
      preloadGramPositiveSounds();
    }
    if (isGmsFungalSpore || isGmsFungalSporeAttack || heavyAttackSfxUrl?.includes('FungalSpore') || normalAttackSfxUrl?.includes('FungalSpore')) {
      preloadFungalSporeSounds();
    }
    if (isReagentStripSlime || isReagentStripSlimeAttack || heavyAttackSfxUrl?.includes('ReagentStripSlime') || normalAttackSfxUrl?.includes('ReagentStripSlime')) {
      preloadReagentStripSlimeSounds();
    }
    if (isLymphocyteSwarm || isLymphocyteSwarmAttack || heavyAttackSfxUrl?.includes('MicrobeSwarm') || normalAttackSfxUrl?.includes('MicrobeSwarm')) {
      preloadMicrobeSwarmSounds();
    }
    if (isHydraAttack || isAntiSerumHydra || heavyAttackSfxUrl?.includes('Hydra') || normalAttackSfxUrl?.includes('Hydra')) {
      preloadHydraSounds();
    }
    if (isKetoacidosisColossus || isKetoacidosisColossusAttack || isAntigenTitan || isAntigenTitanAttack || heavyAttackSfxUrl?.includes('Ketoacidosis') || normalAttackSfxUrl?.includes('Ketoacidosis') || attackSpriteUrl?.includes('clinchem_chapterOneBoss') || attackSpriteUrl?.includes('immunohema_chapterOneMiniBoss')) {
      preloadKetoacidosisSounds();
    }
    if (isLegalBeholderAttack || heavyAttackSfxUrl?.includes('LegalBeholder') || normalAttackSfxUrl?.includes('LegalBeholder') || attackSpriteUrl?.includes('hispatho_chapterThreeFinalBoss') || heavyAttackSpriteUrl?.includes('hispatho_chapterThreeFinalBoss')) {
      preloadLegalBeholderSounds();
    }
    if (isHyperglycemicMutant || isHyperglycemicMutantAttack || attackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') || heavyAttackSpriteUrl?.includes('clinchem_chapterOneMiniBoss')) {
      preloadHyperglycemicMutantSounds();
    }
    if (isImmuneArchon || isImmuneArchonAttack || attackSpriteUrl?.includes('immunohema_chapterOneBoss') || heavyAttackSpriteUrl?.includes('immunohema_chapterOneBoss')) {
      preloadImmuneArchonSounds();
    }
  }, [isSpecter, isStaphSentinel, isBiohazard, isCrystalGolem, isMicrobeSwarm, isSickleCellReaper, isSickleCellReaperAttack, isSickleCellMinion, isSickleCellMinionAttack, isAnemiaShade, isAnemiaShadeAttack, isAcidSlime, isGramPositive, isGramPositiveAttack, isGmsFungalSpore, isGmsFungalSporeAttack, isReagentStripSlime, isReagentStripSlimeAttack, isLymphocyteSwarm, isLymphocyteSwarmAttack, isHydraAttack, isAntiSerumHydra, isKetoacidosisColossus, isKetoacidosisColossusAttack, isAntigenTitan, isAntigenTitanAttack, isLegalBeholderAttack, isHyperglycemicMutant, isHyperglycemicMutantAttack, isImmuneArchon, isImmuneArchonAttack, attackSpriteUrl, heavyAttackSpriteUrl, heavyAttackSfxUrl, normalAttackSfxUrl]);

  // Key to force reset DOM animation state whenever animState changes
  const [animKey, setAnimKey] = useState(0);
  const lastPlayedAnimRef = useRef<string | null>(null);
  const [anemiaHeavyPhase, setAnemiaHeavyPhase] = useState<'dash' | 'disappeared' | 'idle'>('dash');

  useEffect(() => {
    if (isAnemiaShadeHeavy) {
      setAnemiaHeavyPhase('dash');
      const disappearTimer = setTimeout(() => {
        setAnemiaHeavyPhase('disappeared');
      }, 620);
      const idleTimer = setTimeout(() => {
        setAnemiaHeavyPhase('idle');
      }, 1380);
      return () => {
        clearTimeout(disappearTimer);
        clearTimeout(idleTimer);
      };
    } else {
      setAnemiaHeavyPhase('dash');
    }
  }, [isAnemiaShadeHeavy, animKey]);

  useEffect(() => {
    let sfxTimer: NodeJS.Timeout | null = null;

    if (isAttacking) {
      if (lastPlayedAnimRef.current !== animState) {
        lastPlayedAnimRef.current = animState;
        if (isHyperglycemicMutant || isHyperglycemicMutantAttack || attackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') || heavyAttackSpriteUrl?.includes('clinchem_chapterOneMiniBoss') || (bossName?.toLowerCase().includes('mutant') && !bossName?.toLowerCase().includes('specter'))) {
          if (isHeavy) {
            // Delay heavy attack sound to 430ms so it lands precisely when both claws slam onto the ground/player
            sfxTimer = setTimeout(() => {
              playHyperglycemicMutantAttack('heavy');
            }, 430);
          } else if (isNormalAttack) {
            playHyperglycemicMutantAttack('normal');
          }
        } else if (isAcidSlime || isAcidSlimeAttack) {
          if (isHeavy) {
            playAcidSlimeAttack('heavy');
          } else if (isNormalAttack) {
            playAcidSlimeAttack('normal');
          }
        } else if (isKetoacidosisColossusAttack || isKetoacidosisColossus || attackSpriteUrl?.includes('clinchem_chapterOneBoss') || heavyAttackSpriteUrl?.includes('clinchem_chapterOneBoss')) {
          if (isHeavy) {
            // Colossus winds up its giant hammer overhead and slams down onto the player at 480ms
            sfxTimer = setTimeout(() => {
              playKetoacidosisAttack('heavy');
            }, 480);
          } else if (isNormalAttack) {
            playKetoacidosisAttack('normal');
          }
        } else if (isAntigenTitanAttack || isAntigenTitan || attackSpriteUrl?.includes('immunohema_chapterOneMiniBoss') || heavyAttackSpriteUrl?.includes('immunohema_chapterOneMiniBoss')) {
          if (isHeavy) {
            // Antigen Titan winds up overhead and slams the ground with heavy energy wave, landing impact smoothly at 460ms
            sfxTimer = setTimeout(() => {
              playCrystalGolemAttack('normal');
            }, 460);
          } else if (isNormalAttack) {
            playKetoacidosisAttack('normal');
          }
        } else if (isImmuneArchonAttack || isImmuneArchon || attackSpriteUrl?.includes('immunohema_chapterOneBoss') || heavyAttackSpriteUrl?.includes('immunohema_chapterOneBoss')) {
          if (isNormalAttack) {
            sfxTimer = setTimeout(() => {
              playImmuneArchonAttack('normal');
            }, 380);
          }
          // Note: Immune Archon heavy attack lightning sound is played smoothly by HydraLightningAnimator when the lightning animation strikes
        } else if (isSpecter) {
          if (isHeavy) {
            playSpecterAttack('heavy');
          } else if (isNormalAttack) {
            playSpecterAttack('normal');
          }
        } else if (isGramPositive || isGramPositiveAttack) {
          if (isHeavy) {
            playGramPositiveAttack('heavy');
          } else if (isNormalAttack) {
            playGramPositiveAttack('normal');
          }
        } else if (isSickleCellReaper || isSickleCellReaperAttack || heavyAttackSpriteUrl?.includes('hematology_finalboss')) {
          if (isHeavy) {
            playSickleCellReaperAttack('heavy');
          } else if (isNormalAttack) {
            // The underground spikes burst from the ground at 400ms delay after boss glint
            sfxTimer = setTimeout(() => {
              playSickleCellReaperAttack('normal');
            }, 400);
          }
        } else if (isSickleCellMinion || isSickleCellMinionAttack) {
          if (isHeavy) {
            playSickleCellMinionAttack('heavy');
          } else if (isNormalAttack) {
            playSickleCellMinionAttack('normal');
          }
        } else if (isAnemiaShade || isAnemiaShadeAttack) {
          if (isHeavy) {
            sfxTimer = setTimeout(() => {
              playAnemiaShadeAttack('heavy');
            }, 620);
          } else if (isNormalAttack) {
            // 430ms delay aligns audio whoosh perfectly with forward lunge and lands blade slice precisely on impact at 700ms
            sfxTimer = setTimeout(() => {
              playAnemiaShadeAttack('normal');
            }, 430);
          }
        } else if (isGmsFungalSpore || isGmsFungalSporeAttack) {
          if (isHeavy) {
            playFungalSporeAttack('heavy');
          } else if (isNormalAttack) {
            playFungalSporeAttack('normal');
          }
        } else if (isStaphSentinel || isStaphSentinelAttack) {
          if (isHeavy) {
            playStaphSentinelAttack('heavy');
          } else if (isNormalAttack) {
            playStaphSentinelAttack('normal');
          }
        } else if (isMicrobeSwarm || isMicrobeSwarmAttack || isLymphocyteSwarm || isLymphocyteSwarmAttack) {
          if (isHeavy) {
            playMicrobeSwarmAttack('heavy');
          } else if (isNormalAttack) {
            playMicrobeSwarmAttack('normal');
          }
        } else if (isCrystalGolem || isCrystalGolemAttack) {
          if (isHeavy) {
            playCrystalGolemAttack('heavy');
          } else if (isNormalAttack) {
            playCrystalGolemAttack('normal');
          }
        } else if (isBiohazard || isBiohazardAttack) {
          if (isHeavy) {
            playBiohazardAttack('heavy');
          } else if (isNormalAttack) {
            playBiohazardAttack('normal');
          }
        } else if (isReagentStripSlime || isReagentStripSlimeAttack) {
          if (isHeavy) {
            playReagentStripSlimeAttack('heavy');
          } else if (isNormalAttack) {
            playReagentStripSlimeAttack('normal');
          }
        } else if (isHydraAttack || isAntiSerumHydra || attackSpriteUrl?.includes('immunohema_chapterThreeFinalBoss_normalAttackAnimation')) {
          if (isNormalAttack) {
            playHydraAttack('normal');
          }
          // Note: Hydra heavy lightning attack sound is played in x2 speed by HydraLightningAnimator when the lightning animation is playing
        } else if (isLegalBeholderAttack || attackSpriteUrl?.includes('hispatho_chapterThreeFinalBoss') || heavyAttackSpriteUrl?.includes('hispatho_chapterThreeFinalBoss')) {
          // Note: Legal Beholder normal hammer attack sound is played by JudicialHammerAnimator
          // when hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png is played.
          // Legal Beholder heavy underground blast attack sound is played by UndergroundBlastAnimator
          // when hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png is played.
        } else if (heavyAttackSfxUrl || normalAttackSfxUrl) {
          if (isHeavy) {
            if (heavyAttackSfxUrl && !isHydraAttack && !isAntiSerumHydra && !isLegalBeholderAttack && !isImmuneArchonHeavy) {
              playAudioFile(heavyAttackSfxUrl);
            }
          } else if (isNormalAttack) {
            if (normalAttackSfxUrl && !isLegalBeholderAttack && !isImmuneArchonNormal) {
              playAudioFile(normalAttackSfxUrl);
            }
          }
        }
      }

      setAnimKey((prev) => prev + 1);
      const timer = setTimeout(() => {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }, lungeDuration * 1000);
      return () => {
        clearTimeout(timer);
        if (sfxTimer) clearTimeout(sfxTimer);
      };
    } else {
      lastPlayedAnimRef.current = null;
    }
  }, [animState, isAttacking, lungeDuration, isGramPositive, isGramPositiveAttack, isSickleCellMinion, isSickleCellMinionAttack, isAnemiaShade, isAnemiaShadeAttack, isStaphSentinel, isStaphSentinelAttack, isSickleCellReaper, isSickleCellReaperAttack, isMicrobeSwarm, isMicrobeSwarmAttack, isLymphocyteSwarm, isLymphocyteSwarmAttack, isHydraAttack, isAntiSerumHydra, isKetoacidosisColossus, isKetoacidosisColossusAttack, isAntigenTitan, isAntigenTitanAttack, isLegalBeholderAttack, isHyperglycemicMutant, isHyperglycemicMutantAttack, isImmuneArchon, isImmuneArchonAttack, isSpecter, isBiohazard, isBiohazardAttack, isCrystalGolem, isCrystalGolemAttack, isAcidSlime, isAcidSlimeAttack, isGmsFungalSpore, isGmsFungalSporeAttack, isReagentStripSlime, isReagentStripSlimeAttack, isHeavy, isNormalAttack, attackSpriteUrl, heavyAttackSpriteUrl, heavyAttackSfxUrl, normalAttackSfxUrl, bossName]);

  const sheetWidth = currentFrameWidth * currentTotalFrames;
  const sheetHeight = currentFrameHeight * currentTotalFrames;

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center select-none", className)}>
      {/* Hidden Image Preloader to prevent sprite sheet flash/flicker */}
      {/* eslint-disable @next/next/no-img-element */}
      <div className="hidden pointer-events-none aria-hidden">
        {idleSpriteUrl && <img src={idleSpriteUrl} alt="" />}
        {attackSpriteUrl && <img src={attackSpriteUrl} alt="" />}
        {heavyAttackSpriteUrl && <img src={heavyAttackSpriteUrl} alt="" />}
        {slashSpriteUrl && <img src={slashSpriteUrl} alt="" />}
        {attackProjectileUrl && <img src={attackProjectileUrl} alt="" />}
        {undergroundSpikesUrl && <img src={undergroundSpikesUrl} alt="" />}
      </div>
      {/* eslint-enable @next/next/no-img-element */}

      {/* Immersive Shadow & Magical Boss Pedestal */}
      <div className="absolute -bottom-2 w-28 h-6 bg-black/60 rounded-[100%] blur-md scale-y-50 pointer-events-none" />
      {isShielded && (
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse pointer-events-none" />
      )}
      {isEnraged && (
        <div className="absolute inset-0 rounded-full bg-red-600/30 blur-2xl animate-pulse pointer-events-none" />
      )}

      {/* Dynamic Projectile Overlay for Normal Attack (e.g. Plasma Ball flying out of Boss's mouth) */}
      {hasProjectile && (
        <div
          key={`projectile-${animKey}`}
          className="absolute top-2 right-6 overflow-hidden pointer-events-none z-10 animate-boss-projectile-fly"
          style={{
            width: `${128 * scale}px`,
            height: `${128 * scale}px`,
            animationDuration: `${spriteDuration}s`,
            animationTimingFunction: "ease-in",
            animationIterationCount: "1",
            animationFillMode: "forwards",
          }}
        >
          <div
            className={cn("absolute left-0", isImmuneArchon ? "bottom-0" : "top-0")}
            style={{
              width: `${128 * (attackProjectileFrames || 5) * scale}px`,
              height: `${128 * scale}px`,
              backgroundImage: `url('${attackProjectileUrl || '/images/bosses/clinchem_finalboss_normalAttackprojectileAnimation.png'}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${128 * (attackProjectileFrames || 5) * scale}px ${128 * scale}px`,
              imageRendering: "pixelated",
              animation: `bossSpriteAnim ${(attackProjectileFrames || 5) / 16}s steps(${attackProjectileFrames || 5}) infinite`,
            }}
          />
        </div>
      )}

      {/* Main Animated Sprite Container - Uses Container Relative Units to Prevent Sidebar Overlap */}
      {isAnemiaShadeHeavy ? (
        <div
          key={`container-anemia-heavy-${animKey}`}
          className="relative transition-all transform-gpu z-10"
          style={{
            width: `${128 * effectiveScale}px`,
            height: `${128 * effectiveScale}px`,
          }}
        >
          {/* Phase 1: Dash Animation (0s to 0.62s) */}
          {anemiaHeavyPhase === 'dash' && (
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={{
                width: `${128 * effectiveScale}px`,
                height: `${128 * effectiveScale}px`,
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  width: `${128 * 15 * effectiveScale}px`,
                  height: `${128 * effectiveScale}px`,
                  backgroundImage: `url('${heavyAttackSpriteUrl || '/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_DashAnimation.png'}')`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${128 * 15 * effectiveScale}px ${128 * effectiveScale}px`,
                  imageRendering: "pixelated",
                  animation: "anemiaDashSpriteAnim 0.62s steps(14) 1 forwards",
                }}
              />
            </div>
          )}

          {/* Phase 2: Disappeared (0.62s to 1.38s while Slash Animation plays on the Player character) */}

          {/* Phase 3: Smooth Idle Animation (1.38s onwards, right after Slash Animation completes) */}
          {anemiaHeavyPhase === 'idle' && (
            <div
              className="absolute top-0 left-0 overflow-hidden transition-opacity duration-300 opacity-100"
              style={{
                width: `${128 * effectiveScale}px`,
                height: `${128 * effectiveScale}px`,
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  width: `${128 * 7 * effectiveScale}px`,
                  height: `${128 * effectiveScale}px`,
                  backgroundImage: `url('${idleSpriteUrl || '/images/bosses/hematology_chapterOneMiniBoss_idleAnimation.png'}')`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${128 * 7 * effectiveScale}px ${128 * effectiveScale}px`,
                  imageRendering: "pixelated",
                  animation: "bossSpriteAnim 1.0s steps(7) infinite",
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          key={`container-${animState}-${animKey}`}
          className={cn(
            "relative overflow-hidden transition-all transform-gpu z-10",
            isWideBeam && "animate-boss-beam-recoil",
            isGramPositiveHeavy && "animate-boss-gram-positive-heavy-lunge",
            isGramPositiveNormal && "animate-boss-gram-positive-lunge",
            isStaphSentinelHeavy && "animate-boss-staph-sentinel-heavy-lunge",
            isBiohazardHeavy && "animate-boss-biohazard-heavy-lunge",
            isBiohazardNormal && "animate-boss-biohazard-lunge",
            isAcidSlimeHeavy && "animate-boss-acid-slime-heavy-lunge",
            isAcidSlimeNormal && "animate-boss-acid-slime-lunge",
            isSickleCellMinionHeavy && "animate-boss-sickle-cell-minion-heavy-lunge",
            isSickleCellMinionNormal && "animate-boss-sickle-cell-minion-lunge",
            isAnemiaShadeNormal && "animate-boss-anemia-normal-lunge",
            isGmsFungalSporeHeavy && "animate-boss-fungal-spore-heavy-lunge",
            isGmsFungalSporeNormal && "animate-boss-fungal-spore-lunge",
            isReagentStripSlimeHeavy && "animate-boss-reagent-slime-heavy-lunge",
            isReagentStripSlimeNormal && "animate-boss-reagent-slime-lunge",
            isLymphocyteSwarmHeavy && "animate-boss-lymphocyte-heavy-lunge",
            isLymphocyteSwarmNormal && "animate-boss-lymphocyte-lunge",
            isHydraNormal && "animate-boss-hydra-normal",
            isReaperGlintNormal && "animate-boss-reaper-glint-normal",
            isHyperglycemicMutantHeavy && "animate-boss-hyperglycemic-mutant-heavy-lunge",
            isHyperglycemicMutantNormal && "animate-boss-hyperglycemic-mutant-lunge",
            isKetoacidosisColossusHeavy && "animate-boss-ketoacidosis-colossus-heavy-lunge",
            isKetoacidosisColossusNormal && "animate-boss-ketoacidosis-colossus-lunge",
            isAntigenTitanHeavy && "animate-boss-antigen-titan-heavy-lunge",
            isAntigenTitanNormal && "animate-boss-antigen-titan-lunge",
            isImmuneArchonHeavy && "animate-boss-immune-archon-heavy-lunge",
            isImmuneArchonNormal && "animate-boss-immune-archon-lunge",
            isHeavy && !isWideBeam && !isGramPositiveAttack && !isStaphSentinelAttack && !isBiohazardAttack && !isAcidSlimeAttack && !isSickleCellMinionAttack && !isGmsFungalSporeAttack && !isLegalBeholderHeavy && !isHydraHeavy && !isReagentStripSlimeAttack && !isLymphocyteSwarmAttack && !isHyperglycemicMutantHeavy && !isKetoacidosisColossusHeavy && !isAntigenTitanHeavy && !isImmuneArchonHeavy && !isAnemiaShadeAttack && "animate-boss-heavy-lunge",
            isAttacking && !isHeavy && !isWideBeam && !hasProjectile && !hasUndergroundSpikes && !isReaperGlintNormal && !isSickleCellReaperNormal && !isGramPositiveAttack && !isBiohazardAttack && !isAcidSlimeAttack && !isSickleCellMinionAttack && !isGmsFungalSporeAttack && !isLegalBeholderNormal && !isHydraNormal && !isReagentStripSlimeAttack && !isLymphocyteSwarmAttack && !isHyperglycemicMutantNormal && !isKetoacidosisColossusNormal && !isAntigenTitanNormal && !isImmuneArchonNormal && !isAnemiaShadeAttack && "animate-boss-lunge",
            isHit && "brightness-200 contrast-200 hue-rotate-90 animate-shake"
          )}
          style={{
            width: `${currentFrameWidth * effectiveScale}px`,
            height: `${(isImmuneArchon ? (isImmuneArchonHeavy ? 228 : isImmuneArchonNormal ? 177 : 220) : currentFrameHeight) * effectiveScale}px`,
            ...(isAttacking
              ? {
                animationDuration: `${lungeDuration}s`,
                animationTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
                animationIterationCount: "1",
                animationFillMode: "forwards",
              }
              : {}),
          }}
        >
          {/* Spritesheet Render Engine */}
          <div
            key={`sprite-${animState}-${animKey}`}
            className="absolute top-0 left-0"
            style={{
              width: isHydraVerticalSprite ? `${currentFrameWidth * effectiveScale}px` : `${sheetWidth * effectiveScale}px`,
              height: isHydraVerticalSprite ? `${sheetHeight * effectiveScale}px` : `${currentFrameHeight * effectiveScale}px`,
              backgroundImage: `url('${currentSpriteUrl}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: isHydraVerticalSprite
                ? `${currentFrameWidth * effectiveScale}px ${sheetHeight * effectiveScale}px`
                : `${sheetWidth * effectiveScale}px ${currentFrameHeight * effectiveScale}px`,
              imageRendering: "pixelated",
              animationName: isHydraVerticalSprite
                ? "bossVerticalSpriteAnim"
                : isHydraNormal
                  ? "bossHydraNormalSpriteAnim"
                  : isHydraHeavy
                    ? "bossHydraHeavyGlintSpriteAnim"
                    : isReaperGlintSprite
                      ? "bossReaperGlintSpriteAnim"
                      : isHyperglycemicMutantNormal
                        ? "bossHyperglycemicMutantNormalSpriteAnim"
                        : isHyperglycemicMutantHeavy
                          ? "bossHyperglycemicMutantHeavySpriteAnim"
                          : isKetoacidosisColossusHeavy
                            ? "bossKetoacidosisColossusHeavySpriteAnim"
                            : isKetoacidosisColossusNormal
                              ? "bossKetoacidosisColossusNormalSpriteAnim"
                              : isAntigenTitanHeavy
                                ? "bossAntigenTitanHeavySpriteAnim"
                                : isAntigenTitanNormal
                                  ? "bossAntigenTitanNormalSpriteAnim"
                                  : isImmuneArchonHeavy
                                    ? "bossImmuneArchonHeavySpriteAnim"
                                    : isImmuneArchonNormal
                                      ? "bossImmuneArchonNormalSpriteAnim"
                                      : isAnemiaShadeNormal
                                        ? "bossAnemiaNormalSpriteAnim"
                                        : "bossSpriteAnim",
              animationDuration: isHydraVerticalSprite ? `${idleDuration || 1.8}s` : (isImmuneArchonHeavy ? '1.55s' : isImmuneArchonNormal ? '0.80s' : isHyperglycemicMutantNormal ? '0.80s' : isHyperglycemicMutantHeavy ? '0.95s' : isAnemiaShadeNormal ? '1.25s' : `${spriteDuration}s`),
              animationTimingFunction: isHydraNormal
                ? `steps(${currentTotalFrames - 1})`
                : isHydraHeavy
                  ? `steps(${currentTotalFrames - 1})`
                  : (isKetoacidosisColossusHeavy || isKetoacidosisColossusNormal || isAntigenTitanHeavy || isAntigenTitanNormal || isImmuneArchonNormal)
                    ? `steps(${currentTotalFrames - 1})`
                    : isReaperGlintSprite
                      ? `steps(5)`
                      : (isHyperglycemicMutantNormal || isHyperglycemicMutantHeavy || isAnemiaShadeNormal || isImmuneArchonHeavy)
                        ? "step-end"
                        : `steps(${currentTotalFrames})`,
              animationIterationCount: (isGramPositiveHeavy || isStaphSentinelHeavy) ? 2 : (isAttacking ? 1 : "infinite"),
              animationFillMode: (isHydraNormal || isHydraHeavy || isReaperGlintSprite || isHyperglycemicMutantNormal || isHyperglycemicMutantHeavy || isKetoacidosisColossusHeavy || isKetoacidosisColossusNormal || isAntigenTitanHeavy || isAntigenTitanNormal || isAnemiaShadeNormal || isImmuneArchonHeavy || isImmuneArchonNormal) ? "forwards" : "none",
            }}
          />
        </div>
      )}

      {/* Scoped CSS Keyframes for Frame Animation & Responsive Container-relative Lunge */}
      <style jsx global>{`
        @keyframes bossSpriteAnim {
          from {
            transform: translateX(0px);
          }
          to {
            transform: translateX(-100%);
          }
        }

        @keyframes bossHydraNormalSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 31));
          }
        }

        @keyframes bossHydraHeavyGlintSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 14));
          }
        }

        @keyframes bossReaperGlintSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 6));
          }
        }

        @keyframes bossKetoacidosisColossusNormalSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 7));
          }
        }

        @keyframes bossKetoacidosisColossusHeavySpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 8));
          }
        }

        @keyframes bossAntigenTitanNormalSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 8));
          }
        }

        @keyframes bossAntigenTitanHeavySpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 9));
          }
        }

        @keyframes bossImmuneArchonNormalSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / 11));
          }
        }

        @keyframes bossImmuneArchonHeavySpriteAnim {
          0% {
            transform: translateX(0px);
          }
          5.5% {
            transform: translateX(calc(-1 * 100% / 18));
          }
          11.0% {
            transform: translateX(calc(-2 * 100% / 18));
          }
          16.5% {
            transform: translateX(calc(-3 * 100% / 18));
          }
          22.0% {
            transform: translateX(calc(-4 * 100% / 18));
          }
          27.5% {
            transform: translateX(calc(-5 * 100% / 18));
          }
          33.0% {
            transform: translateX(calc(-6 * 100% / 18));
          }
          38.5% {
            transform: translateX(calc(-7 * 100% / 18));
          }
          44.0% {
            transform: translateX(calc(-8 * 100% / 18));
          }
          49.5% {
            transform: translateX(calc(-9 * 100% / 18));
          }
          55.0% {
            transform: translateX(calc(-10 * 100% / 18));
          }
          60.5% {
            transform: translateX(calc(-11 * 100% / 18));
          }
          66.0% {
            transform: translateX(calc(-12 * 100% / 18));
          }
          71.5% {
            transform: translateX(calc(-13 * 100% / 18));
          }
          77.0% {
            transform: translateX(calc(-14 * 100% / 18));
          }
          82.5% {
            transform: translateX(calc(-15 * 100% / 18));
          }
          88.0% {
            transform: translateX(calc(-16 * 100% / 18));
          }
          93.5% {
            transform: translateX(calc(-17 * 100% / 18));
          }
          100% {
            transform: translateX(calc(-17 * 100% / 18));
          }
        }

        @keyframes bossHyperglycemicMutantNormalSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          10% {
            transform: translateX(calc(-1 * 100% / 8));
          }
          20% {
            transform: translateX(calc(-2 * 100% / 8));
          }
          30% {
            transform: translateX(calc(-3 * 100% / 8));
          }
          40% {
            transform: translateX(calc(-4 * 100% / 8));
          }
          50% {
            transform: translateX(calc(-5 * 100% / 8));
          }
          60% {
            transform: translateX(calc(-6 * 100% / 8));
          }
          70% {
            transform: translateX(calc(-7 * 100% / 8));
          }
          78% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(0px);
          }
        }

        @keyframes bossHyperglycemicMutantHeavySpriteAnim {
          0% {
            transform: translateX(0px);
          }
          10% {
            transform: translateX(calc(-1 * 100% / 8));
          }
          20% {
            transform: translateX(calc(-2 * 100% / 8));
          }
          30% {
            transform: translateX(calc(-3 * 100% / 8));
          }
          40% {
            transform: translateX(calc(-4 * 100% / 8));
          }
          50% {
            transform: translateX(calc(-5 * 100% / 8));
          }
          60% {
            transform: translateX(calc(-6 * 100% / 8));
          }
          70% {
            transform: translateX(calc(-7 * 100% / 8));
          }
          78% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(0px);
          }
        }

        @keyframes bossAnemiaNormalSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          4% {
            transform: translateX(calc(-1 * 100% / 18));
          }
          8% {
            transform: translateX(calc(-2 * 100% / 18));
          }
          12% {
            transform: translateX(calc(-3 * 100% / 18));
          }
          16% {
            transform: translateX(calc(-4 * 100% / 18));
          }
          20% {
            transform: translateX(calc(-5 * 100% / 18));
          }
          24% {
            transform: translateX(calc(-6 * 100% / 18));
          }
          28% {
            transform: translateX(calc(-7 * 100% / 18));
          }
          /* 9th frame (index 8) rendered starting at 32% (400ms) */
          32% {
            transform: translateX(calc(-8 * 100% / 18));
          }
          36% {
            transform: translateX(calc(-9 * 100% / 18));
          }
          40% {
            transform: translateX(calc(-10 * 100% / 18));
          }
          44% {
            transform: translateX(calc(-11 * 100% / 18));
          }
          48% {
            transform: translateX(calc(-12 * 100% / 18));
          }
          52% {
            transform: translateX(calc(-13 * 100% / 18));
          }
          /* Slashes onto player character starting at 56% (700ms) */
          56% {
            transform: translateX(calc(-14 * 100% / 18));
          }
          61% {
            transform: translateX(calc(-15 * 100% / 18));
          }
          66% {
            transform: translateX(calc(-16 * 100% / 18));
          }
          71% {
            transform: translateX(calc(-17 * 100% / 18));
          }
          76% {
            transform: translateX(calc(-17 * 100% / 18));
          }
          80% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(0px);
          }
        }


        @keyframes bossVerticalSpriteAnim {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-100%);
          }
        }

        /* Container-Query Responsive Lunge (Adapts perfectly to Sidebar open/close and Fullscreen modes) */
        @keyframes bossLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash close in front of the player (to the right of the player sprite, facing left) */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 15px) scale(1.35);
          }
          78% {
            /* Execute strike while staying in front of the player and pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 15px) scale(1.35);
          }
          100% {
            /* Return smoothly to home position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash close in front of the player (to the right of the player sprite, facing left) */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 18px) scale(1.35);
          }
          78% {
            /* Execute heavy attack / mouth blast while staying close to the player, then pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 18px) scale(1.35);
          }
          100% {
            /* Slide smoothly back to home position on the right after pause */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossGramPositiveLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash right in front of the player (standing to the right side of the player sprite, facing left) */
            transform: translate(min(-60px, calc(-100cqw + 365px)), 15px) scale(1.15);
          }
          78% {
            /* Execute claw strikes directly into the front of the player, then pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 365px)), 15px) scale(1.15);
          }
          100% {
            /* Return smoothly to home position on the right */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossGramPositiveHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          8% {
            /* Dash right in front of the player (standing to the right side of the player sprite, facing left) */
            transform: translate(min(-60px, calc(-100cqw + 365px)), 15px) scale(1.15);
          }
          80% {
            /* Execute 2 full cycles of claw strikes directly into the front of the player, then pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 365px)), 15px) scale(1.15);
          }
          100% {
            /* Return smoothly to home position on the right */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossStaphSentinelHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          10% {
            /* Dash close in front of the player */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 18px) scale(1.35);
          }
          80% {
            /* Execute 2 full cycles of arm strikes directly into the player, then pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 18px) scale(1.35);
          }
          100% {
            /* Slide smoothly back to home position on the right */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossBiohazardLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash directly in front of the player */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 15px) scale(1.35);
          }
          78% {
            /* Execute strike while staying close to the player and pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 260px)), 15px) scale(1.35);
          }
          100% {
            /* Return smoothly to home position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossBiohazardHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          10% {
            /* Dash into forward casting stance in arena */
            transform: translate(min(-40px, calc(-100cqw + 390px)), 12px) scale(1.25);
          }
          80% {
            /* Full toxic surge engulfs the player, then pause cleanly */
            transform: translate(min(-40px, calc(-100cqw + 390px)), 12px) scale(1.25);
          }
          100% {
            /* Return smoothly to home position on the right */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossAcidSlimeLunge {
          0% {
            transform: translate(-91px, 19px) scale(1);
          }
          12% {
            /* Dash cleanly in front of the player on the right side */
            transform: translate(min(-30px, calc(-100cqw + 390px)), 18px) scale(1.15);
          }
          75% {
            /* Strike acid directly in front of the player, pause cleanly */
            transform: translate(min(-30px, calc(-100cqw + 390px)), 18px) scale(1.15);
          }
          100% {
            /* Slide smoothly back to home position matching idle coordinates */
            transform: translate(-91px, 19px) scale(1);
          }
        }

        @keyframes bossAcidSlimeHeavyLunge {
          0% {
            transform: translate(-91px, 19px) scale(1);
          }
          10% {
            /* Dash cleanly in front of the player on the right side */
            transform: translate(min(-30px, calc(-100cqw + 375px)), 18px) scale(1.2);
          }
          78% {
            /* Execute 2-cycle acid surge directly in front of player, pause cleanly */
            transform: translate(min(-30px, calc(-100cqw + 375px)), 18px) scale(1.2);
          }
          100% {
            /* Slide smoothly back to home position */
            transform: translate(-91px, 19px) scale(1);
          }
        }

        @keyframes bossHyperglycemicMutantLunge {
          0% {
            transform: translate(70px, 17px) scale(1);
            animation-timing-function: ease-out;
          }
          16% {
            /* Dash into slashing position right in front of the player */
            transform: translate(min(-30px, calc(-100cqw + 460px)), 42px) scale(1.15);
          }
          76% {
            /* Execute 8-frame claw slash directly onto the player, pause cleanly */
            transform: translate(min(-30px, calc(-100cqw + 460px)), 42px) scale(1.15);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            /* Slide smoothly back to home position matching idle position */
            transform: translate(70px, 17px) scale(1);
          }
        }

        @keyframes bossHyperglycemicMutantHeavyLunge {
          0% {
            transform: translate(7px, -41px) scale(1);
            animation-timing-function: ease-out;
          }
          16% {
            /* Leap high and soar forward into heavy slam position in front of player */
            transform: translate(min(-35px, calc(-100cqw + 410px)), -10px) scale(1.22);
          }
          76% {
            /* Execute soaring dive and ground shockwave smash right onto player, pause cleanly */
            transform: translate(min(-35px, calc(-100cqw + 410px)), -10px) scale(1.22);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            /* Slide smoothly back to home position matching idle position */
            transform: translate(7px, -41px) scale(1);
          }
        }

        @keyframes bossSickleCellMinionLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          14% {
            transform: translate(min(-35px, calc(-100cqw + 380px)), 12px) scale(1.1);
          }
          76% {
            transform: translate(min(-35px, calc(-100cqw + 380px)), 12px) scale(1.1);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossSickleCellMinionHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            transform: translate(min(-40px, calc(-100cqw + 360px)), 14px) scale(1.15);
          }
          78% {
            transform: translate(min(-40px, calc(-100cqw + 360px)), 14px) scale(1.15);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        /* Anemia Shade Base Keyframes */
        @keyframes bossAnemiaNormalLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          32% {
            /* Holds exact idle position while frames 1 to 8 play, then lunges forward when the 9th frame renders at 32% (400ms) */
            transform: translate(0px, 0px) scale(1);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          56% {
            /* Reaches directly in front of the player right as frame 15 blade swing starts */
            transform: translate(min(-35px, calc(-100cqw + 380px)), 10px) scale(1.15);
            animation-timing-function: linear;
          }
          76% {
            /* Slashes directly into player character, holds strike stance cleanly */
            transform: translate(min(-35px, calc(-100cqw + 380px)), 10px) scale(1.15);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            /* Slides smoothly back across arena to resting idle position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes anemiaDashSpriteAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-14 * 100% / 15));
          }
        }


        @keyframes bossFungalSporeLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          14% {
            /* Dash close in front of the player */
            transform: translate(min(-65px, calc(-100cqw + 290px)), 12px) scale(1.18);
          }
          76% {
            /* Vine connects directly into the player */
            transform: translate(min(-65px, calc(-100cqw + 290px)), 12px) scale(1.18);
          }
          100% {
            /* Return smoothly to home position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossFungalSporeHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash close in front of the player */
            transform: translate(min(-70px, calc(-100cqw + 275px)), 14px) scale(1.22);
          }
          78% {
            /* Spore storm engulfs player directly from the front */
            transform: translate(min(-70px, calc(-100cqw + 275px)), 14px) scale(1.22);
          }
          100% {
            /* Return smoothly to home position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossReagentSlimeLunge {
          0% {
            transform: translate(16px, -42px) scale(1);
          }
          14% {
            transform: translate(min(-65px, calc(-100cqw + 320px)), -55px) scale(1.08);
          }
          76% {
            transform: translate(min(-65px, calc(-100cqw + 320px)), -55px) scale(1.08);
          }
          100% {
            transform: translate(16px, -42px) scale(1);
          }
        }

        @keyframes bossReagentSlimeHeavyLunge {
          0% {
            transform: translate(16px, -42px) scale(1);
          }
          12% {
            transform: translate(min(-75px, calc(-100cqw + 310px)), -60px) scale(1.12);
          }
          80% {
            transform: translate(min(-75px, calc(-100cqw + 310px)), -60px) scale(1.12);
          }
          100% {
            transform: translate(16px, -42px) scale(1);
          }
        }

        @keyframes bossKetoacidosisColossusLunge {
          0% {
            transform: translate(38px, -43px) scale(1);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          15% {
            transform: translate(calc(-100cqw + 615px), -35px) scale(1.04);
          }
          75% {
            transform: translate(calc(-100cqw + 615px), -35px) scale(1.04);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            transform: translate(38px, -43px) scale(1);
          }
        }

        @keyframes bossKetoacidosisColossusHeavyLunge {
          0% {
            transform: translate(163px, 43px) scale(1);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          15% {
            transform: translate(calc(-100cqw + 675px), 46px) scale(1.04);
          }
          75% {
            transform: translate(calc(-100cqw + 675px), 46px) scale(1.04);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            transform: translate(163px, 43px) scale(1);
          }
        }

        @keyframes bossAntigenTitanLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          18% {
            transform: translate(min(-60px, calc(-100cqw + 260px)), 15px) scale(1.12);
          }
          74% {
            transform: translate(min(-60px, calc(-100cqw + 260px)), 15px) scale(1.12);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossAntigenTitanHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          18% {
            transform: translate(min(-60px, calc(-100cqw + 245px)), 20px) scale(1.16);
          }
          74% {
            transform: translate(min(-60px, calc(-100cqw + 245px)), 20px) scale(1.16);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossImmuneArchonLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          22% {
            transform: translate(min(-60px, calc(-100cqw + 460px)), 8px) scale(1.06);
          }
          72% {
            transform: translate(min(-60px, calc(-100cqw + 460px)), 8px) scale(1.06);
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossImmuneArchonHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossLymphocyteLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          14% {
            /* Dash close in front of the player */
            transform: translate(min(-60px, calc(-100cqw + 280px)), 10px) scale(1.18);
          }
          76% {
            /* Deliver smooth 14-frame normal strike at player */
            transform: translate(min(-60px, calc(-100cqw + 280px)), 10px) scale(1.18);
          }
          100% {
            /* Return smoothly to home resting position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossLymphocyteHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash close in front of player */
            transform: translate(min(-70px, calc(-100cqw + 265px)), 14px) scale(1.24);
          }
          78% {
            /* Unleash massive heavy energy burst directly into player */
            transform: translate(min(-70px, calc(-100cqw + 265px)), 14px) scale(1.24);
          }
          100% {
            /* Return smoothly to home resting position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossHydraNormalAttack {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          15% {
            /* Glides across water close directly in front of the player */
            transform: translate(calc(-100cqw + 360px), 0px) scale(1.1);
          }
          68% {
            /* Holds position while 31-frame normal attack renders completely */
            transform: translate(calc(-100cqw + 360px), 0px) scale(1.1);
          }
          76% {
            /* Pauses cleanly in front of player as attack blast finishes */
            transform: translate(calc(-100cqw + 360px), 0px) scale(1.1);
          }
          100% {
            /* Returns smoothly across water to starting position with no trail */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @media (min-width: 768px) {
          @keyframes bossLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands close directly in front of the player on the left */
              transform: translate(calc(-100cqw + 370px), 20px) scale(1.45);
            }
            78% {
              /* Execute strike while staying close to the player and pause cleanly */
              transform: translate(calc(-100cqw + 370px), 20px) scale(1.45);
            }
            100% {
              /* Slides back smoothly to home position */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands close in front of the player so the blast connects directly with the player */
              transform: translate(calc(-100cqw + 370px), 25px) scale(1.45);
            }
            78% {
              /* Execute mouth blast / heavy strike directly into the player, then pause cleanly */
              transform: translate(calc(-100cqw + 370px), 25px) scale(1.45);
            }
            100% {
              /* Slides back smoothly to home position on the right after pause */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossBeamRecoil {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            14% {
              /* Dash in front of the player (standing to the right side of the player sprite, beam centered squarely on player chest) */
              transform: translate(calc(-100cqw + 725px), 20px) scale(1.15);
            }
            78% {
              /* Fire beam directly into the middle of the player from the front, clear beam and pause cleanly */
              transform: translate(calc(-100cqw + 725px), 20px) scale(1.15);
            }
            100% {
              /* Slide smoothly back to home position */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossGramPositiveLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands directly in front of the player on the left connecting cleanly with the sword/chest */
              transform: translate(calc(-100cqw + 480px), 20px) scale(1.2);
            }
            78% {
              /* Execute claw strikes directly into the front of the player, then pause cleanly */
              transform: translate(calc(-100cqw + 480px), 20px) scale(1.2);
            }
            100% {
              /* Slides back smoothly to home position on the right */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossGramPositiveHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            8% {
              /* Lands directly in front of the player on the left connecting cleanly with the sword/chest */
              transform: translate(calc(-100cqw + 480px), 20px) scale(1.2);
            }
            80% {
              /* Execute 2 full cycles of claw strikes directly into the front of the player, then pause cleanly */
              transform: translate(calc(-100cqw + 480px), 20px) scale(1.2);
            }
            100% {
              /* Slides back smoothly to home position on the right */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossStaphSentinelHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            10% {
              /* Lands close in front of the player */
              transform: translate(calc(-100cqw + 370px), 25px) scale(1.45);
            }
            80% {
              /* Execute 2 full cycles of arm strikes directly into the player, then pause cleanly */
              transform: translate(calc(-100cqw + 370px), 25px) scale(1.45);
            }
            100% {
              /* Slides back smoothly to home position on the right */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossBiohazardLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands close directly in front of the player on the left */
              transform: translate(calc(-100cqw + 370px), 20px) scale(1.45);
            }
            78% {
              /* Execute strike while staying close to the player and pause cleanly */
              transform: translate(calc(-100cqw + 370px), 20px) scale(1.45);
            }
            100% {
              /* Slides back smoothly to home position */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossBiohazardHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            10% {
              /* Plant feet in arena and fire the toxic biohazard storm directly into player */
              transform: translate(calc(-100cqw + 510px), 15px) scale(1.25);
            }
            80% {
              /* Full toxic surge engulfs the player, then pause cleanly */
              transform: translate(calc(-100cqw + 510px), 15px) scale(1.25);
            }
            100% {
              /* Glide smoothly back to home position on the right */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossAcidSlimeLunge {
            0% {
              transform: translate(-91px, 19px) scale(1);
            }
            12% {
              /* Lands cleanly in front of the player on the right side */
              transform: translate(calc(-100cqw + 580px), 20px) scale(1.18);
            }
            75% {
              /* Strike acid directly in front of the player and pause cleanly */
              transform: translate(calc(-100cqw + 580px), 20px) scale(1.18);
            }
            100% {
              /* Slides back smoothly to home position */
              transform: translate(-91px, 19px) scale(1);
            }
          }

          @keyframes bossAcidSlimeHeavyLunge {
            0% {
              transform: translate(-91px, 19px) scale(1);
            }
            10% {
              /* Lands cleanly in front of the player on the right side */
              transform: translate(calc(-100cqw + 560px), 20px) scale(1.22);
            }
            78% {
              /* Execute 2-cycle acid surge directly in front of player, pause cleanly */
              transform: translate(calc(-100cqw + 560px), 20px) scale(1.22);
            }
            100% {
              /* Slides back smoothly to home position */
              transform: translate(-91px, 19px) scale(1);
            }
          }

          @keyframes bossHyperglycemicMutantLunge {
            0% {
              transform: translate(70px, 17px) scale(1);
              animation-timing-function: ease-out;
            }
            16% {
              /* Lands cleanly right in front of player attacking their front */
              transform: translate(calc(-100cqw + 585px), 42px) scale(1.15);
            }
            76% {
              /* Execute full 8-frame claw slash directly onto the player, pause cleanly */
              transform: translate(calc(-100cqw + 585px), 42px) scale(1.15);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              /* Slides back smoothly to home position matching idle position */
              transform: translate(70px, 17px) scale(1);
            }
          }

          @keyframes bossHyperglycemicMutantHeavyLunge {
            0% {
              transform: translate(7px, -41px) scale(1);
              animation-timing-function: ease-out;
            }
            16% {
              /* Leap high and soar forward into heavy slam position in front of player */
              transform: translate(calc(-100cqw + 530px), -10px) scale(1.22);
            }
            76% {
              /* Execute soaring dive and ground shockwave smash right onto player, pause cleanly */
              transform: translate(calc(-100cqw + 530px), -10px) scale(1.22);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              /* Slides back smoothly to home position matching idle position */
              transform: translate(7px, -41px) scale(1);
            }
          }

          @keyframes bossSickleCellMinionLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            14% {
              transform: translate(calc(-100cqw + 540px), 15px) scale(1.15);
            }
            76% {
              transform: translate(calc(-100cqw + 540px), 15px) scale(1.15);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossSickleCellMinionHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              transform: translate(calc(-100cqw + 510px), 18px) scale(1.2);
            }
            78% {
              transform: translate(calc(-100cqw + 510px), 18px) scale(1.2);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          /* Anemia Shade Container Query Keyframes */
          @keyframes bossAnemiaNormalLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            32% {
              /* Holds exact idle position while frames 1 to 8 play, then lunges forward when the 9th frame renders at 32% (400ms) */
              transform: translate(0px, 0px) scale(1);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            56% {
              /* Reaches directly in front of the player right as frame 15 blade swing starts */
              transform: translate(calc(-100cqw + 410px), 12px) scale(1.18);
              animation-timing-function: linear;
            }
            76% {
              /* Slashes directly into player character, holds strike stance cleanly */
              transform: translate(calc(-100cqw + 410px), 12px) scale(1.18);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              /* Slides smoothly back across arena to resting idle position */
              transform: translate(0px, 0px) scale(1);
            }
          }




          @keyframes bossFungalSporeLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            14% {
              /* Lands close in front of the player, vine strikes directly into the player character */
              transform: translate(calc(-100cqw + 390px), 14px) scale(1.2);
            }
            76% {
              /* Vine strike connects directly into the front of the player, pause cleanly */
              transform: translate(calc(-100cqw + 390px), 14px) scale(1.2);
            }
            100% {
              /* Return smoothly to home position on the right */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossFungalSporeHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands close directly in front of the player */
              transform: translate(calc(-100cqw + 375px), 18px) scale(1.25);
            }
            78% {
              /* Blast spore storm directly into the player's chest/face, pause cleanly */
              transform: translate(calc(-100cqw + 375px), 18px) scale(1.25);
            }
            100% {
              /* Slide smoothly back to home position on the right */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossProjectileFly {
            0% {
              transform: translate(0px, 0px) scale(0.8);
              opacity: 0;
            }
            10% {
              transform: translate(-50px, 12px) scale(1);
              opacity: 1;
            }
            85% {
              /* Impacts directly onto the front of the player's chest / sword */
              transform: translate(calc(-100cqw + 390px), 54px) scale(1.35);
              opacity: 1;
            }
            100% {
              /* Detonates on the front surface without passing behind */
              transform: translate(calc(-100cqw + 375px), 56px) scale(1.45);
              opacity: 0;
            }
          }

          @keyframes bossReagentSlimeLunge {
            0% {
              transform: translate(22px, -50px) scale(1);
            }
            14% {
              transform: translate(calc(-100cqw + 470px), -65px) scale(1.08);
            }
            76% {
              transform: translate(calc(-100cqw + 470px), -65px) scale(1.08);
            }
            100% {
              transform: translate(22px, -50px) scale(1);
            }
          }

          @keyframes bossReagentSlimeHeavyLunge {
            0% {
              transform: translate(22px, -50px) scale(1);
            }
            12% {
              transform: translate(calc(-100cqw + 450px), -70px) scale(1.12);
            }
            80% {
              transform: translate(calc(-100cqw + 450px), -70px) scale(1.12);
            }
            100% {
              transform: translate(22px, -50px) scale(1);
            }
          }

          @keyframes bossKetoacidosisColossusLunge {
            0% {
              transform: translate(38px, -43px) scale(1);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            15% {
              transform: translate(calc(-100cqw + 710px), -35px) scale(1.04);
            }
            75% {
              transform: translate(calc(-100cqw + 710px), -35px) scale(1.04);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              transform: translate(38px, -43px) scale(1);
            }
          }

          @keyframes bossKetoacidosisColossusHeavyLunge {
            0% {
              transform: translate(163px, 43px) scale(1);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            15% {
              transform: translate(calc(-100cqw + 765px), 52px) scale(1.04);
            }
            75% {
              transform: translate(calc(-100cqw + 765px), 52px) scale(1.04);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              transform: translate(163px, 43px) scale(1);
            }
          }

          @keyframes bossAntigenTitanLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            18% {
              transform: translate(calc(-100cqw + 330px), 15px) scale(1.14);
            }
            74% {
              transform: translate(calc(-100cqw + 330px), 15px) scale(1.14);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossAntigenTitanHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            18% {
              transform: translate(calc(-100cqw + 320px), 20px) scale(1.18);
            }
            74% {
              transform: translate(calc(-100cqw + 320px), 20px) scale(1.18);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossImmuneArchonLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            22% {
              transform: translate(calc(-100cqw + 580px), 8px) scale(1.08);
            }
            72% {
              transform: translate(calc(-100cqw + 580px), 8px) scale(1.08);
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossImmuneArchonHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossLymphocyteLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            14% {
              transform: translate(calc(-100cqw + 390px), 16px) scale(1.24);
            }
            76% {
              transform: translate(calc(-100cqw + 390px), 16px) scale(1.24);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossLymphocyteHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              transform: translate(calc(-100cqw + 375px), 18px) scale(1.30);
            }
            78% {
              transform: translate(calc(-100cqw + 375px), 18px) scale(1.30);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes playerLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands just to the left side of the boss sprite on desktop */
              transform: ${isKetoacidosisColossus
          ? 'translate(calc(100cqw - 640px), 10px) scale(1.2)'
          : isAntigenTitan
            ? 'translate(calc(100cqw - 570px), 5px) scale(1.2)'
            : isHyperglycemicMutant
              ? 'translate(calc(100cqw - 560px), -10px) scale(1.2)'
              : isImmuneArchon ? 'translate(calc(100cqw - 500px), -10px) scale(1.2)' : 'translate(calc(100cqw - 410px), -30px) scale(1.2)'
        };
            }
            78% {
              /* Slashes boss, then pauses cleanly in front of boss */
              transform: ${isKetoacidosisColossus
          ? 'translate(calc(100cqw - 640px), 10px) scale(1.2)'
          : isAntigenTitan
            ? 'translate(calc(100cqw - 570px), 5px) scale(1.2)'
            : isHyperglycemicMutant
              ? 'translate(calc(100cqw - 560px), -10px) scale(1.2)'
              : isImmuneArchon ? 'translate(calc(100cqw - 500px), -10px) scale(1.2)' : 'translate(calc(100cqw - 410px), -30px) scale(1.2)'
        };
            }
            100% {
              /* Glides back smoothly to home spot */
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossHydraNormalAttack {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            15% {
              /* Glides across water close directly in front of the player */
              transform: translate(calc(-100cqw + 500px), 0px) scale(1.12);
            }
            68% {
              /* Holds position while 31-frame normal attack renders completely */
              transform: translate(calc(-100cqw + 500px), 0px) scale(1.12);
            }
            76% {
              /* Pauses cleanly in front of player as attack blast finishes */
              transform: translate(calc(-100cqw + 500px), 0px) scale(1.12);
            }
            100% {
              /* Slide smoothly back across water to exact starting position with no trail */
              transform: translate(0px, 0px) scale(1);
            }
          }
        }

        @keyframes bossBeamRecoil {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          14% {
            /* Dash in front of the player, beam centered squarely on player chest */
            transform: translate(min(-40px, calc(-100cqw + 580px)), 15px) scale(1.1);
          }
          78% {
            /* Fire beam directly into the middle of the player from the front, clear beam and pause cleanly */
            transform: translate(min(-40px, calc(-100cqw + 580px)), 15px) scale(1.1);
          }
          100% {
            /* Slide smoothly back to home position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-boss-lunge {
          animation-name: bossLunge;
        }

        .animate-boss-heavy-lunge {
          animation-name: bossHeavyLunge;
        }

        .animate-boss-beam-recoil {
          animation-name: bossBeamRecoil;
        }

        .animate-boss-gram-positive-lunge {
          animation-name: bossGramPositiveLunge;
        }

        .animate-boss-gram-positive-heavy-lunge {
          animation-name: bossGramPositiveHeavyLunge;
        }

        .animate-boss-staph-sentinel-heavy-lunge {
          animation-name: bossStaphSentinelHeavyLunge;
        }

        .animate-boss-biohazard-lunge {
          animation-name: bossBiohazardLunge;
        }

        .animate-boss-biohazard-heavy-lunge {
          animation-name: bossBiohazardHeavyLunge;
        }

        .animate-boss-acid-slime-lunge {
          animation-name: bossAcidSlimeLunge;
        }

        .animate-boss-acid-slime-heavy-lunge {
          animation-name: bossAcidSlimeHeavyLunge;
        }

        .animate-boss-sickle-cell-minion-lunge {
          animation-name: bossSickleCellMinionLunge;
        }

        .animate-boss-sickle-cell-minion-heavy-lunge {
          animation-name: bossSickleCellMinionHeavyLunge;
        }

        .animate-boss-anemia-normal-lunge {
          animation-name: bossAnemiaNormalLunge;
        }




        .animate-boss-fungal-spore-lunge {
          animation-name: bossFungalSporeLunge;
        }

        .animate-boss-fungal-spore-heavy-lunge {
          animation-name: bossFungalSporeHeavyLunge;
        }

        .animate-boss-reagent-slime-lunge {
          animation-name: bossReagentSlimeLunge;
        }

        .animate-boss-reagent-slime-heavy-lunge {
          animation-name: bossReagentSlimeHeavyLunge;
        }

        .animate-boss-immune-archon-lunge {
          animation-name: bossImmuneArchonLunge;
        }

        .animate-boss-immune-archon-heavy-lunge {
          animation-name: bossImmuneArchonHeavyLunge;
        }

        .animate-boss-lymphocyte-lunge {
          animation-name: bossLymphocyteLunge;
        }

        .animate-boss-lymphocyte-heavy-lunge {
          animation-name: bossLymphocyteHeavyLunge;
        }

        .animate-boss-hydra-normal {
          animation-name: bossHydraNormalAttack;
        }

        @keyframes bossReaperGlintNormal {
          0% {
            transform: translate(0px, 0px) scale(1);
            filter: drop-shadow(0 0 0px rgba(249, 115, 22, 0));
          }
          25% {
            /* Stationary charge in place: subtle breath back and glowing amber aura, stays firmly at home position */
            transform: translate(-4px, -2px) scale(1.04);
            filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.7)) brightness(1.15);
          }
          45% {
            /* Glint flash peak: weapon sparks and subterranean power surge */
            transform: translate(-6px, -3px) scale(1.06);
            filter: drop-shadow(0 0 18px rgba(234, 88, 12, 0.9)) brightness(1.3);
          }
          75% {
            /* Underground spikes erupt under player: maintain steady spellcasting stance */
            transform: translate(-3px, -1px) scale(1.03);
            filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.5)) brightness(1.1);
          }
          100% {
            /* Return smoothly to resting home position */
            transform: translate(0px, 0px) scale(1);
            filter: drop-shadow(0 0 0px rgba(249, 115, 22, 0));
          }
        }

        .animate-boss-reaper-glint-normal {
          animation-name: bossReaperGlintNormal;
        }

        .animate-boss-hyperglycemic-mutant-lunge {
          animation-name: bossHyperglycemicMutantLunge;
        }

        .animate-boss-hyperglycemic-mutant-heavy-lunge {
          animation-name: bossHyperglycemicMutantHeavyLunge;
        }

        .animate-boss-ketoacidosis-colossus-lunge {
          animation-name: bossKetoacidosisColossusLunge;
        }

        .animate-boss-ketoacidosis-colossus-heavy-lunge {
          animation-name: bossKetoacidosisColossusHeavyLunge;
        }

        .animate-boss-antigen-titan-lunge {
          animation-name: bossAntigenTitanLunge;
        }

        .animate-boss-antigen-titan-heavy-lunge {
          animation-name: bossAntigenTitanHeavyLunge;
        }

        @keyframes bossProjectileFly {
          0% {
            transform: translate(0px, 0px) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translate(-35px, 10px) scale(1);
            opacity: 1;
          }
          85% {
            /* Impacts directly onto the front of the player */
            transform: translate(min(-80px, calc(-100cqw + 280px)), 48px) scale(1.3);
            opacity: 1;
          }
          100% {
            /* Detonates on the front surface without passing behind */
            transform: translate(min(-80px, calc(-100cqw + 265px)), 50px) scale(1.4);
            opacity: 0;
          }
        }

        .animate-boss-projectile-fly {
          animation-name: bossProjectileFly;
        }

        /* Player Attack Lunge (Lunge right in front of the boss on its left side) */
        @keyframes playerLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Charge across arena to land directly to the left side of the boss sprite */
            transform: ${isKetoacidosisColossus
          ? 'translate(calc(100cqw - 520px), 0px) scale(1.15)'
          : isAntigenTitan
            ? 'translate(calc(100cqw - 470px), 0px) scale(1.15)'
            : isHyperglycemicMutant
              ? 'translate(calc(100cqw - 460px), -15px) scale(1.15)'
              : isImmuneArchon ? 'translate(calc(100cqw - 440px), -15px) scale(1.15)' : 'translate(calc(100cqw - 340px), -20px) scale(1.15)'
        };
          }
          78% {
            /* Slash boss, then pause cleanly in front of boss */
            transform: ${isKetoacidosisColossus
          ? 'translate(calc(100cqw - 520px), 0px) scale(1.15)'
          : isAntigenTitan
            ? 'translate(calc(100cqw - 470px), 0px) scale(1.15)'
            : isHyperglycemicMutant
              ? 'translate(calc(100cqw - 460px), -15px) scale(1.15)'
              : isImmuneArchon ? 'translate(calc(100cqw - 440px), -15px) scale(1.15)' : 'translate(calc(100cqw - 340px), -20px) scale(1.15)'
        };
          }
          100% {
            /* Return to bottom-left home spot */
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-player-lunge {
          animation-name: playerLunge;
          animation-duration: 1.2s;
          animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
