"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HitEffectAnimatorProps {
  isActive: boolean;
  triggerKey?: number | string;
  className?: string;
  scale?: number;
  onComplete?: () => void;
}

export function HitEffectAnimator({
  isActive,
  triggerKey,
  className,
  scale = 1.6,
  onComplete,
}: HitEffectAnimatorProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (isActive) {
      setPlaying(true);
      const timer = setTimeout(() => {
        setPlaying(false);
        if (onComplete) onComplete();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setPlaying(false);
    }
  }, [isActive, triggerKey]);

  if (!playing) return null;

  return (
    <div
      key={`hit-${triggerKey}`}
      className={cn(
        "absolute pointer-events-none z-50 select-none flex items-center justify-center",
        className
      )}
      style={{
        width: 128,
        height: 128,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <div
        className="w-[128px] h-[128px] shrink-0 animate-hit-sprite"
        style={{
          backgroundImage: `url('/images/player/hitAnimation.png')`,
          backgroundSize: "640px 128px",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 1)) drop-shadow(0 0 20px rgba(239, 68, 68, 0.9))",
        }}
      />
    </div>
  );
}
