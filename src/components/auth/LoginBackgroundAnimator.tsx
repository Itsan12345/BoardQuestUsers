"use client";

import React, { useEffect, useRef, useState } from "react";

interface LoginBackgroundAnimatorProps {
  className?: string;
  fps?: number; // base frame rate, defaults to 8.5 (approx 1.4s per 12-frame loop)
  enableSmoothing?: boolean; // smooth crossfade interpolation between frames
}

// Global in-memory cache so switching between /login, /signup, and /forgot-password
// never unloads or re-fetches the sprite image, eliminating transition glitches.
let globalLoadedImage: HTMLImageElement | null = null;

export function LoginBackgroundAnimator({
  className = "",
  fps = 8.5,
  enableSmoothing = true,
}: LoginBackgroundAnimatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (globalLoadedImage && globalLoadedImage.complete && globalLoadedImage.naturalWidth > 0) {
      imageRef.current = globalLoadedImage;
      setImageLoaded(true);
      return;
    }

    const img = new Image();
    img.src = "/images/login-signup/LoginSignUpScreenBoardquest.png";
    img.onload = () => {
      globalLoadedImage = img;
      imageRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (!imageLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    const totalFrames = 12;
    const frameWidth = 384;
    const frameHeight = 216;
    const frameDurationMs = 2000 / fps;
    const totalDurationMs = frameDurationMs * totalFrames;
    const startTime = performance.now();

    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = (currentTime: number) => {
      const img = imageRef.current || globalLoadedImage;
      if (!img || !canvas || !ctx) return;

      const elapsed = (currentTime - startTime) % totalDurationMs;
      const progress = elapsed / frameDurationMs; // e.g. 0.0 to 12.0
      const currentFrame = Math.floor(progress) % totalFrames;
      const nextFrame = (currentFrame + 1) % totalFrames;
      const blend = progress - Math.floor(progress); // 0.0 to 1.0

      const cW = canvas.width;
      const cH = canvas.height;

      // Fill canvas background with sky blue so no empty or dark edges appear
      ctx.fillStyle = "#70b6fd";
      ctx.fillRect(0, 0, cW, cH);

      const screenAspect = cW / cH;
      const frameAspect = frameWidth / frameHeight; // 384 / 216 = 1.7778 (16:9)

      let scale: number;
      let drawW: number;
      let drawH: number;
      let drawX = 0;
      let drawY = 0;

      if (screenAspect >= frameAspect) {
        // Landscape 16:9 or wider (desktop/laptop)
        // Maintain the current vertical scale (height = cH) and span the full canvas width (drawW = cW)
        // to cleanly eliminate any cut line, seam, or duplicate slice on the right edge.
        drawH = cH;
        drawW = cW;
        drawX = 0;
        drawY = 0;
      } else {
        // Tablet / Mobile portrait (narrower than 16:9)
        // Top-aligned so sword pommel is always fully visible at top-left
        scale = cW / frameWidth;
        drawW = cW;
        drawH = Math.max(cH, frameHeight * scale);
        drawX = 0;
        drawY = 0;
      }

      // Pixel art crisp rendering
      ctx.imageSmoothingEnabled = false;

      // Draw base frame
      ctx.globalAlpha = 1.0;
      ctx.drawImage(
        img,
        currentFrame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        drawX,
        drawY,
        drawW,
        drawH
      );

      // Smooth crossfade interpolation with next frame
      if (enableSmoothing && blend > 0.005) {
        ctx.globalAlpha = blend;
        ctx.drawImage(
          img,
          nextFrame * frameWidth,
          0,
          frameWidth,
          frameHeight,
          drawX,
          drawY,
          drawW,
          drawH
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Render immediately on mount so there is zero black or blank frame
    render(performance.now());

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [imageLoaded, fps, enableSmoothing]);

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#70b6fd] ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {/* Subtle atmospheric vignette overlay to frame the screen cleanly */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}
