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
            <div className="grid grid-cols-2 gap-4">
              {/* Male Character */}
              <button
                type="button"
                onClick={() => setAvatarGender('male')}
                className={cn(
                  "p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative group text-left",
                  avatarGender === 'male'
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-2 ring-primary/40"
                    : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
                )}
              >
                {avatarGender === 'male' && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-inner">
                  <div className="text-3xl sm:text-4xl">♂️</div>
                </div>
                <div className="text-center">
                  <div className="font-headline font-bold text-sm sm:text-base text-foreground">
                    Male
                  </div>
                </div>
              </button>

              {/* Female Character */}
              <button
                type="button"
                onClick={() => setAvatarGender('female')}
                className={cn(
                  "p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative group text-left",
                  avatarGender === 'female'
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-2 ring-primary/40"
                    : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
                )}
              >
                {avatarGender === 'female' && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-inner">
                  <div className="text-3xl sm:text-4xl">♀️</div>
                </div>
                <div className="text-center">
                  <div className="font-headline font-bold text-sm sm:text-base text-foreground">
                    Female
                  </div>
                </div>
              </button>
            </div>

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
