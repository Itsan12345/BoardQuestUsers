import { Trophy, Medal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getRankTitle } from '@/lib/badge-system';
import type { LeaderboardUser, RankTier } from '../types';

interface LeaderboardTableProps {
  topUsers: LeaderboardUser[];
  currentUserId?: string;
  currentUserXp?: number;
  currentUserRank: number | null;
  rankTiers: RankTier[];
  page: number;
  limit: number;
}

export function LeaderboardTable({
  topUsers,
  currentUserId,
  currentUserXp = 0,
  currentUserRank,
  rankTiers,
  page,
  limit,
}: LeaderboardTableProps) {
  const isRanked = currentUserXp > 0 && currentUserRank;

  return (
    <Card
      id="tour-ranks-table"
      className="border border-border/80 shadow-xl overflow-hidden rounded-2xl sm:rounded-3xl bg-card"
    >
      <CardHeader className="p-4 sm:p-6 bg-muted/20 border-b flex flex-row items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <CardTitle className="text-base sm:text-xl font-headline font-bold">
            Regional Rankings
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary border-primary/30 whitespace-nowrap shrink-0"
        >
          {isRanked ? `Ranked #${currentUserRank} on Leaderboard` : 'Unranked Aspirant'}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {topUsers.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-foreground">No Ranked Aspirants Yet</h4>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Be the first aspirant to claim daily login XP or complete a quest to top the regional leaderboard!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {topUsers.map((u, idx) => {
              const rank = (page - 1) * limit + idx + 1;
              const isCurrentUser = currentUserId && u.id === currentUserId;

              const rankColors = {
                1: 'text-amber-500',
                2: 'text-slate-400',
                3: 'text-amber-700',
              };
              const rankColor =
                rankColors[rank as keyof typeof rankColors] || 'text-muted-foreground';

              const borderColors = {
                1: 'border-amber-400 ring-2 ring-amber-400/30',
                2: 'border-slate-400',
                3: 'border-amber-700',
              };
              const borderColor =
                borderColors[rank as keyof typeof borderColors] || 'border-border';

              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-2.5 sm:gap-4 lg:gap-6 p-3.5 sm:p-5 transition-all duration-200 min-w-0 ${
                    isCurrentUser
                      ? 'bg-primary/10 dark:bg-primary/15 border-l-4 border-l-primary'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Rank Indicator */}
                  <div
                    className={`w-7 sm:w-10 flex justify-center items-center font-black font-headline text-sm sm:text-xl shrink-0 ${rankColor}`}
                  >
                    {rank === 1 ? (
                      <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 drop-shadow-sm" />
                    ) : rank === 2 ? (
                      <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-slate-400" />
                    ) : rank === 3 ? (
                      <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-amber-700" />
                    ) : (
                      `#${rank}`
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar
                    className={`h-10 w-10 sm:h-12 sm:w-12 border-2 shadow-sm shrink-0 ${borderColor}`}
                  >
                    <AvatarFallback
                      className={
                        isCurrentUser
                          ? 'bg-primary text-white text-xs sm:text-sm font-bold'
                          : 'bg-muted text-muted-foreground text-xs sm:text-sm font-semibold'
                      }
                    >
                      {u.name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2.5 mb-0.5 min-w-0">
                      <p className="font-bold text-xs sm:text-base text-foreground tracking-tight truncate">
                        {u.name}
                      </p>
                      {isCurrentUser && (
                        <Badge className="bg-primary hover:bg-primary/90 text-white text-[9px] sm:text-[10px] h-4 sm:h-5 px-2 rounded-full shadow-sm shrink-0 font-bold">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block shrink-0"></span>
                      <span className="truncate">
                        Level {u.level} {getRankTitle(u.level, rankTiers)}
                      </span>
                    </p>
                  </div>

                  {/* XP Score */}
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-primary text-base sm:text-xl lg:text-2xl tracking-tight">
                      {u.xp?.toLocaleString()}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Total XP
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

