"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface UndergroundSpikesAnimatorProps {
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

export function UndergroundSpikesAnimator({
  isActive,
  triggerKey,
  spriteUrl = "/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png",
  frames = 8,
  delayMs = 400,
  durationMs = 550,
  scale = 2.0,
  className,
  onComplete,
}: UndergroundSpikesAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      // Step 1: Wait for boss glint animation to finish (delayMs)
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delayMs);

      // Step 2: Stop spikes after durationMs
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
  }, [isActive, triggerKey, spriteUrl, delayMs, durationMs]);

  if (!isVisible || !spriteUrl) return null;

  const frameWidth = 128;
  const frameHeight = 128;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`spikes-${triggerKey}`}
      className={cn(
        "absolute pointer-events-none z-30 select-none flex items-center justify-center overflow-hidden",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
      }}
    >
      {/* 8-Frame Underground Spikes Eruption Spritesheet */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: `${totalWidth * scale}px`,
          height: `${frameHeight * scale}px`,
          backgroundImage: `url('${spriteUrl}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${totalWidth * scale}px ${frameHeight * scale}px`,
          imageRendering: "pixelated",
          filter: "drop-shadow(0 0 8px rgba(185, 28, 28, 0.8)) drop-shadow(0 0 16px rgba(0, 0, 0, 0.9))",
          animation: isAnimating
            ? `undergroundSpikesAnim ${durationMs / 1000}s steps(${frames}) 1 forwards`
            : "none",
        }}
      />

      <style jsx global>{`
        @keyframes undergroundSpikesAnim {
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
