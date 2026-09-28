"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { playLegalBeholderAttack, stopLegalBeholderAttack, preloadLegalBeholderSounds } from "@/lib/audio-manager";

interface UndergroundBlastAnimatorProps {
  isActive: boolean;
  triggerKey?: number | string;
  spriteUrl?: string;
  frames?: number;
  delayMs?: number;
  durationMs?: number;
  scale?: number;
  className?: string;
  onComplete?: () => void;
}

export function UndergroundBlastAnimator({
  isActive,
  spriteUrl = "/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png",
  frames = 16,
  delayMs = 240,
  durationMs = 820,
  scale = 2.8,
  className,
  onComplete,
}: UndergroundBlastAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    preloadLegalBeholderSounds();
  }, []);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      setAnimId((prev) => prev + 1);
      setIsFading(false);

      // Warning glint plays first (delayMs), then blast erupts from below player
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
        // Play Legal Beholder heavy attack underground blast sound effect smoothly
        playLegalBeholderAttack('heavy');
      }, delayMs);

      // Smooth fade out right before eruption ends
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + Math.max(100, durationMs - 140));

      // Cleanly finish blast after durationMs
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        stopLegalBeholderAttack('heavy', 250);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + 80);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(fadeTimer);
        clearTimeout(endTimer);
        stopLegalBeholderAttack('heavy', 150);
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
      setIsFading(false);
      stopLegalBeholderAttack('heavy', 150);
    }
  }, [isActive, spriteUrl, delayMs, durationMs]);

  if (!isVisible || !spriteUrl) return null;

  const frameWidth = 160;
  const frameHeight = 160;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`blast-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-0 select-none flex items-center justify-center transition-opacity duration-200 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 20px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 36px rgba(245, 158, 11, 0.95))",
      }}
    >
      {/* Inner Viewport to clip adjacent frames without clipping the outer drop-shadow glow */}
      <div className="w-full h-full relative overflow-hidden">
        {/* 16-Frame Underground Blast Spritesheet (160x160 with clean padding) */}
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
              ? `undergroundBlastAnim ${durationMs / 1000}s steps(${frames}) 1 forwards`
              : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes undergroundBlastAnim {
          from {
            transform: translateX(0px);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
