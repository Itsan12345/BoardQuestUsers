"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BossAnimState = "idle" | "normal_attack" | "heavy_attack";

interface BossSpriteAnimatorProps {
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
  idleSpriteUrl,
  attackSpriteUrl,
  heavyAttackSpriteUrl,
  attackProjectileUrl,
  attackProjectileFrames = 5,
  undergroundSpikesUrl,
  undergroundSpikesFrames = 8,
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
  const hasUndergroundSpikes = isNormalAttack && !!undergroundSpikesUrl;

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
    heavyAttackSpriteUrl?.includes('microbio_chapterOneBoss_normalAttackAnimation')
  );
  const isGramPositiveHeavy = isHeavy && isGramPositiveAttack;
  const isGramPositiveNormal = !isHeavy && isGramPositiveAttack;

  const isStaphSentinelAttack = isAttacking && (
    attackSpriteUrl?.includes('microbio_chapterOneMiniBoss_normalAttackAnimation') ||
    heavyAttackSpriteUrl?.includes('microbio_chapterOneMiniBoss_normalAttackAnimation')
  );
  const isStaphSentinelHeavy = isHeavy && isStaphSentinelAttack;
  const isStaphSentinelNormal = !isHeavy && isStaphSentinelAttack;

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
    : spriteDuration;

  const lungeDuration = isAttacking
    ? (hasProjectile ? 0.45 : hasUndergroundSpikes ? 1.05 : totalAttackDuration + (isStaphSentinelHeavy ? 0.38 : 0.35))
    : spriteDuration;

  // Store callback in ref to prevent parent re-render reference changes from restarting timer
  const onCompleteRef = useRef(onAttackComplete);
  useEffect(() => {
    onCompleteRef.current = onAttackComplete;
  }, [onAttackComplete]);

  // Key to force reset DOM animation state whenever animState changes
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isAttacking) {
      setAnimKey((prev) => prev + 1);
      const timer = setTimeout(() => {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }, lungeDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [animState, isAttacking, lungeDuration]);

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
          isHeavy && !isWideBeam && !isGramPositiveAttack && !isStaphSentinelAttack && "animate-boss-heavy-lunge",
          isAttacking && !isHeavy && !isWideBeam && !hasProjectile && !hasUndergroundSpikes && !isGramPositiveAttack && "animate-boss-lunge",
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
