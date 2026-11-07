"use client";

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';

interface HomeLeaderboardCardProps {
  leaderboard: Array<{ name: string; xp: number }>;
  userRank: number | null;
}

export const HomeLeaderboardCard: React.FC<HomeLeaderboardCardProps> = ({
  leaderboard,
  userRank,
}) => {
  return (
    <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <p
            className="text-base sm:text-lg font-medium text-foreground"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Weekly Leaderboard
          </p>
          <p
            className="text-[11px] sm:text-xs font-normal text-muted-foreground"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {userRank
              ? `You placed ${userRank}${
                  ["th", "st", "nd", "rd"][((userRank % 100) - 20) % 10] ||
                  ["th", "st", "nd", "rd"][userRank % 100] ||
                  "th"
                } this week`
              : "No ranking this week"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 lg:p-8">
        <div className="space-y-3 sm:space-y-4">
          {leaderboard.map((u, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 sm:gap-4 pb-3 sm:pb-4 last:pb-0 border-b border-border last:border-b-0 min-w-0"
            >
              <div className="flex-shrink-0">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span
                    className="font-semibold text-primary text-[10px] sm:text-xs"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    #{idx + 1}
                  </span>
                </div>
              </div>
              <Avatar className="h-9 w-9 sm:h-12 sm:w-12 bg-primary/20 border-2 border-primary/10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-[10px] sm:text-xs font-medium">
                  {u.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs sm:text-sm font-medium text-foreground truncate"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {u.name}
                </p>
                <p
                  className="text-[10px] sm:text-xs font-normal text-muted-foreground truncate"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {u.xp.toLocaleString()} XP
                </p>
              </div>
              {idx === 0 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

