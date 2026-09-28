"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { playLegalBeholderAttack, stopLegalBeholderAttack, preloadLegalBeholderSounds } from "@/lib/audio-manager";

interface JudicialHammerAnimatorProps {
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

export function JudicialHammerAnimator({
  isActive,
  spriteUrl = "/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png",
  frames = 11,
  delayMs = 220,
  durationMs = 620,
  scale = 2.6,
  className,
  onComplete,
}: JudicialHammerAnimatorProps) {
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

      // Step 1: Wait for boss warning glint animation to charge (delayMs), then hammer slams down
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
        // Play Legal Beholder normal attack hammer sound effect smoothly
        playLegalBeholderAttack('normal');
      }, delayMs);

      // Step 2: Smooth fade out right before completion
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + Math.max(100, durationMs - 120));

      // Step 3: Complete hammer animation and unmount cleanly
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        stopLegalBeholderAttack('normal', 250);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + 80);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(fadeTimer);
        clearTimeout(endTimer);
        stopLegalBeholderAttack('normal', 150);
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
      setIsFading(false);
      stopLegalBeholderAttack('normal', 150);
    }
  }, [isActive, spriteUrl, delayMs, durationMs]);

  if (!isVisible || !spriteUrl) return null;

  const frameWidth = 128;
  const frameHeight = 128;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`hammer-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-0 select-none flex items-center justify-center transition-opacity duration-200 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 16px rgba(255, 215, 0, 0.95)) drop-shadow(0 0 32px rgba(0, 0, 0, 0.95))",
      }}
    >
      {/* Inner Viewport to clip adjacent frames cleanly without clipping the outer drop-shadow glow */}
      <div className="w-full h-full relative overflow-hidden">
        {/* 11-Frame Judicial Hammer Spritesheet */}
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
              ? `judicialHammerAnim ${durationMs / 1000}s steps(${frames}) 1 forwards`
              : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes judicialHammerAnim {
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
