"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { preloadSpecterSounds, playSpecterAttack, preloadBiohazardSounds, playBiohazardAttack, preloadStaphSentinelSounds, playStaphSentinelAttack, preloadCrystalGolemSounds, playCrystalGolemAttack, preloadMicrobeSwarmSounds, playMicrobeSwarmAttack, preloadSickleCellReaperSounds, playSickleCellReaperAttack, preloadAcidSlimeSounds, playAcidSlimeAttack, preloadSickleCellMinionSounds, playSickleCellMinionAttack, preloadGramPositiveSounds, playGramPositiveAttack, preloadFungalSporeSounds, playFungalSporeAttack, playAudioFile } from "@/lib/audio-manager";

export type BossAnimState = "idle" | "normal_attack" | "heavy_attack";

interface BossSpriteAnimatorProps {
  bossName?: string;
  normalAttackSfxUrl?: string;
  heavyAttackSfxUrl?: string;
  idleSpriteUrl: string;
  attackSpriteUrl: string;
  heavyAttackSpriteUrl?: string;
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
  const hasProjectile = isNormalAttack && !!attackProjectileUrl;

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

  const hasUndergroundSpikes = !isSickleCellMinionAttack && isNormalAttack && !!undergroundSpikesUrl;

  const currentSpriteUrl = isHeavy
    ? (heavyAttackSpriteUrl || attackSpriteUrl)
    : (isNormalAttack && hasProjectile)
    ? idleSpriteUrl
    : isAttacking
    ? attackSpriteUrl
    : idleSpriteUrl;

  const currentTotalFrames = isHeavy
    ? (heavyAttackFrames || 11)
    : (isNormalAttack && hasProjectile)
    ? idleFrames
    : isAttacking
    ? attackFrames
    : idleFrames;

  const currentFrameWidth = isHeavy
    ? (heavyFrameWidth || 176)
    : (isNormalAttack && hasProjectile)
    ? (idleFrameWidth || 128)
    : isAttacking
    ? (attackFrameWidth || 128)
    : (idleFrameWidth || 128);

  const currentFrameHeight = isHeavy
    ? (heavyFrameHeight || (heavyFrameWidth && heavyFrameWidth >= 300 ? 256 : 128))
    : (isNormalAttack && hasProjectile)
    ? (idleFrameHeight || 128)
    : isAttacking
    ? (attackFrameHeight || (attackFrameWidth && attackFrameWidth >= 300 ? 256 : 128))
    : (idleFrameHeight || 128);

  const isWideBeam = isAttacking && currentFrameWidth >= 300;

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

  const isAcidSlimeAttack = isAttacking && (
    attackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    bossName?.toLowerCase().includes('acid slime') ||
    bossName?.toLowerCase().includes('slime') ||
    heavyAttackSfxUrl?.includes('AcidSlime') ||
    normalAttackSfxUrl?.includes('AcidSlime')
  );
  const isAcidSlimeHeavy = isHeavy && isAcidSlimeAttack;
  const isAcidSlimeNormal = !isHeavy && isAcidSlimeAttack;
  const isAcidSlimeIdle = !isAttacking && (
    idleSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    bossName?.toLowerCase().includes('acid slime') ||
    bossName?.toLowerCase().includes('slime')
  );

  const isGmsFungalSporeAttack = isAttacking && (
    attackSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    bossName?.toLowerCase().includes('fungal spore') ||
    bossName?.toLowerCase().includes('gms')
  );
  const isGmsFungalSporeHeavy = isHeavy && isGmsFungalSporeAttack;
  const isGmsFungalSporeNormal = !isHeavy && isGmsFungalSporeAttack;
  const isGmsFungalSporeIdle = !isAttacking && (
    idleSpriteUrl?.includes('hispatho_chapterOneMinion') ||
    bossName?.toLowerCase().includes('fungal spore') ||
    bossName?.toLowerCase().includes('gms')
  );

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
    : isSickleCellReaperHeavy
    ? 0.70
    : isSickleCellReaperNormal
    ? 0.42
    : isBiohazardHeavy
    ? 0.82
    : isBiohazardNormal
    ? 0.48
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
    : isSickleCellReaperHeavy
    ? 0.70
    : isSickleCellReaperNormal
    ? 0.42
    : isBiohazardHeavy
    ? 0.82
    : isBiohazardNormal
    ? 0.48
    : isAcidSlimeHeavy
    ? 0.82
    : isAcidSlimeNormal
    ? 0.58
    : isGmsFungalSporeHeavy
    ? 0.81
    : isGmsFungalSporeNormal
    ? 0.67
    : spriteDuration;

  const lungeDuration = isAttacking
    ? (hasProjectile ? 0.45 : hasUndergroundSpikes ? 1.05 : totalAttackDuration + (isStaphSentinelHeavy ? 0.38 : (isBiohazardHeavy ? 0.36 : (isSickleCellMinionAttack ? 0.16 : (isGmsFungalSporeAttack ? 0.18 : 0.35)))))
    : spriteDuration;

  // Store callback in ref to prevent parent re-render reference changes from restarting timer
  const onCompleteRef = useRef(onAttackComplete);
  useEffect(() => {
    onCompleteRef.current = onAttackComplete;
  }, [onAttackComplete]);

  const isSpecter = (
    bossName?.toLowerCase().includes('specter') ||
    idleSpriteUrl?.includes('clinchem_finalboss') ||
    heavyAttackSpriteUrl?.includes('clinchem_finalboss') ||
    attackSpriteUrl?.includes('clinchem_finalboss') ||
    attackProjectileUrl?.includes('clinchem_finalboss') ||
    (isWideBeam && currentFrameWidth === 480)
  );

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

  const isAcidSlime = (
    bossName?.toLowerCase().includes('acid slime') ||
    bossName?.toLowerCase().includes('slime') ||
    idleSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    attackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    heavyAttackSpriteUrl?.includes('clinchem_chapterOneMinion') ||
    heavyAttackSfxUrl?.includes('AcidSlime') ||
    normalAttackSfxUrl?.includes('AcidSlime')
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
    if (isCrystalGolem || heavyAttackSfxUrl?.includes('CrystalGolem') || normalAttackSfxUrl?.includes('CrystalGolem')) {
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
    if (isAcidSlime || heavyAttackSfxUrl?.includes('AcidSlime') || normalAttackSfxUrl?.includes('AcidSlime')) {
      preloadAcidSlimeSounds();
    }
    if (isGramPositive || isGramPositiveAttack || heavyAttackSfxUrl?.includes('GramPositive') || normalAttackSfxUrl?.includes('GramPositive')) {
      preloadGramPositiveSounds();
    }
    if (isGmsFungalSpore || isGmsFungalSporeAttack || heavyAttackSfxUrl?.includes('FungalSpore') || normalAttackSfxUrl?.includes('FungalSpore')) {
      preloadFungalSporeSounds();
    }
  }, [isSpecter, isStaphSentinel, isBiohazard, isCrystalGolem, isMicrobeSwarm, isSickleCellReaper, isSickleCellReaperAttack, isSickleCellMinion, isSickleCellMinionAttack, isAcidSlime, isGramPositive, isGramPositiveAttack, isGmsFungalSpore, isGmsFungalSporeAttack, heavyAttackSpriteUrl, heavyAttackSfxUrl, normalAttackSfxUrl]);

  // Key to force reset DOM animation state whenever animState changes
  const [animKey, setAnimKey] = useState(0);
  const lastPlayedAnimRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAttacking) {
      if (lastPlayedAnimRef.current !== animState) {
        lastPlayedAnimRef.current = animState;
        if (isGramPositive || isGramPositiveAttack) {
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
            setTimeout(() => {
              playSickleCellReaperAttack('normal');
            }, 400);
          }
        } else if (isSickleCellMinion || isSickleCellMinionAttack) {
          if (isHeavy) {
            playSickleCellMinionAttack('heavy');
          } else if (isNormalAttack) {
            playSickleCellMinionAttack('normal');
          }
        } else if (isAcidSlime || isAcidSlimeAttack) {
          if (isHeavy) {
            playAcidSlimeAttack('heavy');
          } else if (isNormalAttack) {
            playAcidSlimeAttack('normal');
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
        } else if (isMicrobeSwarm || isMicrobeSwarmAttack) {
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
        } else if (isSpecter) {
          if (isHeavy) {
            playSpecterAttack('heavy');
          } else if (isNormalAttack) {
            playSpecterAttack('normal');
          }
        } else if (heavyAttackSfxUrl || normalAttackSfxUrl) {
          if (isHeavy) {
            if (heavyAttackSfxUrl) {
              playAudioFile(heavyAttackSfxUrl);
            }
          } else if (isNormalAttack) {
            if (normalAttackSfxUrl) {
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
      return () => clearTimeout(timer);
    } else {
      lastPlayedAnimRef.current = null;
    }
  }, [animState, isAttacking, lungeDuration, isGramPositive, isGramPositiveAttack, isSickleCellMinion, isSickleCellMinionAttack, isStaphSentinel, isStaphSentinelAttack, isSickleCellReaper, isSickleCellReaperAttack, isMicrobeSwarm, isMicrobeSwarmAttack, isSpecter, isBiohazard, isBiohazardAttack, isCrystalGolem, isCrystalGolemAttack, isAcidSlime, isAcidSlimeAttack, isGmsFungalSpore, isGmsFungalSporeAttack, isHeavy, isNormalAttack, heavyAttackSpriteUrl, heavyAttackSfxUrl, normalAttackSfxUrl]);

  const sheetWidth = currentFrameWidth * currentTotalFrames;

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center select-none", className)}>
      {/* Hidden Image Preloader to prevent sprite sheet flash/flicker */}
      {/* eslint-disable @next/next/no-img-element */}
      <div className="hidden pointer-events-none aria-hidden">
        {idleSpriteUrl && <img src={idleSpriteUrl} alt="" />}
        {attackSpriteUrl && <img src={attackSpriteUrl} alt="" />}
        {heavyAttackSpriteUrl && <img src={heavyAttackSpriteUrl} alt="" />}
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
          className="absolute top-2 right-6 overflow-hidden pointer-events-none z-30 animate-boss-projectile-fly"
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
            className="absolute top-0 left-0"
            style={{
              width: `${128 * (attackProjectileFrames || 5) * scale}px`,
              height: `${128 * scale}px`,
              backgroundImage: `url('${attackProjectileUrl}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${128 * (attackProjectileFrames || 5) * scale}px ${128 * scale}px`,
              imageRendering: "pixelated",
              animation: `bossSpriteAnim ${(attackProjectileFrames || 5) / 16}s steps(${attackProjectileFrames || 5}) infinite`,
            }}
          />
        </div>
      )}

      {/* Main Animated Sprite Container - Uses Container Relative Units to Prevent Sidebar Overlap */}
      <div
        key={`container-${animState}-${animKey}`}
        className={cn(
          "relative overflow-hidden transition-all transform-gpu z-20",
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
          isGmsFungalSporeHeavy && "animate-boss-fungal-spore-heavy-lunge",
          isGmsFungalSporeNormal && "animate-boss-fungal-spore-lunge",
          isHeavy && !isWideBeam && !isGramPositiveAttack && !isStaphSentinelAttack && !isBiohazardAttack && !isAcidSlimeAttack && !isSickleCellMinionAttack && !isGmsFungalSporeAttack && "animate-boss-heavy-lunge",
          isAttacking && !isHeavy && !isWideBeam && !hasProjectile && !hasUndergroundSpikes && !isGramPositiveAttack && !isBiohazardAttack && !isAcidSlimeAttack && !isSickleCellMinionAttack && !isGmsFungalSporeAttack && "animate-boss-lunge",
          isHit && "brightness-200 contrast-200 hue-rotate-90 animate-shake"
        )}
        style={{
          width: `${currentFrameWidth * scale}px`,
          height: `${currentFrameHeight * scale}px`,
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
            width: `${sheetWidth * scale}px`,
            height: `${currentFrameHeight * scale}px`,
            backgroundImage: `url('${currentSpriteUrl}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${sheetWidth * scale}px ${currentFrameHeight * scale}px`,
            imageRendering: "pixelated",
            animationName: "bossSpriteAnim",
            animationDuration: `${spriteDuration}s`,
            animationTimingFunction: `steps(${currentTotalFrames})`,
            animationIterationCount: (isGramPositiveHeavy || isStaphSentinelHeavy) ? 2 : (isAttacking ? 1 : "infinite"),
            animationFillMode: "none",
          }}
        />
      </div>

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
            /* Execute 2-cycle acid surge directly into player, pause cleanly */
            transform: translate(min(-30px, calc(-100cqw + 375px)), 18px) scale(1.2);
          }
          100% {
            /* Slide smoothly back to home position matching idle coordinates */
            transform: translate(-91px, 19px) scale(1);
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

        @keyframes bossFungalSporeLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          14% {
            transform: translate(min(-35px, calc(-100cqw + 380px)), 10px) scale(1.1);
          }
          76% {
            transform: translate(min(-35px, calc(-100cqw + 380px)), 10px) scale(1.1);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossFungalSporeHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            transform: translate(min(-40px, calc(-100cqw + 360px)), 12px) scale(1.15);
          }
          78% {
            transform: translate(min(-40px, calc(-100cqw + 360px)), 12px) scale(1.15);
          }
          100% {
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
            12% {
              /* Dash in front of the player (standing to the right side of the player sprite) */
              transform: translate(calc(-100cqw + 640px), 20px) scale(1.15);
            }
            78% {
              /* Fire beam directly into the player from the front, clear beam and pause cleanly */
              transform: translate(calc(-100cqw + 640px), 20px) scale(1.15);
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

          @keyframes bossFungalSporeLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            14% {
              transform: translate(calc(-100cqw + 540px), 12px) scale(1.15);
            }
            76% {
              transform: translate(calc(-100cqw + 540px), 12px) scale(1.15);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossFungalSporeHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              transform: translate(calc(-100cqw + 510px), 16px) scale(1.2);
            }
            78% {
              transform: translate(calc(-100cqw + 510px), 16px) scale(1.2);
            }
            100% {
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

          @keyframes playerLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            12% {
              /* Lands just to the left side of the boss sprite on desktop */
              transform: translate(calc(100cqw - 410px), -30px) scale(1.2);
            }
            78% {
              /* Slashes boss, then pauses cleanly in front of boss */
              transform: translate(calc(100cqw - 410px), -30px) scale(1.2);
            }
            100% {
              /* Glides back smoothly to home spot */
              transform: translate(0px, 0px) scale(1);
            }
          }
        }

        @keyframes bossBeamRecoil {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          12% {
            /* Dash in front of the player */
            transform: translate(min(-60px, calc(-100cqw + 500px)), 15px) scale(1.1);
          }
          78% {
            /* Fire beam directly into the player from the front, clear beam and pause cleanly */
            transform: translate(min(-60px, calc(-100cqw + 500px)), 15px) scale(1.1);
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

        .animate-boss-fungal-spore-lunge {
          animation-name: bossFungalSporeLunge;
        }

        .animate-boss-fungal-spore-heavy-lunge {
          animation-name: bossFungalSporeHeavyLunge;
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
            transform: translate(calc(100cqw - 340px), -20px) scale(1.15);
          }
          78% {
            /* Slash boss, then pause cleanly in front of boss */
            transform: translate(calc(100cqw - 340px), -20px) scale(1.15);
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
