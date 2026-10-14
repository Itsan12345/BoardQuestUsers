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
      <DialogContent className="!max-w-4xl lg:!max-w-5xl w-[94vw] sm:w-[92vw] md:w-[90vw] max-h-[92vh] overflow-y-auto sm:overflow-hidden p-0 border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl sm:rounded-3xl gap-0">
        {/* Compact, Refined Header - Exact Web Layout, Proportional on Mobile */}
        <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-border/80 bg-gradient-to-r from-muted/40 via-background to-muted/20 pr-11 sm:pr-14">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-wider">
                  Daily Attendance & Licensure Streak
                </span>
                <Badge variant="outline" className={cn("text-[7.5px] sm:text-[9px] font-semibold px-1.5 py-0 border leading-tight h-4", streakInfo.badgeColor)}>
                  {streakInfo.tierName}
                </Badge>
              </div>
              <DialogTitle className="text-xs sm:text-lg lg:text-xl font-bold tracking-tight text-foreground leading-tight truncate sm:whitespace-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welcome Back! Daily Study Streak
              </DialogTitle>
              <DialogDescription className="text-[9.5px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">
                Log in every day to reinforce memory retention, maintain your streak, and claim compounding study XP.
              </DialogDescription>
            </div>

            {/* Streak Counter Pill - Sits neatly on right, scaled down on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-sm shrink-0">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-[7.5px] sm:text-[9px] font-bold uppercase tracking-wider text-muted-foreground leading-none">Streak</p>
                <p className="text-[11px] sm:text-sm lg:text-base font-black text-foreground leading-tight whitespace-nowrap">
                  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Compact & 100% Fits Screen */}
        <div className="p-2 sm:p-4 lg:p-6 space-y-2.5 sm:space-y-4 overflow-x-hidden">
          {/* Motivation Banner - Single Row on All Screen Sizes */}
          <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" />
              <p className="text-foreground/90 font-medium text-[8.5px] sm:text-xs truncate">
                {streakInfo.motivation}
              </p>
            </div>
            <span className="font-semibold text-muted-foreground whitespace-nowrap text-[8px] sm:text-[11px] shrink-0">
              <span className="sm:hidden">Day <strong className="text-primary">{cycleDay}/7</strong></span>
              <span className="hidden sm:inline">Cycle: <strong className="text-primary">Day {cycleDay} of 7</strong></span>
            </span>
          </div>

          {/* 7-Day Rewards: Square Boxes with a Little Radius (Un-cramped & Identical) */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[8.5px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                7-Day Reward Roadmap
              </span>
              <span className="text-[8.5px] sm:text-[11px] font-medium text-muted-foreground">
                {hasClaimedToday ? '✓ Completed Today' : '🎁 Ready to Claim'}
              </span>
            </div>

            {/* Square Roadmap Grid: Balanced Proportions & Clean Text Spacing */}
            <div className="overflow-x-auto no-scrollbar pb-0.5">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-2.5 min-w-[310px] sm:min-w-0">
                {statusData.cycleRewards.map((item, idx) => {
                  const IconComponent = ICONS[idx] || Zap;
                  const isToday = item.day === cycleDay;
                  const isClaimed = item.status === 'claimed' || (isToday && hasClaimedToday);
                  const isAvailable = item.status === 'available' && !isClaimed;
                  const isLocked = item.status === 'locked' && !isClaimed;

                  return (
                    <div
                      key={item.day}
                      title={`${item.title}: +${item.xp} XP - ${item.subtitle}`}
                      className={cn(
                        "relative aspect-[1/1.22] sm:aspect-square rounded-[6px] sm:rounded-[8px] p-1 sm:p-2 flex flex-col items-center justify-between text-center transition-all duration-150 border min-w-0 overflow-hidden select-none",
                        isToday && isAvailable && "border-2 border-primary bg-primary/10 ring-1 ring-primary/25 shadow-sm",
                        isToday && isClaimed && "border-emerald-500/40 bg-emerald-500/5",
                        !isToday && isClaimed && "border-border/80 bg-muted/25 opacity-90",
                        isLocked && "border-border/50 bg-muted/15 opacity-60",
                        item.isMilestone && !isClaimed && "border-amber-500/40 bg-amber-500/5"
                      )}
                    >
                      {/* Day Title & Top Status */}
                      <div className="w-full flex items-center justify-between gap-0.5 leading-none px-0.5">
                        <span className={cn(
                          "text-[7.5px] sm:text-[9.5px] font-bold tracking-tight truncate",
                          isToday ? "text-primary font-black" : "text-muted-foreground"
                        )}>
                          Day {item.day}
                        </span>
                        {isClaimed ? (
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
                        ) : isLocked ? (
                          <Lock className="w-2 h-2 sm:w-3 sm:h-3 text-muted-foreground/60 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                      </div>

                      {/* Center: Square Icon Container with Little Radius */}
                      <div className={cn(
                        "w-5 h-5 sm:w-8 sm:h-8 rounded-[4px] sm:rounded-[6px] flex items-center justify-center transition-transform shrink-0 my-auto",
                        isToday && isAvailable && "bg-primary text-white shadow-xs",
                        isClaimed && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        isLocked && "bg-muted/70 text-muted-foreground/70",
                        item.isMilestone && isAvailable && "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
                        item.isMilestone && !isAvailable && !isClaimed && "bg-amber-500/15 text-amber-500"
                      )}>
                        <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>

                      {/* Reward XP */}
                      <div className="leading-none text-center">
                        <p className={cn(
                          "text-[8px] sm:text-xs font-black tracking-tight leading-none",
                          isToday && isAvailable ? "text-primary" : isClaimed ? "text-emerald-600 dark:text-emerald-400" : item.isMilestone ? "text-amber-500" : "text-foreground"
                        )}>
                          +{item.xp}<span className="text-[6.5px] sm:text-[8.5px] font-bold text-muted-foreground ml-0.5">XP</span>
                        </p>
                      </div>

                      {/* Bottom Status Tag */}
                      <div className="w-full px-0.5">
                        {isClaimed ? (
                          <span className="block w-full py-0.5 text-[6.5px] sm:text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-[3px] sm:rounded-[4px] border border-emerald-500/20 truncate leading-none">
                            Claimed
                          </span>
                        ) : isToday && isAvailable ? (
                          <span className="block w-full py-0.5 text-[6.5px] sm:text-[8px] font-bold text-primary bg-primary/10 rounded-[3px] sm:rounded-[4px] border border-primary/20 truncate leading-none animate-pulse">
                            Ready
                          </span>
                        ) : item.isMilestone ? (
                          <span className="block w-full py-0.5 text-[6.5px] sm:text-[8px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-[3px] sm:rounded-[4px] border border-amber-500/20 truncate leading-none">
                            Chest
                          </span>
                        ) : (
                          <span className="block w-full py-0.5 text-[6.5px] sm:text-[8px] font-medium text-muted-foreground/80 bg-muted/40 rounded-[3px] sm:rounded-[4px] truncate leading-none">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row - Single Row on All Screen Sizes */}
          <div className="p-2 sm:p-3 rounded-xl border border-border/90 bg-muted/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <div className="text-[10px] sm:text-xs truncate">
                <span className="text-muted-foreground">Reset in: </span>
                <span className="font-mono font-bold text-primary">{countdown || '--:--:--'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!hasClaimedToday ? (
                <Button
                  onClick={handleClaimReward}
                  disabled={claiming}
                  className="h-7 sm:h-9 px-2.5 sm:px-5 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-[10px] sm:text-xs shadow-sm transition-all flex items-center justify-center gap-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                  {claiming ? 'Recording...' : `Claim Day ${cycleDay} (+${todayReward?.xp || 50} XP)`}
                </Button>
              ) : (
                <Button
                  onClick={() => onOpenChange(false)}
                  className="h-7 sm:h-9 px-2.5 sm:px-5 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-[10px] sm:text-xs shadow-sm flex items-center justify-center gap-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Continue to Study
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
