"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnemiaSlashAnimatorProps {
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

export function AnemiaSlashAnimator({
  isActive,
  spriteUrl = "/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_SlashAnimation.png",
  frames = 15,
  delayMs = 680,
  durationMs = 820,
  scale = 2.6,
  className,
  onComplete,
}: AnemiaSlashAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      setAnimId((prev) => prev + 1);
      setIsFading(false);

      // Dash animation plays first on Anemia Shade (delayMs), then slash executes in Player's body
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delayMs);

      // Smooth fade out right before slash dissipates
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + Math.max(100, durationMs - 140));

      // Cleanly finish slash after durationMs
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + 60);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(fadeTimer);
        clearTimeout(endTimer);
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
      setIsFading(false);
    }
  }, [isActive, spriteUrl, delayMs, durationMs]);

  if (!isVisible || !spriteUrl) return null;

  const frameWidth = 128;
  const frameHeight = 128;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`anemia-slash-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-30 select-none flex items-center justify-center transition-opacity duration-150 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 20px rgba(220, 38, 38, 0.95)) drop-shadow(0 0 36px rgba(185, 28, 28, 0.85))",
      }}
    >
      {/* Viewport for 15-frame blood slash animation */}
      <div className="w-full h-full relative overflow-hidden">
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
              ? `anemiaSlashAnim ${durationMs / 1000}s steps(${frames}) 1 forwards`
              : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes anemiaSlashAnim {
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
