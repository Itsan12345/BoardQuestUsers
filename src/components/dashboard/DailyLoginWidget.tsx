"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  Gift,
  Check
} from 'lucide-react';
import {
  type DailyLoginStatusData,
  getStreakTierInfo,
} from '@/lib/daily-login-config';
import { DailyLoginRewardModal } from '@/components/dashboard/DailyLoginRewardModal';
import { cn } from '@/lib/utils';

interface DailyLoginWidgetProps {
  statusData: DailyLoginStatusData | null;
  onRefresh?: () => void;
  onOpenModal?: () => void;
}

export function DailyLoginWidget({
  statusData,
  onRefresh,
  onOpenModal,
}: DailyLoginWidgetProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  if (!statusData) return null;

  const currentStreak = statusData.currentStreak || 0;
  const cycleDay = statusData.currentCycleDay || 1;
  const hasClaimedToday = statusData.hasClaimedToday;
  const todayReward = statusData.todayReward;
  const streakInfo = getStreakTierInfo(currentStreak);

  return (
    <>
      <Card
        id="tour-dashboard-daily-login"
        className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden"
      >
        <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border flex flex-row items-center justify-between">
          <p
            className="text-xs sm:text-sm font-medium text-primary uppercase tracking-widest"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Daily Login
          </p>
          <Badge
            className={cn(
              "text-[10px] font-bold px-2 py-0.5",
              hasClaimedToday
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-primary text-primary-foreground"
            )}
          >
            {hasClaimedToday ? `✓ Day ${cycleDay} Claimed` : `+${todayReward?.xp || 50} XP Ready`}
          </Badge>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-3.5">
          {/* Streak Overview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'} Streak
                </p>
                <p className="text-[10.5px] text-muted-foreground">
                  {streakInfo.tierName} • Cycle Day {cycleDay}/7
                </p>
              </div>
            </div>

            <span className="text-[11px] text-muted-foreground font-medium">
              +{todayReward?.xp || 50} XP Today
            </span>
          </div>

          {/* 7-Day Mini Track */}
          <div className="grid grid-cols-7 gap-1">
            {statusData.cycleRewards.map((item) => {
              const isToday = item.day === cycleDay;
              const isClaimed = item.status === 'claimed';
              const isAvailable = item.status === 'available';
              const isLocked = item.status === 'locked';

              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={handleOpenModal}
                  className={cn(
                    "rounded-lg py-1 px-0.5 flex flex-col items-center justify-between text-center transition-colors border",
                    isToday && isAvailable && "border-primary bg-primary/10",
                    isToday && isClaimed && "border-emerald-500/40 bg-emerald-500/10",
                    !isToday && isClaimed && "border-emerald-500/20 bg-muted/40",
                    isLocked && "border-border/40 bg-muted/20 opacity-50",
                    item.isMilestone && !isClaimed && "border-amber-500/30 bg-amber-500/5"
                  )}
                  title={`Day ${item.day}: +${item.xp} XP`}
                >
                  <span className={cn(
                    "text-[8.5px] font-bold uppercase",
                    isToday ? "text-primary font-extrabold" : "text-muted-foreground"
                  )}>
                    D{item.day}
                  </span>

                  <div className="my-0.5 flex items-center justify-center h-3.5">
                    {isClaimed ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : isToday && isAvailable ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 text-muted-foreground/60" />
                    )}
                  </div>

                  <span className={cn(
                    "text-[8px] font-semibold truncate leading-none",
                    isToday && isAvailable ? "text-primary" : isClaimed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}>
                    +{item.xp}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action CTA */}
          <div className="pt-0.5">
            {!hasClaimedToday ? (
              <Button
                size="sm"
                onClick={handleOpenModal}
                className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Check className="w-3.5 h-3.5" />
                Claim Day {cycleDay} (+{todayReward?.xp || 50} XP)
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenModal}
                className="w-full h-9 rounded-xl border-border hover:bg-muted text-xs font-normal text-muted-foreground flex items-center justify-between px-3"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Attendance Recorded
                </span>
                <span className="text-[11px] text-primary flex items-center font-medium">
                  View 7-Day Track <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Internal Modal if not using external controller */}
      {!onOpenModal && (
        <DailyLoginRewardModal
          open={internalModalOpen}
          onOpenChange={setInternalModalOpen}
          statusData={statusData}
          onRewardClaimed={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
