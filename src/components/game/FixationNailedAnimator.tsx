"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface FixationNailedAnimatorProps {
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

export function FixationNailedAnimator({
  isActive,
  triggerKey,
  spriteUrl = "/images/bosses/hispatho_chapterOneBoss_heavtAttackNailedAnimation-2.png",
  frames = 15,
  delayMs = 240,
  durationMs = 820,
  scale = 2.0,
  className,
  onComplete,
}: FixationNailedAnimatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [animId, setAnimId] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload LegalBeholderHeavyAttack.mp3 and spritesheet immediately
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new window.Audio("/SoundEffects/LegalBeholderHeavyAttack.mp3");
      audio.preload = "auto";
      audioRef.current = audio;
      if (spriteUrl) {
        const img = new window.Image();
        img.src = spriteUrl;
      }
    }
  }, [spriteUrl]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isActive && spriteUrl) {
      setAnimId((prev) => prev + 1);
      setIsFading(false);

      // Step 1: Warning glint plays on the boss (delayMs), then fixation needles descend & lock on
      const startTimer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delayMs);

      // Step 2: Trigger LegalBeholderHeavyAttack.mp3 sound effect right at the climax piercing impact frame (Frame 7, ~688ms)
      const sfxTimer = setTimeout(() => {
        try {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1.0;
            audioRef.current.play().catch((err) => {
              console.warn("Fixation nailed LegalBeholderHeavyAttack play error:", err);
            });
          } else {
            const fallbackAudio = new window.Audio("/SoundEffects/LegalBeholderHeavyAttack.mp3");
            fallbackAudio.volume = 1.0;
            fallbackAudio.play().catch(() => {});
          }
        } catch (e) {
          console.warn("Fixation nailed audio error:", e);
        }
      }, delayMs + Math.floor(durationMs * (7 / 15)));

      // Step 3: Hold the final impaled pose (Frame 14) so the full animation finishes, then smooth fade out
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, delayMs + durationMs + 60);

      // Step 4: Cleanly finish animation, unmount and conclude
      const endTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        setIsFading(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }, delayMs + durationMs + 280);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(sfxTimer);
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

  const frameWidth = 256;
  const frameHeight = 128;
  const totalWidth = frameWidth * frames;

  return (
    <div
      key={`fixation-nailed-anim-${animId}`}
      className={cn(
        "absolute pointer-events-none z-40 select-none flex items-center justify-center transition-opacity duration-250 ease-out",
        isFading ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        filter:
          "drop-shadow(0 0 22px rgba(220, 38, 38, 0.95)) drop-shadow(0 0 40px rgba(185, 28, 28, 0.75)) drop-shadow(0 0 50px rgba(0, 0, 0, 0.9))",
      }}
    >
      {/* Inner Viewport to clip adjacent frames cleanly without clipping outer glow */}
      <div className="w-full h-full relative overflow-hidden">
        {/* 15-Frame Fixation Nailed Spritesheet (256x128) */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: `${totalWidth * scale}px`,
            height: `${frameHeight * scale}px`,
            backgroundImage: `url('${spriteUrl}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${totalWidth * scale}px ${frameHeight * scale}px`,
            imageRendering: "pixelated",
            animationName: isAnimating ? "fixationNailedAnim" : "none",
            animationDuration: `${durationMs / 1000}s`,
            animationTimingFunction: "step-end",
            animationIterationCount: 1,
            animationFillMode: "forwards",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes fixationNailedAnim {
          0.00% { transform: translateX(calc(-0 * 100% / 15)); }
          6.67% { transform: translateX(calc(-1 * 100% / 15)); }
          13.33% { transform: translateX(calc(-2 * 100% / 15)); }
          20.00% { transform: translateX(calc(-3 * 100% / 15)); }
          26.67% { transform: translateX(calc(-4 * 100% / 15)); }
          33.33% { transform: translateX(calc(-5 * 100% / 15)); }
          40.00% { transform: translateX(calc(-6 * 100% / 15)); }
          46.67% { transform: translateX(calc(-7 * 100% / 15)); }
          53.33% { transform: translateX(calc(-8 * 100% / 15)); }
          60.00% { transform: translateX(calc(-9 * 100% / 15)); }
          66.67% { transform: translateX(calc(-10 * 100% / 15)); }
          73.33% { transform: translateX(calc(-11 * 100% / 15)); }
          80.00% { transform: translateX(calc(-12 * 100% / 15)); }
          86.67% { transform: translateX(calc(-13 * 100% / 15)); }
          93.33% { transform: translateX(calc(-14 * 100% / 15)); }
          100.00% { transform: translateX(calc(-14 * 100% / 15)); }
        }
      `}</style>
    </div>
  );
}
