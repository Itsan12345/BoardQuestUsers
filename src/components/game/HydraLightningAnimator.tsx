"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { playHydraAttack, stopHydraAttack, preloadHydraSounds, playImmuneArchonAttack, preloadImmuneArchonSounds } from "@/lib/audio-manager";

interface HydraLightningAnimatorProps {
  isActive: boolean;
  triggerKey?: number | string;
  spriteUrl?: string;
  frames?: number;
  delayMs?: number;
  durationMs?: number;
  scale?: number;
  className?: string;
  onComplete?: () => void;
  soundType?: 'hydra' | 'archon';
}

export function HydraLightningAnimator({
  isActive,
  spriteUrl = "/images/bosses/immunohema_chapterThreeFinalBoss_heavyAttackLightningAnimation-2.png",
  frames = 12,
  delayMs = 250,
  durationMs = 720,
  scale = 2.6,
  className,
  onComplete,
  soundType = 'hydra',
}: HydraLightningAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    preloadHydraSounds();
    if (soundType === 'archon') {
      preloadImmuneArchonSounds();
    }
  }, [soundType]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      setAnimId((prev) => prev + 1);
      setIsFading(false);

      // Step 1: Warning glint animation plays first on the boss (delayMs), then lightning strikes
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
        if (soundType === 'archon') {
          // Play the Immune Archon heavy attack sound effect at 1.0x normal speed
          playImmuneArchonAttack('heavy');
        } else {
          // Play the heavy attack sound effect in x2 speed smoothly when lightning animation is playing
          playHydraAttack('heavy');
        }
      }, delayMs);

      // Step 2: Smooth fade out after all frames have rendered completely
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + (soundType === 'archon' ? durationMs : Math.max(100, durationMs - 120)));

      // Step 3: Cleanly finish, smooth fade, and unmount
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        if (soundType !== 'archon') {
          stopHydraAttack('heavy', 350);
        }
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + (soundType === 'archon' ? 260 : 60));

      return () => {
        clearTimeout(startTimer);
        clearTimeout(fadeTimer);
        clearTimeout(endTimer);
        if (soundType !== 'archon') {
          stopHydraAttack('heavy', 200);
        }
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
      setIsFading(false);
      if (soundType !== 'archon') {
        stopHydraAttack('heavy', 200);
      }
    }
  }, [isActive, spriteUrl, delayMs, durationMs, soundType]);

  if (!isVisible || !spriteUrl) return null;

  const frameWidth = 145;
  const frameHeight = 145;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`hydra-lightning-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-20 select-none flex items-center justify-center transition-opacity duration-200 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 16px rgba(56, 189, 248, 0.95)) drop-shadow(0 0 32px rgba(168, 85, 247, 0.85)) drop-shadow(0 0 48px rgba(255, 255, 255, 0.7))",
      }}
    >
      {/* Inner Viewport to clip adjacent frames cleanly */}
      <div className="w-full h-full relative overflow-hidden">
        {/* 12-Frame Heavy Attack Lightning Spritesheet */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: `${totalWidth * scale}px`,
            height: `${frameHeight * scale}px`,
            backgroundImage: `url('${spriteUrl}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${totalWidth * scale}px ${frameHeight * scale}px`,
            imageRendering: "pixelated",
            animation: isAnimating
              ? `hydraLightningAnim ${durationMs / 1000}s steps(${frames - 1}) 1 forwards`
              : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes hydraLightningAnim {
          0% {
            transform: translateX(0px);
          }
          100% {
            transform: translateX(calc(-100% + 100% / ${frames}));
          }
        }
      `}</style>
    </div>
  );
}
