"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { getLocalTodayDateString } from '@/lib/notifications';

interface DailyTargetMeterCardProps {
  user: any;
  dailyQuota: number;
}

export const DailyTargetMeterCard: React.FC<DailyTargetMeterCardProps> = ({
  user,
  dailyQuota,
}) => {
  const localToday = getLocalTodayDateString();
  let localQuestQuestions = 0;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bq_today_quest_date');
      localStorage.removeItem('bq_today_questions_count');
      if (user?.id) {
        const savedQuestDate = localStorage.getItem(`bq_today_date_${user.id}`);
        if (savedQuestDate === localToday) {
          localQuestQuestions = parseInt(
            localStorage.getItem(`bq_today_questions_${user.id}`) || '0',
            10
          );
        }
      }
    }
  } catch {
    // safe fallback
  }

  const todayDone = Math.max(user?.todayQuestions || 0, localQuestQuestions);
  const percent = Math.min(100, Math.round((todayDone / (dailyQuota || 1)) * 100));

  return (
    <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
      <CardHeader className="p-4 sm:p-5 xl:p-6 pb-3 border-b border-border flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className="text-xs xl:text-sm font-medium text-primary uppercase tracking-wider xl:tracking-widest truncate"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Daily Target
          </p>
          <Link href="/profile?openSettings=true&tab=goals">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
              title="Edit Daily Goals"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shrink-0 whitespace-nowrap">
          {todayDone} / {dailyQuota} Qs
        </Badge>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 xl:p-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Today's Progress</span>
          <span className="font-semibold text-foreground">{percent}% Completed</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/60">
          <div
            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {percent >= 100
            ? '🎉 Daily question goal achieved! Excellent discipline.'
            : `${Math.max(0, dailyQuota - todayDone)} questions remaining to hit today's study target.`}
        </p>
      </CardContent>
    </Card>
  );
};

