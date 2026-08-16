"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Zap,
  Sparkles,
  Award,
  ShieldCheck,
  Star,
  Trophy,
  CheckCircle2,
  Lock,
  Clock,
  ChevronRight,
  Gift
} from 'lucide-react';
import {
  type DailyLoginStatusData,
  getStreakTierInfo,
} from '@/lib/daily-login-config';
import { claimDailyLoginRewardAction } from '@/app/actions/daily-login';
import { playSfx } from '@/lib/audio-manager';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DailyLoginRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusData: DailyLoginStatusData | null;
  onRewardClaimed?: () => void;
}

const ICONS = [Zap, Flame, Sparkles, Award, ShieldCheck, Star, Trophy];

export function DailyLoginRewardModal({
  open,
  onOpenChange,
  statusData,
  onRewardClaimed,
}: DailyLoginRewardModalProps) {
  const { toast } = useToast();
  const [claiming, setClaiming] = useState(false);
  const [optimisticClaimed, setOptimisticClaimed] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  // Live countdown to midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!statusData) return null;

  const currentStreak = statusData.currentStreak || 0;
  const cycleDay = statusData.currentCycleDay || 1;
  const hasClaimedToday = statusData.hasClaimedToday || optimisticClaimed;
  const todayReward = statusData.todayReward;
  const streakInfo = getStreakTierInfo(currentStreak);

  const handleClaimReward = async () => {
    if (claiming || hasClaimedToday) return;

    // Instant optimistic response (0ms perceived latency)
    setOptimisticClaimed(true);
    playSfx('correct');
    toast({
      title: 'Daily Attendance Recorded',
      description: `+${todayReward?.xp || 50} XP credited to your account. Current streak: ${currentStreak || 1} days.`,
    });

    setClaiming(true);
    try {
      const res = await claimDailyLoginRewardAction();
      if (res.success && res.reward) {
        window.dispatchEvent(new Event('bq_stats_updated'));
        window.dispatchEvent(new Event('bq_daily_login_updated'));

        if (onRewardClaimed) {
          onRewardClaimed();
        }
      } else {
        setOptimisticClaimed(false);
        toast({
          title: 'Notice',
          description: res.error || 'Reward already claimed for today.',
        });
      }
    } catch (err) {
      setOptimisticClaimed(false);
      toast({
        title: 'Error',
        description: 'Failed to record daily check-in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl w-[92vw] sm:w-[95vw] max-h-[90vh] overflow-y-auto lg:overflow-hidden overflow-x-hidden p-0 border border-border/90 bg-card shadow-2xl rounded-2xl sm:rounded-3xl gap-0">
        {/* Compact, Refined Header - Responsive */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-border/80 bg-gradient-to-r from-muted/40 via-background to-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[10.5px] font-bold text-primary uppercase tracking-widest">
                  Daily Attendance & Licensure Streak
                </span>
                <Badge variant="outline" className={cn("text-[9px] sm:text-[9.5px] font-semibold px-2 py-0 border", streakInfo.badgeColor)}>
                  {streakInfo.tierName}
                </Badge>
              </div>
              <DialogTitle className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welcome Back! Daily Study Streak
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-2 sm:line-clamp-none">
                Log in every day to reinforce memory retention, maintain your streak, and claim compounding study XP.
              </DialogDescription>
            </div>

            {/* Streak Counter Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-sm shrink-0 self-start sm:self-center">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground leading-none">Streak</p>
                <p className="text-xs sm:text-base font-black text-foreground leading-tight">
                  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Completely Fits Without Horizontal Scroll */}
        <div className="p-3 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-4 overflow-x-hidden">
          {/* Motivation Banner */}
          <div className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
              <p className="text-foreground/90 font-medium text-[11px] sm:text-xs truncate">
                {streakInfo.motivation}
              </p>
            </div>
            <span className="font-semibold text-muted-foreground whitespace-nowrap text-[10px] sm:text-[11px] self-end sm:self-auto">
              Cycle: <strong className="text-primary">Day {cycleDay} of 7</strong>
            </span>
          </div>

          {/* 7-Day Rewards Grid: 2-col on Mobile, 4-col on Tablet, 7-col on Web */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                7-Day Reward Roadmap
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                {hasClaimedToday ? '✓ Completed Today' : '🎁 Ready to Claim'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2.5">
              {statusData.cycleRewards.map((item, idx) => {
                const IconComponent = ICONS[idx] || Zap;
                const isToday = item.day === cycleDay;
                const isClaimed = item.status === 'claimed' || (isToday && hasClaimedToday);
                const isAvailable = item.status === 'available' && !isClaimed;
                const isLocked = item.status === 'locked' && !isClaimed;

                return (
                  <div
                    key={item.day}
                    className={cn(
                      "relative rounded-xl p-2 sm:p-3 flex flex-col items-center justify-between text-center transition-all duration-150 border min-w-0 overflow-hidden",
                      isToday && isAvailable && "border-2 border-primary bg-primary/10 ring-1 ring-primary/25 shadow-sm",
                      isToday && isClaimed && "border-emerald-500/40 bg-emerald-500/5",
                      !isToday && isClaimed && "border-border/80 bg-muted/25 opacity-90",
                      isLocked && "border-border/50 bg-muted/15 opacity-60",
                      item.isMilestone && !isClaimed && "col-span-2 sm:col-span-1 border-amber-500/40 bg-amber-500/5"
                    )}
                  >
                    {/* Day Title & Top Status */}
                    <div className="w-full flex items-center justify-between gap-1 mb-1">
                      <span className={cn(
                        "text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider truncate",
                        isToday ? "text-primary font-black" : "text-muted-foreground"
                      )}>
                        {item.title}
                      </span>
                      {isClaimed ? (
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
                      ) : isLocked ? (
                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/70 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>

                    {/* Icon Container */}
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 shadow-sm transition-transform shrink-0",
                      isToday && isAvailable && "bg-primary text-white shadow-sm",
                      isClaimed && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                      isLocked && "bg-muted text-muted-foreground",
                      item.isMilestone && isAvailable && "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                    )}>
                      <IconComponent className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>

                    {/* Reward XP & Subtitle */}
                    <div className="space-y-0.5 mb-1 min-w-0 w-full">
                      <p className={cn(
                        "text-xs sm:text-base font-black tracking-tight leading-none truncate",
                        isToday && isAvailable ? "text-primary" : isClaimed ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      )}>
                        +{item.xp} <span className="text-[8.5px] sm:text-[9px] font-bold text-muted-foreground">XP</span>
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium truncate max-w-full" title={item.subtitle}>
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="w-full mt-0.5">
                      {isClaimed ? (
                        <span className="block w-full py-0.5 text-[8px] sm:text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md border border-emerald-500/20 truncate">
                          Claimed
                        </span>
                      ) : isToday && isAvailable ? (
                        <span className="block w-full py-0.5 text-[8px] sm:text-[8.5px] font-bold text-primary bg-primary/10 rounded-md border border-primary/20 truncate">
                          Ready Today
                        </span>
                      ) : item.isMilestone ? (
                        <span className="block w-full py-0.5 text-[8px] sm:text-[8.5px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md border border-amber-500/20 truncate">
                          Grand Chest
                        </span>
                      ) : (
                        <span className="block w-full py-0.5 text-[8px] sm:text-[8.5px] font-medium text-muted-foreground bg-muted/50 rounded-md truncate">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="p-2.5 sm:p-3.5 rounded-xl border border-border/90 bg-muted/25 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="text-[11px] sm:text-xs">
                <span className="text-muted-foreground">Reset in: </span>
                <span className="font-mono font-bold text-primary">{countdown || '--:--:--'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!hasClaimedToday ? (
                <Button
                  onClick={handleClaimReward}
                  disabled={claiming}
                  className="w-full sm:w-auto h-8 sm:h-10 px-4 sm:px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <Gift className="w-3.5 h-3.5 fill-current" />
                  {claiming ? 'Recording...' : `Claim Day ${cycleDay} (+${todayReward?.xp || 50} XP)`}
                </Button>
              ) : (
                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto h-8 sm:h-10 px-4 sm:px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Continue to Study
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
