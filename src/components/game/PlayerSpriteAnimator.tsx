"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { HitEffectAnimator } from "@/components/game/HitEffectAnimator";

export type PlayerAnimState = "idle" | "attack" | "heavy_glint" | "heavy_blast";

interface PlayerSpriteAnimatorProps {
  gender: "male" | "female";
  animState: PlayerAnimState;
  isHit?: boolean;
  hitEffectTarget?: string | null;
  hitEffectKey?: number;
  className?: string;
}

export function PlayerSpriteAnimator({
  gender,
  animState,
  isHit: _isHit = false,
  hitEffectTarget,
  hitEffectKey = 0,
  className,
}: PlayerSpriteAnimatorProps) {
  const isFemale = gender === "female";
  const isNormalAttack = animState === "attack";
  const isHeavyGlint = animState === "heavy_glint";
  const isHeavyBlast = animState === "heavy_blast";
  const showHeavyGlint = isHeavyGlint || isHeavyBlast;

  // --- MALE AVATAR SPRITE SYSTEM ---
  // Dimensions and frame configuration:
  // Idle: 7 frames, 128x128
  // Normal Attack: 11 frames, 510x275
  // Heavy Glint: 17 frames, 192x145
  // Heavy Blast Projectile: 13 frames, 464x223
  if (!isFemale) {
    return (
      <div
        className={cn(
          "relative z-10 w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-84 lg:h-84 shrink-0 transition-transform overflow-visible select-none",
          className
        )}
      >
        {/* 1. IDLE ANIMATION (Looping continuously when idle or during blast projectile flight) */}
        <div
          className={cn(
            "absolute bottom-0 left-0 pointer-events-none",
            isNormalAttack
              ? "male-idle-during-attack"
              : isHeavyGlint
              ? "opacity-0 invisible"
              : isHeavyBlast
              ? "male-idle-heavy-blast"
              : "opacity-100 visible"
          )}
        >
          <div
            className="male-idle-viewport relative overflow-hidden filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
            style={{ imageRendering: "pixelated" }}
          >
            <div className="male-idle-sheet absolute top-0 left-0" />
          </div>
        </div>

        {/* 2. NORMAL ATTACK ANIMATION (11 frames, 510x275, plays on correct Normal Attack Card) */}
        {isNormalAttack && (
          <div className="male-normal-attack-container absolute bottom-0 left-0 pointer-events-none z-20">
            <div
              className="male-normal-attack-viewport relative overflow-hidden filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
              style={{ imageRendering: "pixelated" }}
            >
              <div className="male-normal-attack-sheet absolute top-0 left-0" />
            </div>
          </div>
        )}

        {/* 3. HEAVY ATTACK GLINT ANIMATION (17 frames, 192x145, plays in-place during charge & blast casting) */}
        {showHeavyGlint && (
          <div
            className={cn(
              "male-heavy-glint-container absolute bottom-0 left-0 pointer-events-none z-20",
              isHeavyBlast ? "male-heavy-glint-during-blast" : ""
            )}
          >
            <div
              className="male-heavy-glint-viewport relative overflow-hidden filter drop-shadow-[0_0_18px_rgba(245,158,11,0.6)] drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]"
              style={{ imageRendering: "pixelated" }}
            >
              <div
                className={cn(
                  "male-heavy-glint-sheet absolute top-0 left-0",
                  isHeavyBlast ? "male-heavy-glint-sheet-casting" : "male-heavy-glint-sheet-charge"
                )}
              />
            </div>
          </div>
        )}

        {/* 4. HEAVY ATTACK BLAST PROJECTILE (13 frames, 464x223, flies smoothly towards enemy) */}
        {isHeavyBlast && (
          <div className="male-heavy-blast-container absolute bottom-0 left-0 pointer-events-none z-40">
            <div
              className="male-heavy-blast-viewport relative overflow-hidden filter drop-shadow-[0_0_20px_rgba(245,158,11,0.95)] drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]"
              style={{ imageRendering: "pixelated" }}
            >
              <div className="male-heavy-blast-sheet absolute top-0 left-0" />
            </div>
            {/* Smooth Explosion Detonation Flare & Shockwave on Enemy Impact */}
            <div className="male-heavy-blast-explosion absolute pointer-events-none" />
          </div>
        )}

        {/* Player Hit Reaction Flash/Spark on Chest */}
        <HitEffectAnimator
          isActive={hitEffectTarget === "player"}
          triggerKey={hitEffectKey}
          scale={2.2}
          className="top-[45%] left-[52%]"
        />

        <style jsx global>{`
          /* ========================================================= */
          /* MALE AVATAR SPRITE STYLES (MOBILE / BASE VIEWPORT)        */
          /* Scale Factor: ~1.35x base (Idle 173x173)                   */
          /* ========================================================= */

          /* --- 1. Idle Animation (7 frames, 128x128) --- */
          .male-idle-viewport {
            width: 173px;
            height: 173px;
          }
          .male-idle-sheet {
            width: 1211px; /* 173px * 7 frames */
            height: 173px;
            background-image: url('/images/player/maleCharacter_idleAnimation.png');
            background-repeat: no-repeat;
            background-size: 1211px 173px;
            animation: maleIdleStep 0.8s steps(7) infinite;
          }
          @keyframes maleIdleStep {
            from { transform: translateX(0px); }
            to { transform: translateX(-100%); }
          }

          /* --- 2. Normal Attack Animation (11 frames, 510x275) --- */
          /* Exact same scale factor as Idle Animation (173 / 128 = 1.3515625) */
          /* Horizontal alignment offset: frame 0 dx = 142px (-142 * 1.3515625 = -192px) */
          .male-normal-attack-viewport {
            width: 689px;
            height: 372px;
            transform: translateX(-192px);
          }
          .male-normal-attack-sheet {
            width: 7579px; /* 689px * 11 frames */
            height: 372px;
            background-image: url('/images/player/maleCharacter_normalAttackAnimation.png');
            background-repeat: no-repeat;
            background-size: 7579px 372px;
            animation: maleNormalAttackStep 1.2s steps(11) 1 forwards;
          }
          @keyframes maleNormalAttackStep {
            from { transform: translateX(0px); }
            to { transform: translateX(-100%); }
          }

          /* --- Normal Attack Crossfade Fadeout --- */
          .male-normal-attack-container {
            animation: maleAttackFadeOut 1.38s ease-out forwards;
          }
          @keyframes maleAttackFadeOut {
            0% { opacity: 1; }
            86.9% { opacity: 1; }
            87% { opacity: 1; }
            100% { opacity: 0; }
          }

          /* --- Idle Crossfade during Normal Attack Settle --- */
          .male-idle-during-attack {
            animation: maleIdleFadeIn 1.38s ease-out forwards;
          }
          @keyframes maleIdleFadeIn {
            0% { opacity: 0; }
            86.9% { opacity: 0; }
            87% { opacity: 0; }
            100% { opacity: 1; }
          }

          /* --- Male Normal Attack Lunge (Mobile) --- */
          /* Frames 0-3 (0% to 28%): stationary at home spot, matching Idle position and size */
          /* Frames 4-10 (28% to 87%): lunges forward smoothly towards enemy, scale(0.63) consistent throughout, and returns */
          /* Settle (87% to 100%): smoothly settles into Idle stance home spot with seamless crossfade */
          .animate-male-player-lunge {
            transform-origin: bottom left;
            animation-name: malePlayerLungeMobile;
            animation-duration: 1.38s;
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            animation-fill-mode: forwards;
          }
          @keyframes malePlayerLungeMobile {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            28% {
              /* Frames 0-3: stationary at exact Idle stance and position */
              transform: translate(0px, 0px) scale(1);
            }
            28.01% {
              /* Frame 4 begins: forward strike dash begins */
              transform: translate(0px, -16px) scale(0.63);
            }
            42% {
              /* Frames 4-6: smoothly accelerates forward closer to enemy */
              transform: translate(max(20px, calc(100cqw - 320px)), -16px) scale(0.63);
            }
            65% {
              /* Frames 7-8: executes explosive slash impact directly on enemy */
              transform: translate(max(20px, calc(100cqw - 320px)), -16px) scale(0.63);
            }
            76% {
              /* Frames 9-10: glides smoothly back across the arena at consistent scale(0.63) */
              transform: translate(calc(max(20px, calc(100cqw - 320px)) * 0.40), -16px) scale(0.63);
            }
            83% {
              /* Frame 10: glides smoothly towards home spot at consistent scale(0.63) */
              transform: translate(calc(max(20px, calc(100cqw - 320px)) * 0.08), -16px) scale(0.63);
            }
            87% {
              /* Finishes cleanly at home spot at consistent scale(0.63) */
              transform: translate(0px, -16px) scale(0.63);
              animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            }
            100% {
              /* Smoothly settles into Idle Stance home position and scale */
              transform: translate(0px, 0px) scale(1);
            }
          }

          /* --- 3. Heavy Attack Glint Animation (17 frames, 192x145) --- */
          /* Exact same scale factor as Idle Animation (173 / 128 = 1.3515625) */
          /* 1:1 pixel scale with Idle Stance */
          .male-heavy-glint-container {
            transform-origin: bottom left;
            transform: translate(0px, 0px);
          }
          .male-heavy-glint-viewport {
            width: 259px; /* 192px * 1.3515625 */
            height: 196px; /* 145px * 1.3515625 */
          }
          .male-heavy-glint-sheet {
            width: 4403px; /* 259px * 17 frames */
            height: 196px;
            background-image: url('/images/player/maleCharacter_heavyAttackGlintAnimation-1.png');
            background-repeat: no-repeat;
            background-size: 4403px 196px;
          }
          /* Phase 1 Charge: Plays frames 1 to 17 */
          .male-heavy-glint-sheet-charge {
            animation: maleHeavyGlintStep 0.65s steps(17) 1 forwards;
          }
          /* Phase 2 Blast Casting: Actively pulses glint energy along extended sword (frames 12-16 loop) */
          .male-heavy-glint-sheet-casting {
            animation: maleHeavyGlintLoop 0.35s steps(5) infinite;
          }
          /* Dissolves casting pose smoothly back into Idle after the blast detonates on mobile */
          .male-heavy-glint-during-blast {
            animation: maleHeavyGlintFadeOutMobile 0.88s ease-out forwards;
          }
          /* Fades Idle smoothly back in after blast detonation settle */
          .male-idle-heavy-blast {
            animation: maleIdleHeavyFadeIn 0.88s ease-out forwards;
          }
          @keyframes maleHeavyGlintStep {
            from { transform: translateX(0px); }
            to { transform: translateX(-100%); }
          }
          @keyframes maleHeavyGlintLoop {
            from { transform: translateX(-70.588%); }
            to { transform: translateX(-100%); }
          }
          @keyframes maleHeavyGlintFadeOutMobile {
            0% {
              opacity: 1;
            }
            85% {
              opacity: 1;
              animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            }
            100% {
              opacity: 0;
            }
          }
          @keyframes maleIdleHeavyFadeIn {
            0% { opacity: 0; }
            85% { opacity: 0; }
            100% { opacity: 1; }
          }

          /* --- 4. Heavy Attack Blast Animation (13 frames, 464x223) --- */
          .male-heavy-blast-container {
            transform-origin: 82% 50%;
            animation: maleHeavyBlastFlightMobile 0.75s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
          }
          .male-heavy-blast-viewport {
            width: 302px; /* 464 * 0.65 */
            height: 145px; /* 223 * 0.65 */
          }
          .male-heavy-blast-sheet {
            width: 3926px; /* 302px * 13 frames */
            height: 145px;
            background-image: url('/images/player/maleCharacter_heavyAttackBlastAnimation-2.png');
            background-repeat: no-repeat;
            background-size: 3926px 145px;
            animation: maleHeavyBlastStep 0.75s steps(13) 1 forwards;
          }
          .male-heavy-blast-explosion {
            left: 247px;
            top: 72px;
            width: 110px;
            height: 110px;
            margin-left: -55px;
            margin-top: -55px;
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(251, 191, 36, 0.9) 35%, rgba(239, 68, 68, 0.75) 60%, transparent 80%);
            filter: drop-shadow(0 0 20px rgba(251, 191, 36, 1)) drop-shadow(0 0 35px rgba(239, 68, 68, 0.9));
            pointer-events: none;
            opacity: 0;
            animation: maleHeavyBlastExplosionMobile 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes maleHeavyBlastStep {
            from { transform: translateX(0px); }
            to { transform: translateX(-100%); }
          }
          @keyframes maleHeavyBlastFlightMobile {
            0% {
              /* Emerges directly at the tip of the charged sword */
              transform: translate(80px, -20px) scale(0.70);
              opacity: 0;
              filter: brightness(1);
            }
            15% {
              /* Bursts into radiant flame energy at the sword tip */
              transform: translate(95px, -20px) scale(0.95);
              opacity: 1;
              filter: brightness(1.1);
            }
            64% {
              /* Smoothly glides across arena directly to the enemy's body */
              transform: translate(calc(100cqw - 350px), -16px) scale(1.05);
              opacity: 1;
              filter: brightness(1.15);
            }
            67% {
              /* EXPLOSIVE IMPACT: Detonates directly ON the enemy's body */
              transform: translate(calc(100cqw - 350px), -16px) scale(1.40);
              opacity: 1;
              filter: brightness(2.0);
            }
            76% {
              /* Shockwave expands over the enemy and smoothly dissipates */
              transform: translate(calc(100cqw - 350px), -16px) scale(1.65);
              opacity: 0;
              filter: brightness(1.3);
            }
            100% {
              /* Remains completely invisible */
              transform: translate(calc(100cqw - 350px), -16px) scale(1.70);
              opacity: 0;
              filter: brightness(1);
            }
          }
          @keyframes maleHeavyBlastExplosionMobile {
            0% {
              transform: scale(0.2);
              opacity: 0;
            }
            63% {
              transform: scale(0.3);
              opacity: 0;
            }
            67% {
              /* Explosive shockwave burst on enemy body */
              transform: scale(1.0);
              opacity: 1;
              filter: brightness(2.0);
            }
            74% {
              /* Shockwave ring expands outward */
              transform: scale(1.5);
              opacity: 0.7;
            }
            80% {
              /* Smoothly dissolves completely */
              transform: scale(1.8);
              opacity: 0;
              filter: brightness(1.2);
            }
            100% {
              transform: scale(1.9);
              opacity: 0;
            }
          }

          /* Intermediate tablet breakpoint (640px to 767px) */
          @media (min-width: 640px) and (max-width: 767px) {
            .male-heavy-blast-viewport {
              width: 325px;
              height: 156px;
            }
            .male-heavy-blast-sheet {
              width: 4225px;
              height: 156px;
              background-size: 4225px 156px;
            }
            .male-heavy-blast-explosion {
              left: 266px;
              top: 78px;
              width: 130px;
              height: 130px;
              margin-left: -65px;
              margin-top: -65px;
              border-radius: 9999px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(251, 191, 36, 0.9) 35%, rgba(239, 68, 68, 0.75) 60%, transparent 80%);
              filter: drop-shadow(0 0 25px rgba(251, 191, 36, 1)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.9));
              animation: maleHeavyBlastExplosionTablet 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .male-heavy-blast-container {
              transform-origin: 82% 50%;
              animation: maleHeavyBlastFlightTablet 0.75s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
            }
            @keyframes maleHeavyBlastFlightTablet {
              0% {
                transform: translate(110px, -25px) scale(0.65);
                opacity: 0;
                filter: brightness(1);
              }
              15% {
                transform: translate(125px, -25px) scale(0.95);
                opacity: 1;
                filter: brightness(1.1);
              }
              64% {
                /* Smoothly glides across arena directly to the enemy's body */
                transform: translate(calc(100cqw - 410px), -18px) scale(1.10);
                opacity: 1;
                filter: brightness(1.15);
              }
              67% {
                /* EXPLOSIVE IMPACT: Detonates directly ON the enemy's body */
                transform: translate(calc(100cqw - 410px), -18px) scale(1.45);
                opacity: 1;
                filter: brightness(2.0);
              }
              76% {
                /* Shockwave expands over the enemy and smoothly dissipates */
                transform: translate(calc(100cqw - 410px), -18px) scale(1.70);
                opacity: 0;
                filter: brightness(1.3);
              }
              100% {
                /* Remains completely invisible */
                transform: translate(calc(100cqw - 410px), -18px) scale(1.75);
                opacity: 0;
                filter: brightness(1);
              }
            }
            @keyframes maleHeavyBlastExplosionTablet {
              0% {
                transform: scale(0.2);
                opacity: 0;
              }
              63% {
                transform: scale(0.3);
                opacity: 0;
              }
              67% {
                transform: scale(1.0);
                opacity: 1;
                filter: brightness(2.0);
              }
              74% {
                transform: scale(1.5);
                opacity: 0.7;
              }
              80% {
                transform: scale(1.8);
                opacity: 0;
                filter: brightness(1.2);
              }
              100% {
                transform: scale(1.9);
                opacity: 0;
              }
            }
          }

          /* ========================================================= */
          /* MALE AVATAR SPRITE STYLES (DESKTOP md: AND ABOVE)         */
          /* Scale Factor: ~2.15x base (Idle 275x275)                   */
          /* ========================================================= */
          @media (min-width: 768px) {
            /* --- 1. Idle Animation Desktop --- */
            .male-idle-viewport {
              width: 275px;
              height: 275px;
            }
            .male-idle-sheet {
              width: 1925px; /* 275px * 7 frames */
              height: 275px;
              background-size: 1925px 275px;
            }

            /* --- 2. Normal Attack Desktop --- */
            /* Exact same scale factor as Idle Animation (275 / 128 = 2.1484375) */
            /* Offset dx = 142px (-142 * 2.1484375 = -305px) */
            .male-normal-attack-viewport {
              width: 1096px;
              height: 591px;
              transform: translateX(-305px);
            }
            .male-normal-attack-sheet {
              width: 12056px; /* 1096px * 11 frames */
              height: 591px;
              background-size: 12056px 591px;
            }

            /* --- Male Normal Attack Lunge (Desktop md:) --- */
            .animate-male-player-lunge {
              transform-origin: bottom left;
              animation-name: malePlayerLungeDesktop;
              animation-duration: 1.38s;
              animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
              animation-fill-mode: forwards;
            }
            @keyframes malePlayerLungeDesktop {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              28% {
                /* Frames 0-3: stationary at exact Idle stance and position */
                transform: translate(0px, 0px) scale(1);
              }
              28.01% {
                /* Frame 4 begins: scale(0.63) consistent with vertical offset */
                transform: translate(0px, -24px) scale(0.63);
              }
              42% {
                /* Frames 4-6: smoothly accelerates forward into dash closer to enemy */
                transform: translate(max(40px, calc(100cqw - 510px)), -24px) scale(0.63);
              }
              65% {
                /* Frames 7-8: executes explosive slash impact directly on enemy */
                transform: translate(max(40px, calc(100cqw - 510px)), -24px) scale(0.63);
              }
              76% {
                /* Frames 9-10: glides smoothly back across the arena at consistent scale(0.63) */
                transform: translate(calc(max(40px, calc(100cqw - 510px)) * 0.40), -24px) scale(0.63);
              }
              83% {
                /* Glides smoothly towards home spot at consistent scale(0.63) */
                transform: translate(calc(max(40px, calc(100cqw - 510px)) * 0.08), -24px) scale(0.63);
              }
              87% {
                /* Finishes cleanly at home spot at consistent scale(0.63) */
                transform: translate(0px, -24px) scale(0.63);
                animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
              }
              100% {
                /* Smoothly settles into Idle Stance home position and scale */
                transform: translate(0px, 0px) scale(1);
              }
            }

            /* --- 3. Heavy Attack Glint Desktop --- */
            .male-heavy-glint-container {
              transform: none !important;
            }
            .male-heavy-glint-during-blast {
              animation: maleHeavyGlintFadeOutDesktop 0.88s ease-out forwards;
            }
            @keyframes maleHeavyGlintFadeOutDesktop {
              0% { opacity: 1; }
              85% { opacity: 1; }
              100% { opacity: 0; }
            }
            .male-heavy-glint-viewport {
              width: 413px; /* 192px * 2.1484375 */
              height: 312px; /* 145px * 2.1484375 */
            }
            .male-heavy-glint-sheet {
              width: 7021px; /* 413px * 17 frames */
              height: 312px;
              background-size: 7021px 312px;
            }

            /* --- 4. Heavy Attack Blast Desktop --- */
            .male-heavy-blast-container {
              transform-origin: 82% 50%;
              animation: maleHeavyBlastFlightDesktop 0.75s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
            }
            .male-heavy-blast-viewport {
              width: 650px; /* 464 * 1.40 */
              height: 312px; /* 223 * 1.40 */
            }
            .male-heavy-blast-sheet {
              width: 8450px; /* 650px * 13 frames */
              height: 312px;
              background-size: 8450px 312px;
            }
            .male-heavy-blast-explosion {
              left: 533px;
              top: 156px;
              width: 190px;
              height: 190px;
              margin-left: -95px;
              margin-top: -95px;
              border-radius: 9999px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(251, 191, 36, 0.9) 35%, rgba(239, 68, 68, 0.75) 60%, transparent 80%);
              filter: drop-shadow(0 0 30px rgba(251, 191, 36, 1)) drop-shadow(0 0 55px rgba(239, 68, 68, 0.9));
              animation: maleHeavyBlastExplosionDesktop 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes maleHeavyBlastFlightDesktop {
              0% {
                transform: translate(140px, -40px) scale(0.65);
                opacity: 0;
                filter: brightness(1);
              }
              15% {
                transform: translate(160px, -40px) scale(1);
                opacity: 1;
                filter: brightness(1.1);
              }
              64% {
                /* Smoothly glides across arena directly to the enemy's body */
                transform: translate(calc(100cqw - 700px), -24px) scale(1.15);
                opacity: 1;
                filter: brightness(1.15);
              }
              67% {
                /* EXPLOSIVE IMPACT: Detonates directly ON the enemy's body */
                transform: translate(calc(100cqw - 700px), -24px) scale(1.45);
                opacity: 1;
                filter: brightness(2.0);
              }
              76% {
                /* Shockwave expands over the enemy and smoothly dissipates */
                transform: translate(calc(100cqw - 700px), -24px) scale(1.75);
                opacity: 0;
                filter: brightness(1.3);
              }
              100% {
                /* Remains completely invisible */
                transform: translate(calc(100cqw - 700px), -24px) scale(1.80);
                opacity: 0;
                filter: brightness(1);
              }
            }
            @keyframes maleHeavyBlastExplosionDesktop {
              0% {
                transform: scale(0.2);
                opacity: 0;
              }
              63% {
                transform: scale(0.3);
                opacity: 0;
              }
              67% {
                transform: scale(1.0);
                opacity: 1;
                filter: brightness(2.0);
              }
              74% {
                transform: scale(1.5);
                opacity: 0.7;
              }
              80% {
                transform: scale(1.8);
                opacity: 0;
                filter: brightness(1.2);
              }
              100% {
                transform: scale(1.9);
                opacity: 0;
              }
            }
          }
        `}</style>
      </div>
    );
  }


  // --- FEMALE AVATAR SPRITE SYSTEM ---
  // Dimensions and frame configuration:
  // Idle: 8 frames, 144x128
  // Normal Attack: 17 frames, 352x256
  // Heavy Glint: 14 frames, 224x193
  // Heavy Blast Projectile: 15 frames, 414x320

  return (

    <div
      className={cn(
        "relative z-10 w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-84 lg:h-84 shrink-0 transition-transform overflow-visible select-none",
        className
      )}
    >
      {/* 1. IDLE ANIMATION (Looping continuously when idle or during blast projectile flight) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 pointer-events-none",
          isNormalAttack
            ? "female-idle-during-attack"
            : isHeavyGlint
            ? "opacity-0 invisible"
            : isHeavyBlast
            ? "female-idle-heavy-blast"
            : "opacity-100 visible"
        )}
      >
        <div
          className="female-idle-viewport relative overflow-hidden filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
          style={{ imageRendering: "pixelated" }}
        >
          <div className="female-idle-sheet absolute top-0 left-0" />
        </div>
      </div>

      {/* 2. NORMAL ATTACK ANIMATION (17 frames, 352x256, plays on correct Normal Attack Card) */}
      {isNormalAttack && (
        <div className="female-normal-attack-container absolute bottom-0 left-0 pointer-events-none z-20">
          <div
            className="female-normal-attack-viewport relative overflow-hidden filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
            style={{ imageRendering: "pixelated" }}
          >
            <div className="female-normal-attack-sheet absolute top-0 left-0" />
          </div>
        </div>
      )}

      {/* 3. HEAVY ATTACK GLINT ANIMATION (14 frames, 398x193, plays in-place during charge & blast casting) */}
      {showHeavyGlint && (
        <div
          className={cn(
            "female-heavy-glint-container absolute bottom-0 left-0 pointer-events-none z-20",
            isHeavyBlast ? "female-heavy-glint-during-blast" : ""
          )}
        >
          <div
            className="female-heavy-glint-viewport relative overflow-hidden filter drop-shadow-[0_0_18px_rgba(245,158,11,0.6)] drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]"
            style={{ imageRendering: "pixelated" }}
          >
            <div
              className={cn(
                "female-heavy-glint-sheet absolute top-0 left-0",
                isHeavyBlast ? "female-heavy-glint-sheet-casting" : "female-heavy-glint-sheet-charge"
              )}
            />
          </div>
        </div>
      )}

      {/* 4. HEAVY ATTACK BLAST PROJECTILE (15 frames, 414x320, flies smoothly towards enemy) */}
      {isHeavyBlast && (
        <div className="female-heavy-blast-container absolute bottom-0 left-0 pointer-events-none z-40">
          <div
            className="female-heavy-blast-viewport relative overflow-hidden filter drop-shadow-[0_0_20px_rgba(245,158,11,0.95)] drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]"
            style={{ imageRendering: "pixelated" }}
          >
            <div className="female-heavy-blast-sheet absolute top-0 left-0" />
          </div>
        </div>
      )}

      {/* Player Hit Reaction Flash/Spark on Chest */}
      <HitEffectAnimator
        isActive={hitEffectTarget === "player"}
        triggerKey={hitEffectKey}
        scale={2.2}
        className="top-[45%] left-[52%]"
      />

      <style jsx global>{`
        /* ========================================================= */
        /* FEMALE AVATAR SPRITE STYLES (MOBILE / BASE VIEWPORT)      */
        /* Scale Factor: ~1.35x base (Idle 194x173)                   */
        /* ========================================================= */

        /* --- 1. Idle Animation (8 frames, 144x128) --- */
        .female-idle-viewport {
          width: 194px;
          height: 173px;
        }
        .female-idle-sheet {
          width: 1552px; /* 194px * 8 frames */
          height: 173px;
          background-image: url('/images/player/femaleCharacter_idleAnimation.png');
          background-repeat: no-repeat;
          background-size: 1552px 173px;
          animation: femaleIdleStep 0.9s steps(8) infinite;
        }
        @keyframes femaleIdleStep {
          from { transform: translateX(0px); }
          to { transform: translateX(-100%); }
        }

        /* --- 2. Normal Attack Animation (17 frames, 352x256) --- */
        /* Exact same scale factor as Idle Animation (173 / 128 = 1.3515625) */
        .female-normal-attack-viewport {
          width: 476px;
          height: 346px;
        }
        .female-normal-attack-sheet {
          width: 8092px; /* 476px * 17 frames */
          height: 346px;
          background-image: url('/images/player/femaleCharacter_normalAttackAnimation.png');
          background-repeat: no-repeat;
          background-size: 8092px 346px;
          animation: femaleNormalAttackStep 1.2s steps(17) 1 forwards;
        }
        @keyframes femaleNormalAttackStep {
          from { transform: translateX(0px); }
          to { transform: translateX(-100%); }
        }

        /* --- Normal Attack Crossfade Fadeout (Frames 1-17 100% visible, smoothly dissolves into Idle during return settle) --- */
        .female-normal-attack-container {
          animation: femaleAttackFadeOut 1.38s ease-out forwards;
        }
        @keyframes femaleAttackFadeOut {
          0% { opacity: 1; }
          86.9% { opacity: 1; }
          87% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* --- Idle Crossfade Fadein during Normal Attack Settle --- */
        .female-idle-during-attack {
          animation: femaleIdleFadeIn 1.38s ease-out forwards;
        }
        @keyframes femaleIdleFadeIn {
          0% { opacity: 0; }
          86.9% { opacity: 0; }
          87% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* --- Female Normal Attack Lunge (Mobile) --- */
        /* Frames 1-5 (0% to 25.6%): stationary at home spot, matching Idle position and size */
        /* Frames 6-17 (25.6% to 87%): lunges forward smoothly towards enemy, scale(0.63) consistent throughout, and returns */
        /* Settle (87% to 100%): smoothly settles into Idle stance home spot with seamless crossfade */
        .animate-female-player-lunge {
          transform-origin: bottom left;
          animation-name: femalePlayerLungeMobile;
          animation-duration: 1.38s;
          animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
          animation-fill-mode: forwards;
        }
        @keyframes femalePlayerLungeMobile {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          25.6% {
            /* Frames 1-5: stationary at exact Idle stance and position */
            transform: translate(0px, 0px) scale(1);
          }
          25.61% {
            /* Frame 6 begins: scale(0.63) consistent with vertical offset */
            transform: translate(0px, -16px) scale(0.63);
          }
          40% {
            /* Frames 6-8: smoothly accelerates forward into the dash closer to enemy */
            transform: translate(max(20px, calc(100cqw - 320px)), -16px) scale(0.63);
          }
          65% {
            /* Frames 9-13: executes slashes, jump dive and impact directly on enemy */
            transform: translate(max(20px, calc(100cqw - 320px)), -16px) scale(0.63);
          }
          76% {
            /* Frames 14-15: glides smoothly back across the arena at consistent scale(0.63) */
            transform: translate(calc(max(20px, calc(100cqw - 320px)) * 0.40), -16px) scale(0.63);
          }
          83% {
            /* Frame 16: glides smoothly towards home spot at consistent scale(0.63) */
            transform: translate(calc(max(20px, calc(100cqw - 320px)) * 0.08), -16px) scale(0.63);
          }
          87% {
            /* Frame 17: finishes cleanly at home spot at consistent scale(0.63) */
            transform: translate(0px, -16px) scale(0.63);
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          }
          100% {
            /* Smoothly settles into Idle Stance home position and scale */
            transform: translate(0px, 0px) scale(1);
          }
        }

        /* --- 3. Heavy Attack Glint Animation (14 frames, 398x193) --- */
        /* Exact same scale factor as Idle Animation (173 / 128 = 1.3515625) */
        /* Scaled to ~0.82x (~82% of Idle) so it is a little smaller size than Idle Animation */
        .female-heavy-glint-container {
          transform-origin: bottom left;
          transform: translate(-25px, 0) scale(0.82);
        }
        @media (max-width: 374px) {
          .female-heavy-glint-container {
            transform: translate(-25px, 0) scale(0.74);
          }
        }
        @media (min-width: 414px) and (max-width: 639px) {
          .female-heavy-glint-container {
            transform: translate(-25px, 0) scale(0.85);
          }
        }
        @media (min-width: 640px) and (max-width: 767px) {
          .female-heavy-glint-container {
            transform: translate(0px, 0px) scale(0.92);
          }
        }

        .female-heavy-glint-viewport {
          width: 538px; /* 398px * 1.3515625 */
          height: 261px; /* 193px * 1.3515625 */
        }
        .female-heavy-glint-sheet {
          width: 7532px; /* 538px * 14 frames */
          height: 261px;
          background-image: url('/images/player/femaleCharacter_heavyAttackGlintAnimation-1.png');
          background-repeat: no-repeat;
          background-size: 7532px 261px;
        }
        /* Phase 1 Charge: Plays frames 1 to 14 */
        .female-heavy-glint-sheet-charge {
          animation: femaleHeavyGlintStep 0.65s steps(14) 1 forwards;
        }
        /* Phase 2 Blast Casting: Actively pulses glint energy along extended blade (frames 8-14 loop) */
        .female-heavy-glint-sheet-casting {
          animation: femaleHeavyGlintLoop 0.35s steps(7) infinite;
        }
        /* Dissolves casting pose smoothly back into Idle after the blast detonates on mobile */
        .female-heavy-glint-during-blast {
          animation: femaleHeavyGlintFadeOutMobile 0.88s ease-out forwards;
        }
        /* Fades Idle smoothly back in after blast detonation settle */
        .female-idle-heavy-blast {
          animation: femaleIdleHeavyFadeIn 0.88s ease-out forwards;
        }
        @keyframes femaleHeavyGlintStep {
          from { transform: translateX(0px); }
          to { transform: translateX(-100%); }
        }
        @keyframes femaleHeavyGlintLoop {
          from { transform: translateX(-50%); }
          to { transform: translateX(-100%); }
        }
        @keyframes femaleHeavyGlintFadeOutMobile {
          0% {
            opacity: 1;
            transform: translate(-25px, 0) scale(0.82);
          }
          85% {
            opacity: 1;
            transform: translate(-25px, 0) scale(0.82);
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          }
          100% {
            opacity: 0;
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes femaleIdleHeavyFadeIn {
          0% { opacity: 0; }
          85% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* --- 4. Heavy Attack Blast Animation (15 frames, 414x320) --- */
        .female-heavy-blast-container {
          animation: femaleHeavyBlastFlightMobile 0.75s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
        }
        .female-heavy-blast-viewport {
          width: 269px; /* 414 * 0.65 */
          height: 208px; /* 320 * 0.65 */
        }
        .female-heavy-blast-sheet {
          width: 4035px; /* 269px * 15 frames */
          height: 208px;
          background-image: url('/images/player/femaleCharacter_heavyAttackBlastAnimation-2.png');
          background-repeat: no-repeat;
          background-size: 4035px 208px;
          animation: femaleHeavyBlastStep 0.75s steps(15) 1 forwards;
        }
        @keyframes femaleHeavyBlastStep {
          from { transform: translateX(0px); }
          to { transform: translateX(-100%); }
        }
        @keyframes femaleHeavyBlastFlightMobile {
          0% {
            /* Emerges directly at the tip of the charged sword */
            transform: translate(261px, -40px) scale(0.70);
            opacity: 0;
          }
          15% {
            /* Bursts into radiant flame energy at the sword tip */
            transform: translate(265px, -40px) scale(0.95);
            opacity: 1;
          }
          70% {
            /* Smoothly glides across arena to front of enemy */
            transform: translate(calc(100cqw - 180px), -24px) scale(1.10);
            opacity: 1;
          }
          85% {
            /* Explosive detonation pulse right on enemy front */
            transform: translate(calc(100cqw - 175px), -24px) scale(1.20);
            opacity: 1;
          }
          100% {
            /* Dissipates cleanly */
            transform: translate(calc(100cqw - 170px), -24px) scale(1.25);
            opacity: 0;
          }
        }

        /* Intermediate tablet breakpoint (640px to 767px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .female-heavy-blast-viewport {
            width: 290px;
            height: 224px;
          }
          .female-heavy-blast-sheet {
            width: 4350px;
            height: 224px;
            background-size: 4350px 224px;
          }
          .female-heavy-blast-container {
            animation: femaleHeavyBlastFlightTablet 0.75s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
          }
          @keyframes femaleHeavyBlastFlightTablet {
            0% {
              transform: translate(325px, -47px) scale(0.65);
              opacity: 0;
            }
            15% {
              transform: translate(330px, -47px) scale(0.95);
              opacity: 1;
            }
            70% {
              transform: translate(calc(100cqw - 270px), -16px) scale(1.15);
              opacity: 1;
            }
            85% {
              transform: translate(calc(100cqw - 260px), -16px) scale(1.25);
              opacity: 1;
            }
            100% {
              transform: translate(calc(100cqw - 250px), -16px) scale(1.30);
              opacity: 0;
            }
          }
        }

        /* ========================================================= */
        /* FEMALE AVATAR SPRITE STYLES (DESKTOP md: AND ABOVE)       */
        /* Scale Factor: ~2.15x base (Idle 310x275)                   */
        /* ========================================================= */
        @media (min-width: 768px) {
          /* --- 1. Idle Animation Desktop --- */
          .female-idle-viewport {
            width: 310px;
            height: 275px;
          }
          .female-idle-sheet {
            width: 2480px; /* 310px * 8 frames */
            height: 275px;
            background-size: 2480px 275px;
          }

          /* --- 2. Normal Attack Desktop --- */
          /* Exact same scale factor as Idle Animation (275 / 128 = 2.1484375) */
          .female-normal-attack-viewport {
            width: 756px;
            height: 550px;
          }
          .female-normal-attack-sheet {
            width: 12852px; /* 756px * 17 frames */
            height: 550px;
            background-size: 12852px 550px;
          }

          /* --- Female Normal Attack Lunge (Desktop md:) --- */
          /* Frames 1-5 (0% to 25.6%): stationary at home spot, matching Idle position and size */
          /* Frames 6-17 (25.6% to 87%): lunges forward smoothly towards enemy, scale(0.63) consistent throughout, and returns */
          /* Settle (87% to 100%): smoothly settles into Idle stance home spot with seamless crossfade */
          .animate-female-player-lunge {
            transform-origin: bottom left;
            animation-name: femalePlayerLungeDesktop;
            animation-duration: 1.38s;
            animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
            animation-fill-mode: forwards;
          }
          @keyframes femalePlayerLungeDesktop {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            25.6% {
              /* Frames 1-5: stationary at exact Idle stance and position */
              transform: translate(0px, 0px) scale(1);
            }
            25.61% {
              /* Frame 6 begins: scale(0.63) consistent with vertical offset */
              transform: translate(0px, -24px) scale(0.63);
            }
            40% {
              /* Frames 6-8: smoothly accelerates forward into the dash closer to enemy */
              transform: translate(max(40px, calc(100cqw - 510px)), -24px) scale(0.63);
            }
            65% {
              /* Frames 9-13: executes slashes, jump dive and impact directly on enemy */
              transform: translate(max(40px, calc(100cqw - 510px)), -24px) scale(0.63);
            }
            76% {
              /* Frames 14-15: glides smoothly back across the arena at consistent scale(0.63) */
              transform: translate(calc(max(40px, calc(100cqw - 510px)) * 0.40), -24px) scale(0.63);
            }
            83% {
              /* Frame 16: glides smoothly towards home spot at consistent scale(0.63) */
              transform: translate(calc(max(40px, calc(100cqw - 510px)) * 0.08), -24px) scale(0.63);
            }
            87% {
              /* Frame 17: finishes cleanly at home spot at consistent scale(0.63) */
              transform: translate(0px, -24px) scale(0.63);
              animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            }
            100% {
              /* Smoothly settles into Idle Stance home position and scale */
              transform: translate(0px, 0px) scale(1);
            }
          }

          /* --- 3. Heavy Attack Glint Desktop --- */
          /* Exact same scale factor as Idle Animation (275 / 128 = 2.1484375) */
          .female-heavy-glint-container {
            transform: none !important;
          }
          .female-heavy-glint-during-blast {
            animation: femaleHeavyGlintFadeOutDesktop 0.88s ease-out forwards;
          }
          @keyframes femaleHeavyGlintFadeOutDesktop {
            0% { opacity: 1; }
            85% { opacity: 1; }
            100% { opacity: 0; }
          }
          .female-heavy-glint-viewport {
            width: 855px; /* 398px * 2.1484375 */
            height: 415px; /* 193px * 2.1484375 */
          }
          .female-heavy-glint-sheet {
            width: 11970px; /* 855px * 14 frames */
            height: 415px;
            background-size: 11970px 415px;
          }

          /* --- 4. Heavy Attack Blast Desktop --- */
          .female-heavy-blast-container {
            animation: femaleHeavyBlastFlightDesktop 0.75s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
          }
          .female-heavy-blast-viewport {
            width: 580px; /* 414 * 1.40 */
            height: 448px; /* 320 * 1.40 */
          }
          .female-heavy-blast-sheet {
            width: 8700px; /* 580px * 15 frames */
            height: 448px;
            background-size: 8700px 448px;
          }
          @keyframes femaleHeavyBlastFlightDesktop {
            0% {
              /* Emerges directly at the tip of the charged sword */
              transform: translate(520px, -60px) scale(0.65);
              opacity: 0;
            }
            15% {
              /* Bursts into radiant flame energy at the sword tip */
              transform: translate(540px, -60px) scale(1);
              opacity: 1;
            }
            70% {
              /* Smoothly glides across arena to front of enemy */
              transform: translate(calc(100cqw - 420px), -30px) scale(1.2);
              opacity: 1;
            }
            85% {
              /* Explosive detonation pulse right on enemy front */
              transform: translate(calc(100cqw - 400px), -30px) scale(1.35);
              opacity: 1;
            }
            100% {
              /* Dissipates cleanly */
              transform: translate(calc(100cqw - 380px), -30px) scale(1.4);
              opacity: 0;
            }
          }
        }
      `}</style>
    </div>
  );
}
