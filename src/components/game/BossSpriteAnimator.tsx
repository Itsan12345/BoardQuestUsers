"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BossAnimState = "idle" | "normal_attack" | "heavy_attack";

interface BossSpriteAnimatorProps {
  idleSpriteUrl: string;
  attackSpriteUrl: string;
  heavyAttackSpriteUrl?: string;
  idleFrames?: number;
  attackFrames?: number;
  heavyAttackFrames?: number;
  idleFrameWidth?: number;
  attackFrameWidth?: number;
  heavyFrameWidth?: number;
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
  idleFrames = 7,
  attackFrames = 17,
  heavyAttackFrames = 11,
  idleFrameWidth = 128,
  attackFrameWidth = 128,
  heavyFrameWidth = 176,
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

  const currentSpriteUrl = isHeavy
    ? (heavyAttackSpriteUrl || attackSpriteUrl)
    : isAttacking
    ? attackSpriteUrl
    : idleSpriteUrl;

  const currentTotalFrames = isHeavy
    ? (heavyAttackFrames || 11)
    : isAttacking
    ? attackFrames
    : idleFrames;

  const currentFrameWidth = isHeavy
    ? (heavyFrameWidth || 176)
    : isAttacking
    ? (attackFrameWidth || 128)
    : (idleFrameWidth || 128);

  const currentFrameHeight = 128;

  // Frame rates (fps)
  const fps = isHeavy ? 11 : isAttacking ? 14 : 8;
  const animDuration = currentTotalFrames / fps;

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
      }, animDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [animState, isAttacking, animDuration]);

  const sheetWidth = currentFrameWidth * currentTotalFrames;

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center select-none", className)}>
      {/* Immersive Shadow & Magical Boss Pedestal */}
      <div className="absolute -bottom-2 w-28 h-6 bg-black/60 rounded-[100%] blur-md scale-y-50 pointer-events-none" />
      {isShielded && (
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse pointer-events-none" />
      )}
      {isEnraged && (
        <div className="absolute inset-0 rounded-full bg-red-600/30 blur-2xl animate-pulse pointer-events-none" />
      )}

      {/* Main Animated Sprite Container - Uses Container Relative Units to Prevent Sidebar Overlap */}
      <div
        key={`container-${animState}-${animKey}`}
        className={cn(
          "relative overflow-hidden transition-all transform-gpu z-20",
          isHeavy && "animate-boss-heavy-lunge",
          isAttacking && !isHeavy && "animate-boss-lunge",
          isHit && "brightness-200 contrast-200 hue-rotate-90 animate-shake"
        )}
        style={{
          width: `${currentFrameWidth * scale}px`,
          height: `${currentFrameHeight * scale}px`,
          ...(isAttacking
            ? {
                animationDuration: `${animDuration}s`,
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
            animation: `bossSpriteAnim ${animDuration}s steps(${currentTotalFrames}) ${isAttacking ? "1" : "infinite"}`,
            animationFillMode: isAttacking ? "forwards" : "none",
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
          15% {
            /* Wind-up back to the top-right */
            transform: translate(30px, -15px) scale(0.9);
          }
          38% {
            /* Charge right in front of player sprite (to the right side) */
            transform: translate(min(-120px, calc(-100cqw + 320px)), 20px) scale(1.5);
          }
          72% {
            /* Hold strike position in front of player */
            transform: translate(min(-120px, calc(-100cqw + 320px)), 20px) scale(1.5);
          }
          100% {
            /* Slide smoothly back to top-right home position */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bossHeavyLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          35% {
            /* Wind up & gather power at home position during Frames 1-5 */
            transform: translate(40px, -15px) scale(0.9);
          }
          58% {
            /* Charge forward to land right in front of player on Frame 7 (Strike Impact!) */
            transform: translate(min(-120px, calc(-100cqw + 320px)), 20px) scale(1.6);
          }
          75% {
            /* Hold strike impact position through Frame 8 */
            transform: translate(min(-120px, calc(-100cqw + 320px)), 20px) scale(1.6);
          }
          100% {
            /* Slide smoothly back to home position (Frames 9-11) */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @media (min-width: 768px) {
          @keyframes bossLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            15% {
              transform: translate(45px, -20px) scale(0.9);
            }
            38% {
              /* Lands right in front of the player sprite (to the right side of the player) */
              transform: translate(calc(-100cqw + 420px), 25px) scale(1.65);
            }
            72% {
              transform: translate(calc(-100cqw + 420px), 25px) scale(1.65);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          @keyframes bossHeavyLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            35% {
              /* Wind up & gather power at home position during Frames 1-5 */
              transform: translate(55px, -20px) scale(0.85);
            }
            58% {
              /* Lands right in front of player on Frame 7 (Strike Impact!) */
              transform: translate(calc(-100cqw + 420px), 25px) scale(1.75);
            }
            75% {
              /* Hold strike impact position through Frame 8 */
              transform: translate(calc(-100cqw + 420px), 25px) scale(1.75);
            }
            100% {
              /* Slide smoothly back to home position */
              transform: translate(0px, 0px) scale(1);
            }
          }
        }

        .animate-boss-lunge {
          animation-name: bossLunge;
        }

        .animate-boss-heavy-lunge {
          animation-name: bossHeavyLunge;
        }

        /* Player Attack Lunge (Lunge right in front of the boss on its left side) */
        @keyframes playerLunge {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          15% {
            /* Wind up back to bottom-left */
            transform: translate(-30px, 15px) scale(0.95);
          }
          38% {
            /* Charge across arena to land directly to the left side of the boss sprite */
            transform: translate(calc(100cqw - 340px), -20px) scale(1.15);
          }
          72% {
            /* Hold impact position in front of boss */
            transform: translate(calc(100cqw - 340px), -20px) scale(1.15);
          }
          100% {
            /* Return to bottom-left home spot */
            transform: translate(0px, 0px) scale(1);
          }
        }

        @media (min-width: 768px) {
          @keyframes playerLunge {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            15% {
              transform: translate(-40px, 20px) scale(0.95);
            }
            38% {
              /* Lands just to the left side of the boss sprite on desktop */
              transform: translate(calc(100cqw - 410px), -30px) scale(1.2);
            }
            72% {
              transform: translate(calc(100cqw - 410px), -30px) scale(1.2);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
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
