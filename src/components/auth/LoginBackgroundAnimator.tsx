"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface LoginBackgroundAnimatorProps {
  className?: string;
  fps?: number; // base frame rate, defaults to 8.5 (approx 2.8s per 12-frame loop)
  enableSmoothing?: boolean; // smooth crossfade interpolation between frames
}

// Global in-memory cache so switching between /login, /signup, and /forgot-password
// never unloads or re-fetches the sprite images, eliminating transition glitches.
let globalLoadedLightImage: HTMLImageElement | null = null;
let globalLoadedDarkImage: HTMLImageElement | null = null;
let globalAnimationStartTime: number | null = null;

export function LoginBackgroundAnimator({
  className = "",
  fps = 8.5,
  enableSmoothing = true,
}: LoginBackgroundAnimatorProps) {
  const { resolvedTheme, theme } = useTheme();

  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const darkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imagesReady, setImagesReady] = useState(false);
  const lightImageRef = useRef<HTMLImageElement | null>(null);
  const darkImageRef = useRef<HTMLImageElement | null>(null);

  // Theme resolution: track if dark mode is active
  const [isDark, setIsDark] = useState(false);
  // Only enable CSS transitions after initial mount so there is no flash on page load
  const [enableTransition, setEnableTransition] = useState(false);

  // Sync dark mode state with next-themes, <html> class, and system preferences
  useEffect(() => {
    const determineIsDark = () => {
      if (typeof document !== "undefined") {
        if (document.documentElement.classList.contains("dark")) {
          return true;
        }
      }
      if (resolvedTheme === "dark") return true;
      if (resolvedTheme === "light") return false;
      if (theme === "dark") return true;
      if (theme === "light") return false;
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return false;
    };

    // Set initial state immediately
    const initialDark = determineIsDark();
    setIsDark(initialDark);

    // Enable smooth transitions after a brief tick so initial render doesn't animate
    const timer = setTimeout(() => {
      setEnableTransition(true);
    }, 120);

    // Watch for class changes on document.documentElement (toggled by ThemeToggle)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Also listen for system OS dark mode changes if using system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (theme === "system" || !theme) {
        setIsDark(e.matches || document.documentElement.classList.contains("dark"));
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [resolvedTheme, theme]);

  // Preload and cache both light and dark sprite sheets
  useEffect(() => {
    let isMounted = true;

    const checkReady = () => {
      if (
        lightImageRef.current?.complete &&
        darkImageRef.current?.complete &&
        isMounted
      ) {
        setImagesReady(true);
      }
    };

    // Light sprite
    if (globalLoadedLightImage && globalLoadedLightImage.complete) {
      lightImageRef.current = globalLoadedLightImage;
    } else {
      const lightImg = new Image();
      lightImg.src = "/images/login-signup/LoginSignUpScreenBoardquest.png";
      lightImg.onload = () => {
        globalLoadedLightImage = lightImg;
        if (isMounted) {
          lightImageRef.current = lightImg;
          checkReady();
        }
      };
    }

    // Dark sprite
    if (globalLoadedDarkImage && globalLoadedDarkImage.complete) {
      darkImageRef.current = globalLoadedDarkImage;
    } else {
      const darkImg = new Image();
      darkImg.src = "/images/login-signup/LoginSignUpScreenBoardquestDarkMode.png";
      darkImg.onload = () => {
        globalLoadedDarkImage = darkImg;
        if (isMounted) {
          darkImageRef.current = darkImg;
          checkReady();
        }
      };
    }

    if (
      lightImageRef.current?.complete &&
      darkImageRef.current?.complete
    ) {
      setImagesReady(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Shared synchronized rendering loop for both light and dark canvases
  useEffect(() => {
    if (!imagesReady) return;

    const lightCanvas = lightCanvasRef.current;
    const darkCanvas = darkCanvasRef.current;
    if (!lightCanvas || !darkCanvas) return;

    const lightCtx = lightCanvas.getContext("2d", { alpha: false });
    const darkCtx = darkCanvas.getContext("2d", { alpha: false });
    if (!lightCtx || !darkCtx) return;

    let animationFrameId: number;
    const totalFrames = 12;
    const frameWidth = 384;
    const frameHeight = 216;
    const frameDurationMs = 2000 / fps;
    const totalDurationMs = frameDurationMs * totalFrames;

    // Use global start time so switching between /login, /signup, /forgot-password
    // keeps the animation continuous without jumping back to frame 0
    if (globalAnimationStartTime === null) {
      globalAnimationStartTime = performance.now();
    }
    const startTime = globalAnimationStartTime;

    const resizeCanvases = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (lightCanvas) {
        const rect = lightCanvas.getBoundingClientRect();
        lightCanvas.width = Math.floor(rect.width * dpr);
        lightCanvas.height = Math.floor(rect.height * dpr);
      }
      if (darkCanvas) {
        const rect = darkCanvas.getBoundingClientRect();
        darkCanvas.width = Math.floor(rect.width * dpr);
        darkCanvas.height = Math.floor(rect.height * dpr);
      }
    };

    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);

    // Draw single canvas frame helper
    const renderFrame = (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      bgColor: string,
      currentFrame: number,
      nextFrame: number,
      blend: number
    ) => {
      const cW = canvas.width;
      const cH = canvas.height;
      if (cW === 0 || cH === 0) return;

      // Base solid background fill matching the theme sky
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cW, cH);

      const screenAspect = cW / cH;
      const frameAspect = frameWidth / frameHeight;

      let drawW: number;
      let drawH: number;
      let drawX = 0;
      let drawY = 0;

      if (screenAspect >= frameAspect) {
        // Landscape 16:9 or wider (desktop/laptop)
        // Maintain vertical scale (height = cH) and span the full canvas width
        drawH = cH;
        drawW = cW;
        drawX = 0;
        drawY = 0;
      } else {
        // Mobile portrait (narrower than 16:9)
        // Top-aligned so sword pommel remains visible at top-left
        const scale = cW / frameWidth;
        drawW = cW;
        drawH = Math.max(cH, frameHeight * scale);
        drawX = 0;
        drawY = 0;
      }

      ctx.imageSmoothingEnabled = false;

      // Draw base current frame
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
    };

    const render = (currentTime: number) => {
      const lightImg = lightImageRef.current || globalLoadedLightImage;
      const darkImg = darkImageRef.current || globalLoadedDarkImage;
      if (!lightImg || !darkImg) return;

      const elapsed = (currentTime - startTime) % totalDurationMs;
      const progress = elapsed / frameDurationMs;
      const currentFrame = Math.floor(progress) % totalFrames;
      const nextFrame = (currentFrame + 1) % totalFrames;
      const blend = progress - Math.floor(progress);

      // Render Light Mode Canvas
      renderFrame(
        lightCanvas,
        lightCtx,
        lightImg,
        "#70b6fd",
        currentFrame,
        nextFrame,
        blend
      );

      // Render Dark Mode Canvas
      renderFrame(
        darkCanvas,
        darkCtx,
        darkImg,
        "#2e337e",
        currentFrame,
        nextFrame,
        blend
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => {
      window.removeEventListener("resize", resizeCanvases);
      cancelAnimationFrame(animationFrameId);
    };
  }, [imagesReady, fps, enableSmoothing]);

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 ${
        enableTransition ? "transition-colors duration-700 ease-in-out" : ""
      } ${isDark ? "bg-[#2e337e]" : "bg-[#70b6fd]"} ${className}`}
    >
      {/* Light Mode Canvas Layer */}
      <canvas
        ref={lightCanvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Dark Mode Canvas Layer with smooth GPU-accelerated crossfade */}
      <canvas
        ref={darkCanvasRef}
        className={`absolute inset-0 w-full h-full block ${
          enableTransition ? "transition-opacity duration-700 ease-in-out" : ""
        }`}
        style={{ opacity: isDark ? 1 : 0 }}
      />

      {/* Subtle atmospheric vignette overlay to frame the screen cleanly */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          enableTransition ? "transition-opacity duration-700 ease-in-out" : ""
        } ${
          isDark
            ? "bg-radial-gradient from-transparent via-transparent to-black/35"
            : "bg-radial-gradient from-transparent via-transparent to-black/20"
        }`}
      />
    </div>
  );
}
