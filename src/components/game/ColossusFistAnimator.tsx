"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ColossusFistAnimatorProps {
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

export function ColossusFistAnimator({
  isActive,
  triggerKey,
  spriteUrl = "/images/bosses/hematology_chapterOneBoss_heavyAttackFistAnimation-2.png",
  frames = 9,
  delayMs = 220,
  durationMs = 720,
  scale = 2.5,
  className,
  onComplete,
}: ColossusFistAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);

  // Preload spritesheet immediately
  useEffect(() => {
    if (spriteUrl && typeof window !== 'undefined') {
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

      // Step 1: Wait for boss warning glint animation to charge (delayMs), then giant blood fist crushes downward
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delayMs);

      // Step 2: Smooth fade out right before completion
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + Math.max(100, durationMs - 120));

      // Step 3: Complete fist animation and unmount cleanly
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + 80);

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
  const frameHeight = 211;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`colossus-fist-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-30 select-none flex items-center justify-center transition-opacity duration-200 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 24px rgba(220, 38, 38, 0.95)) drop-shadow(0 0 45px rgba(185, 28, 28, 0.85)) drop-shadow(0 0 60px rgba(0, 0, 0, 0.9))",
      }}
    >
      {/* Inner Viewport to clip adjacent frames cleanly without clipping outer glow */}
      <div className="w-full h-full relative overflow-hidden">
        {/* 9-Frame Giant Fist Spritesheet */}
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
              ? `colossusFistAnim ${durationMs / 1000}s steps(${frames}) 1 forwards`
              : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes colossusFistAnim {
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
