"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { playLegalBeholderAttack, stopLegalBeholderAttack, preloadLegalBeholderSounds } from "@/lib/audio-manager";

interface ParaffinBallsAnimatorProps {
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

export function ParaffinBallsAnimator({
  isActive,
  triggerKey,
  spriteUrl = "/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackBallsAnimation-2.png",
  frames = 12,
  delayMs = 240,
  durationMs = 820,
  scale = 2.0,
  className,
  onComplete,
}: ParaffinBallsAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);

  // Preload sound and spritesheet immediately
  useEffect(() => {
    preloadLegalBeholderSounds();
    if (spriteUrl && typeof window !== "undefined") {
      const img = new window.Image();
      img.src = spriteUrl;
    }
  }, [spriteUrl]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      setAnimId((prev) => prev + 1);
      setIsFading(false);

      // Step 1: Warning glint plays on the boss (delayMs), then paraffin balls materialize & swirl
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delayMs);

      // Step 2: Play Legal Beholder heavy attack sound effect right at the climax piercing impact frame (Frame 7, ~718ms)
      const sfxTimer = setTimeout(() => {
        playLegalBeholderAttack('heavy');
      }, delayMs + Math.floor(durationMs * (7 / 12)));

      // Step 3: Smooth fade out right before detonation ends
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + Math.max(100, durationMs - 140));

      // Step 4: Cleanly finish balls animation and decay audio
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        stopLegalBeholderAttack('heavy', 350);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + 80);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(sfxTimer);
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

  const frameWidth = 192;
  const frameHeight = 192;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`paraffin-balls-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-30 select-none flex items-center justify-center transition-opacity duration-200 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 20px rgba(180, 200, 240, 0.95)) drop-shadow(0 0 40px rgba(120, 160, 220, 0.75)) drop-shadow(0 0 50px rgba(0, 0, 0, 0.9))",
      }}
    >
      {/* Inner Viewport to clip adjacent frames cleanly without clipping outer glow */}
      <div className="w-full h-full relative overflow-hidden">
        {/* 12-Frame Paraffin Swirling Balls Explosion Spritesheet (192x192) */}
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
              ? `paraffinBallsAnim ${durationMs / 1000}s steps(${frames}) 1 forwards`
              : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes paraffinBallsAnim {
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
