"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

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
  delayMs = 320,
  durationMs = 800,
  scale = 2.4,
  className,
  onComplete,
}: UndergroundBlastAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      setAnimId((prev) => prev + 1);
      // Warning glint plays first (delayMs), then blast erupts from below player
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delayMs);

      // Cleanly finish blast after durationMs
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
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
        "absolute pointer-events-none z-30 select-none flex items-center justify-center",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 16px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 28px rgba(245, 158, 11, 0.9))",
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
