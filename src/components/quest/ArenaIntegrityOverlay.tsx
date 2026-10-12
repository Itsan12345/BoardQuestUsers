"use client";

import React from 'react';
import { ShieldAlert, Maximize2, EyeOff, Lock, Database, ShieldCheck, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ArenaIntegrityOverlayProps {
  isShieldActive: boolean;
  shieldReason: 'blur' | 'printscreen' | 'fullscreen_exit' | null;
  isWarningModalOpen: boolean;
  modalReason: 'blur' | 'printscreen' | 'fullscreen_exit' | 'copy_attempt';
  strikes: number;
  maxStrikes?: number;
  onDismissWarning: () => void;
  onForfeit?: () => void;
}

export function ArenaIntegrityOverlay({
  isShieldActive,
  shieldReason,
  isWarningModalOpen,
  modalReason,
  strikes,
  maxStrikes = 3,
  onDismissWarning,
  onForfeit,
}: ArenaIntegrityOverlayProps) {
  // If neither shield nor modal is active, do not render
  if (!isShieldActive && !isWarningModalOpen) {
    return null;
  }

  const isCritical = strikes >= maxStrikes;

  // Determine simple modal text based on the detected incident
  let title = "TAB SWITCH DETECTED";
  let explanation = "Please stay on this quiz tab. Switching tabs or opening other windows is not allowed.";
  let actionLabel = "Resume Quiz";

  if (modalReason === 'printscreen') {
    title = "SCREENSHOT DETECTED";
    explanation = "Taking screenshots during the quiz is not allowed. Please continue answering without taking captures.";
    actionLabel = "Resume Quiz";
  } else if (modalReason === 'fullscreen_exit') {
    title = "FULLSCREEN EXITED";
    explanation = "Full-screen mode is required during the quiz to prevent distractions and cheating.";
    actionLabel = "Return to Fullscreen";
  } else if (modalReason === 'copy_attempt') {
    title = "COPYING NOT ALLOWED";
    explanation = "Copying or selecting quiz questions and answers is not allowed.";
    actionLabel = "Resume Quiz";
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Exam Security Alert"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-y-auto p-4 sm:p-6"
    >
      {/* Background Retro Grid & CRT Scanlines */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-colors duration-500",
        isCritical
          ? "bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.35)_0%,_rgba(0,0,0,0.98)_80%)]"
          : "bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.22)_0%,_rgba(0,0,0,0.98)_75%)]"
      )} />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.5)_0px,rgba(0,0,0,0.5)_2px,transparent_2px,transparent_4px)] pointer-events-none opacity-65" />

      {/* Case A: Interactive Warning Modal (Student acknowledges and returns) */}
      {isWarningModalOpen ? (
        <div className={cn(
          "relative z-10 w-full max-w-lg sm:max-w-xl border-4 bg-neutral-950/98 p-5 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl box-border overflow-hidden",
          isCritical
            ? "border-red-600/90 shadow-[0_0_50px_rgba(239,68,68,0.45)]"
            : "border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.35)]"
        )}>
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-mono text-[9.5px] sm:text-[11px] uppercase tracking-widest font-black",
              isCritical
                ? "border-red-500/60 bg-red-950/60 text-red-300"
                : "border-amber-500/60 bg-amber-950/60 text-amber-300"
            )}>
              <ShieldAlert className="w-3 h-3 animate-pulse" />
              Exam Rules Notice
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-blue-500/50 bg-blue-950/50 text-blue-300 font-mono text-[9px] sm:text-[10.5px] uppercase tracking-wider font-bold">
              <Database className="w-2.5 h-2.5" />
              Activity Logged
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-1 sm:space-y-2">
            <h2 className={cn(
              "font-bytebounce text-3xl sm:text-5xl uppercase tracking-wider leading-tight",
              isCritical ? "text-red-500 drop-shadow-[0_2px_12px_rgba(239,68,68,0.6)]" : "text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]"
            )}>
              {title}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
              {explanation}
            </p>
          </div>

          {/* Strike Indicators */}
          <div className={cn(
            "p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-2",
            isCritical ? "border-red-600/40 bg-red-950/40" : "border-amber-600/30 bg-amber-950/30"
          )}>
            <div className="flex items-center gap-2">
              {Array.from({ length: maxStrikes }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all flex items-center justify-center font-mono text-[10px] sm:text-xs font-black",
                    i < strikes
                      ? isCritical
                        ? "bg-red-500 border-red-300 text-black shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-110"
                        : "bg-amber-500 border-amber-300 text-black shadow-[0_0_10px_rgba(245,158,11,0.8)] scale-105"
                      : "bg-black/70 border-zinc-700 text-zinc-600"
                  )}
                >
                  {i < strikes ? '!' : i + 1}
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className={cn(
                "font-mono text-xs sm:text-sm font-black uppercase tracking-wider",
                isCritical ? "text-red-400" : "text-amber-300"
              )}>
                {isCritical
                  ? "MAX WARNINGS REACHED"
                  : `Warning ${strikes} of ${maxStrikes}`}
              </span>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-sans mt-0.5">
                {isCritical
                  ? "This attempt has been reported to your instructor for review."
                  : "Please stay on this page until you finish all questions."}
              </p>
            </div>
          </div>

          {/* Action Buttons: Responsive & Fully Contained */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5 sm:gap-3 pt-2 w-full">
            <Button
              type="button"
              onClick={onDismissWarning}
              className={cn(
                "flex-1 min-w-0 font-bytebounce text-xs sm:text-sm uppercase tracking-wider font-black border-2 h-11 sm:h-12 active:scale-95 transition-transform flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl shadow-lg",
                isCritical
                  ? "bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
              )}
            >
              {modalReason === 'fullscreen_exit' ? (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              )}
              <span className="truncate">{actionLabel}</span>
            </Button>

            {onForfeit && isCritical && (
              <Button
                type="button"
                variant="outline"
                onClick={onForfeit}
                className="w-full sm:w-auto shrink-0 font-bytebounce text-xs sm:text-sm uppercase tracking-wider border-2 border-red-500/50 text-red-400 hover:bg-red-950/60 hover:text-red-300 h-11 sm:h-12 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Skull className="w-4 h-4 shrink-0" />
                <span>Leave Quiz</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Case B: Real-Time Focus Shield (while window is currently blurred in background) */
        <div className="relative z-10 w-full max-w-md border-2 border-amber-600/70 bg-neutral-950/95 p-6 sm:p-8 rounded-2xl text-center space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.35)] animate-in zoom-in-95 duration-150 box-border">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
            {shieldReason === 'printscreen' ? (
              <EyeOff className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
          </div>

          <div className="space-y-1.5">
            <Badge variant="outline" className="border-amber-500/50 bg-amber-950/50 text-amber-300 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-black">
              {shieldReason === 'printscreen' ? 'SCREEN HIDDEN' : 'QUIZ PAUSED'}
            </Badge>
            <h3 className="font-bytebounce text-2xl sm:text-4xl uppercase tracking-wider text-amber-400">
              {shieldReason === 'printscreen' ? 'SCREENSHOT BLOCKED' : 'WINDOW INACTIVE'}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {shieldReason === 'printscreen'
                ? "Screenshot detected. The quiz screen is hidden to protect question content."
                : "The quiz is hidden while this window is inactive. Click anywhere here to resume."}
            </p>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest pt-2">
            Click anywhere on screen to resume
          </div>
        </div>
      )}
    </div>
  );
}
