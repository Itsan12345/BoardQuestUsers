"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface QuestArenaOnboardingModalProps {
  isOpen: boolean;
  initialName?: string;
  onComplete: (data: { nickname: string; avatarGender: 'male' | 'female'; dailyQuota: number }) => Promise<void>;
}

export function QuestArenaOnboardingModal({
  isOpen,
  initialName = '',
  onComplete,
}: QuestArenaOnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState(() => {
    const clean = initialName.trim();
    if (!clean || clean.toLowerCase() === 'aspirant') return '';
    const parts = clean.split(/\s+/);
    return parts[parts.length - 1].slice(0, 16);
  });
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [dailyQuota, setDailyQuota] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNextStep1 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (nickname.trim().length >= 2) {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComplete({
        nickname: nickname.trim() || 'Aspirant',
        avatarGender,
        dailyQuota,
      });
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quotaOptions = [
    { value: 20, label: '20 questions / day', badge: 'Casual' },
    { value: 50, label: '50 questions / day', badge: 'Standard (Recommended)', isRecommended: true },
    { value: 100, label: '100 questions / day', badge: 'Intense' },
    { value: 150, label: '150 questions / day', badge: 'Hardcore Sprint' },
  ];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Container Card */}
      <div className="relative w-full max-w-lg bg-card/95 border-2 border-primary/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Ambient Subtle Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Progress Indicator */}
        <div className="relative z-10 mb-6 space-y-3">
          {/* 3-Segment Progress Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step >= 1 ? "bg-primary shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-muted")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step >= 2 ? "bg-primary shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-muted")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step >= 3 ? "bg-primary shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-muted")} />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase font-mono">
            <span>STEP {step} OF 3</span>
            <span className="text-primary font-bytebounce text-sm">QUEST ARENA SETUP</span>
          </div>
        </div>

        {/* STEP 1: NICKNAME */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground font-headline tracking-tight">
                What should we call you?
              </h2>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                placeholder="Enter your display name"
                autoFocus
                maxLength={16}
                className="w-full h-12 sm:h-14 px-4 bg-muted/40 border-2 border-border focus:border-primary rounded-2xl text-base sm:text-lg font-bold text-foreground placeholder:text-muted-foreground/50 transition-all outline-none"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
                <span>3–16 characters</span>
                <span>{nickname.trim().length}/16</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={nickname.trim().length < 2}
              className="w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm sm:text-base tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* STEP 2: AVATAR GENDER */}
        {step === 2 && (
          <div className="relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground font-headline tracking-tight">
                Pick the avatar that suits you!
              </h2>
            </div>

            {/* Avatar Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Male Character */}
              <button
                type="button"
                onClick={() => setAvatarGender('male')}
                className={cn(
                  "p-0 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-end h-[155px] sm:h-[195px] transition-all duration-300 cursor-pointer relative group text-left overflow-hidden",
                  avatarGender === 'male'
                    ? "border-blue-500 bg-gradient-to-t from-blue-500/20 via-blue-500/5 to-transparent shadow-[0_0_24px_rgba(59,130,246,0.25)] ring-2 ring-blue-500/40"
                    : "border-border/60 bg-muted/15 hover:border-blue-400/50 hover:bg-muted/25"
                )}
              >
                {/* Gender Emoji Badge (replaces checkbox) */}
                <div
                  className={cn(
                    "absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-xs",
                    avatarGender === 'male'
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-300/50 scale-105"
                      : "bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/70 group-hover:scale-105 group-hover:border-blue-400/50 group-hover:text-blue-500"
                  )}
                  title="Male Avatar"
                >
                  <span className="text-sm sm:text-base leading-none select-none">♂️</span>
                </div>

                {/* Ambient Top Glow when selected */}
                {avatarGender === 'male' && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Avatar Preview Viewport - Repositioned flush at the bottom */}
                <div className="relative z-10 w-full flex items-end justify-center -mb-1">
                  <div
                    className="onboarding-avatar-male relative overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 origin-bottom"
                    style={{ imageRendering: 'pixelated' }}
                  >
                    <div className="absolute top-0 left-0 onboarding-avatar-male-sheet" />
                  </div>
                </div>
              </button>

              {/* Female Character */}
              <button
                type="button"
                onClick={() => setAvatarGender('female')}
                className={cn(
                  "p-0 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-end h-[155px] sm:h-[195px] transition-all duration-300 cursor-pointer relative group text-left overflow-hidden",
                  avatarGender === 'female'
                    ? "border-rose-500 bg-gradient-to-t from-rose-500/20 via-rose-500/5 to-transparent shadow-[0_0_24px_rgba(244,63,94,0.25)] ring-2 ring-rose-500/40"
                    : "border-border/60 bg-muted/15 hover:border-rose-400/50 hover:bg-muted/25"
                )}
              >
                {/* Gender Emoji Badge (replaces checkbox) */}
                <div
                  className={cn(
                    "absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-xs",
                    avatarGender === 'female'
                      ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] ring-2 ring-rose-300/50 scale-105"
                      : "bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/70 group-hover:scale-105 group-hover:border-rose-400/50 group-hover:text-rose-500"
                  )}
                  title="Female Avatar"
                >
                  <span className="text-sm sm:text-base leading-none select-none">♀️</span>
                </div>

                {/* Ambient Top Glow when selected */}
                {avatarGender === 'female' && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Avatar Preview Viewport - Repositioned flush at the bottom */}
                <div className="relative z-10 w-full flex items-end justify-center -mb-1">
                  <div
                    className="onboarding-avatar-female relative overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 origin-bottom"
                    style={{ imageRendering: 'pixelated' }}
                  >
                    <div className="absolute top-0 left-0 onboarding-avatar-female-sheet" />
                  </div>
                </div>
              </button>
            </div>

            <style jsx global>{`
              /* Male Onboarding Avatar Preview */
              .onboarding-avatar-male {
                width: 120px;
                height: 120px;
              }
              .onboarding-avatar-male-sheet {
                width: 840px; /* 120 * 7 */
                height: 120px;
                background-image: url('/images/player/maleCharacter_idleAnimation.png');
                background-repeat: no-repeat;
                background-size: 840px 120px;
                animation: maleOnboardingIdle 0.8s steps(7) infinite;
              }
              @media (min-width: 640px) {
                .onboarding-avatar-male {
                  width: 152px;
                  height: 152px;
                }
                .onboarding-avatar-male-sheet {
                  width: 1064px; /* 152 * 7 */
                  height: 152px;
                  background-size: 1064px 152px;
                }
              }

              /* Female Onboarding Avatar Preview */
              .onboarding-avatar-female {
                width: 135px;
                height: 120px;
              }
              .onboarding-avatar-female-sheet {
                width: 1080px; /* 135 * 8 */
                height: 120px;
                background-image: url('/images/player/femaleCharacter_idleAnimation.png');
                background-repeat: no-repeat;
                background-size: 1080px 120px;
                animation: femaleOnboardingIdle 0.9s steps(8) infinite;
              }
              @media (min-width: 640px) {
                .onboarding-avatar-female {
                  width: 171px;
                  height: 152px;
                }
                .onboarding-avatar-female-sheet {
                  width: 1368px; /* 171 * 8 */
                  height: 152px;
                  background-size: 1368px 152px;
                }
              }

              @keyframes maleOnboardingIdle {
                from { transform: translateX(0px); }
                to { transform: translateX(-100%); }
              }
              @keyframes femaleOnboardingIdle {
                from { transform: translateX(0px); }
                to { transform: translateX(-100%); }
              }
            `}</style>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 sm:h-14 px-5 rounded-2xl font-bold text-sm flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm sm:text-base tracking-wider transition-all shadow-[0_4px_16px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: DAILY STUDY GOAL */}
        {step === 3 && (
          <div className="relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground font-headline tracking-tight">
                What&apos;s your daily goal, <span className="text-primary">{nickname.trim() || 'Aspirant'}</span>?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                You can always change this later.
              </p>
            </div>

            {/* 4 Quota Options Cards */}
            <div className="space-y-2.5">
              {quotaOptions.map((opt) => {
                const isSelected = dailyQuota === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDailyQuota(opt.value)}
                    className={cn(
                      "w-full p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer text-left select-none",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-1 ring-primary/40 text-foreground"
                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-headline font-bold text-sm sm:text-base text-foreground">
                        {opt.label}
                      </span>
                    </div>

                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                      opt.isRecommended
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {opt.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep(2)}
                className="h-12 sm:h-14 px-5 rounded-2xl font-bold text-sm flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleComplete}
                className="flex-1 h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm sm:text-base tracking-wider transition-all shadow-[0_4px_16px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>I&apos;m Committed</span>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
