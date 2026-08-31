"use client";

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Award,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats, getGlobalLeaderboard } from '@/app/actions/user';
import { getRankTitle } from '@/lib/badge-system';
import Link from 'next/link';

function LeaderboardContent() {
  const [user, setUser] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const limit = 10;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [stats, leadersData] = await Promise.all([
        getUserStats(),
        getGlobalLeaderboard(page, limit)
      ]);
      setUser(stats);
      setTopUsers(leadersData.topUsers || []);
      setTotalUsers(leadersData.totalUsers || 0);
      setCurrentUserRank(leadersData.currentUserRank || null);
      setLoading(false);
    }
    loadData();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const tableElement = document.getElementById('tour-ranks-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <Trophy className="w-6 h-6 text-primary absolute animate-pulse" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground animate-pulse">Loading Leaderboard Standings...</p>
      </div>
    );
  }

  const isUserOnCurrentPage = user && topUsers.some(u => u.id === user.id);
  const totalPages = Math.ceil(totalUsers / limit) || 1;
  const userRankTitle = user ? getRankTitle(user.level || 1) : 'Apprentice Technician';
  const fullLevelTitle = `Level ${user?.level || 1} ${userRankTitle}`;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6 sm:space-y-8 relative">

      {/* Minimal Info Button - Very Top Right of Page */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-amber-500 rounded-full hover:bg-amber-500/10 transition-all duration-300 px-3 sm:px-4 h-8 sm:h-9 text-[10px] sm:text-xs font-bold tracking-wide uppercase group">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-pulse" />
              <span className="hidden sm:inline">View Rank Tiers</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl bg-card border-border/80 shadow-2xl rounded-[2rem] p-0 overflow-hidden">
            <div className="p-6 sm:p-8 bg-muted/20 border-b border-border/50 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-tr-full pointer-events-none"></div>
              <DialogHeader className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <Crown className="w-8 h-8 text-primary drop-shadow-sm" />
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-extrabold font-headline text-center">
                  Aspirant Rank Progression
                </DialogTitle>
                <DialogDescription className="text-center text-sm sm:text-base font-medium">
                  Earn XP from quests and daily logins to climb the ranks. Will you reach Grandmaster?
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 sm:p-8 bg-background">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                {/* Rank 1 */}
                <Card className="border border-border/60 shadow-sm bg-card/40 hover:bg-muted/30 hover:border-border transition-all duration-300 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-2 sm:gap-3 group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500 mb-1 group-hover:scale-110 transition-transform">
                    <Award className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground leading-tight">Apprentice Technician</h4>
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground border-border/50 px-2 py-0.5 mt-1 inline-block">Levels 1-9</Badge>
                  </div>
                </Card>

                {/* Rank 2 */}
                <Card className="border border-border/60 shadow-sm bg-card/40 hover:bg-muted/30 hover:border-blue-500/30 transition-all duration-300 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-2 sm:gap-3 group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-1 group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground leading-tight">Adept Analyst</h4>
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5 px-2 py-0.5 mt-1 inline-block">Levels 10-24</Badge>
                  </div>
                </Card>

                {/* Rank 3 */}
                <Card className="border border-border/60 shadow-sm bg-card/40 hover:bg-muted/30 hover:border-purple-500/30 transition-all duration-300 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-2 sm:gap-3 group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 mb-1 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground leading-tight">Senior Scientist</h4>
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/5 px-2 py-0.5 mt-1 inline-block">Levels 25-49</Badge>
                  </div>
                </Card>

                {/* Rank 4 */}
                <Card className="border border-amber-500/20 shadow-sm bg-gradient-to-b from-amber-500/10 to-transparent hover:from-amber-500/20 hover:border-amber-500/40 transition-all duration-300 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-2 sm:gap-3 group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-1 group-hover:scale-110 transition-transform shadow-inner">
                    <Crown className="w-5 h-5 sm:w-7 sm:h-7 drop-shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs sm:text-sm text-amber-700 dark:text-amber-500 leading-tight">Grandmaster Pathologist</h4>
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase font-black text-amber-700 dark:text-amber-500 border-amber-500/30 bg-amber-500/10 px-2 py-0.5 mt-1 inline-block">Levels 50+</Badge>
                  </div>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Header Banner */}
      <header className="text-center space-y-2 sm:space-y-3 flex flex-col items-center">
        <div className="bg-gradient-to-tr from-amber-500/20 via-primary/20 to-red-500/10 border border-primary/20 w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-inner group hover:scale-105 transition-transform duration-300">
          <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-primary drop-shadow-sm" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-headline tracking-tight text-foreground">
          Global Hall of Fame
        </h1>
      </header>

      {/* 0 XP / Unranked Banner for First-Time Users */}
      {user && (user.xp === 0 || !user.xp) && (
        <Card className="border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">
                    Unranked Aspirant
                  </h4>
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5">
                    0 XP
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  You haven't claimed any XP yet! Claim your Daily Login reward or complete a quest in the Quest Arena to enter the global rankings and showcase your position.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button asChild size="sm" className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 shadow-sm font-semibold">
                <Link href="/">
                  Claim Daily Login <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Top Overview Cards */}
      <div id="tour-ranks-overview" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Expedition Level Card */}
        <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-sm p-4 sm:p-6 text-center space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="bg-amber-500/10 text-amber-500 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <Medal className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Expedition Level
          </p>
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Lvl {user?.level || 1}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-normal leading-tight">
              {fullLevelTitle}
            </p>
          </div>
        </Card>

        {/* Total XP Card */}
        <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-sm p-4 sm:p-6 text-center space-y-2 relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none"></div>
          <div className="bg-primary/10 text-primary w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <Star className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total XP
          </p>
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {user?.xp?.toLocaleString() || 0}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              XP Points Earned
            </p>
          </div>
        </Card>

        {/* Daily Streak Card */}
        <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-sm p-4 sm:p-6 text-center space-y-2 relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="bg-rose-500/10 text-rose-500 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Streak
          </p>
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {user?.streak || 0} Days
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Daily Active Streak
            </p>
          </div>
        </Card>
      </div>

      {/* Regional Leaderboard Table */}
      <Card id="tour-ranks-table" className="border border-border/80 shadow-xl overflow-hidden rounded-2xl sm:rounded-3xl bg-card">
        <CardHeader className="p-4 sm:p-6 bg-muted/20 border-b flex flex-row items-center justify-between gap-2.5 sm:gap-4">
          <div>
            <CardTitle className="text-base sm:text-xl font-headline font-bold">Regional Rankings</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary border-primary/30 whitespace-nowrap shrink-0">
            {user?.xp > 0 && currentUserRank ? `Ranked #${currentUserRank} on Leaderboard` : 'Unranked Aspirant'}
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
                const isCurrentUser = user && u.id === user.id;

                const rankColors = {
                  1: 'text-amber-500',
                  2: 'text-slate-400',
                  3: 'text-amber-700',
                };
                const rankColor = rankColors[rank as keyof typeof rankColors] || 'text-muted-foreground';

                const borderColors = {
                  1: 'border-amber-400 ring-2 ring-amber-400/30',
                  2: 'border-slate-400',
                  3: 'border-amber-700',
                };
                const borderColor = borderColors[rank as keyof typeof borderColors] || 'border-border';

                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-2.5 sm:gap-4 lg:gap-6 p-3.5 sm:p-5 transition-all duration-200 min-w-0 ${isCurrentUser
                      ? 'bg-primary/10 dark:bg-primary/15 border-l-4 border-l-primary'
                      : 'hover:bg-muted/30'
                      }`}
                  >
                    {/* Rank Indicator */}
                    <div className={`w-7 sm:w-10 flex justify-center items-center font-black font-headline text-sm sm:text-xl shrink-0 ${rankColor}`}>
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
                    <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 border-2 shadow-sm shrink-0 ${borderColor}`}>
                      <AvatarFallback className={isCurrentUser ? 'bg-primary text-white text-xs sm:text-sm font-bold' : 'bg-muted text-muted-foreground text-xs sm:text-sm font-semibold'}>
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
                        <span className="truncate">Level {u.level} {getRankTitle(u.level)}</span>
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2 sm:pt-4 gap-2">
        <Button
          variant="outline"
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-full px-3 sm:px-5 text-xs sm:text-sm h-9 sm:h-10 hover:bg-primary/5 hover:text-primary transition-colors shrink-0 gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <div className="flex items-center gap-1 sm:gap-2 bg-muted/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border/50 text-center truncate shadow-xs">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            Page <span className="text-foreground font-bold">{page}</span> of <span className="text-foreground font-bold">{totalPages}</span>
          </span>
        </div>

        <Button
          variant="outline"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-full px-3 sm:px-5 text-xs sm:text-sm h-9 sm:h-10 hover:bg-primary/5 hover:text-primary transition-colors shrink-0 gap-1"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <LeaderboardContent />
    </ProtectedRoute>
  );
}
