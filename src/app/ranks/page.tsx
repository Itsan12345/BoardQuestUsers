
"use client";

import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats, getGlobalLeaderboard } from '@/app/actions/user';
import { getRankTitle } from '@/lib/badge-system';

function LeaderboardContent() {
  const [user, setUser] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [stats, leadersData] = await Promise.all([
        getUserStats(),
        getGlobalLeaderboard(page, limit)
      ]);
      setUser(stats);
      setTopUsers(leadersData.topUsers);
      setTotalUsers(leadersData.totalUsers);
      setLoading(false);
    }
    loadData();
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <header className="text-center space-y-2">
        <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline">Global Hall of Fame</h1>
        <p className="text-muted-foreground">Top aspirants preparing for the MedTech Licensure Examination.</p>
      </header>

      <div id="tour-ranks-overview" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-border shadow-md bg-background p-6 text-center space-y-2">
          <Medal className="w-8 h-8 text-yellow-500 mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase">Expedition Level</p>
          <h3 className="text-3xl font-semibold">Lvl {user?.level || 1}</h3>
        </Card>
        <Card className="border border-border shadow-md bg-background p-6 text-center space-y-2">
          <Star className="w-8 h-8 text-primary mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase">Total XP</p>
          <h3 className="text-3xl font-semibold">{user?.xp?.toLocaleString() || 0}</h3>
        </Card>
        <Card className="border border-border shadow-md bg-background p-6 text-center space-y-2">
          <TrendingUp className="w-8 h-8 text-accent mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase">Streak</p>
          <h3 className="text-3xl font-semibold">{user?.streak || 0} Days</h3>
        </Card>
      </div>

      <Card id="tour-ranks-table" className="border border-border shadow-xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-headline">Regional Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {topUsers.map((u, idx) => {
              const rank = (page - 1) * limit + idx + 1;
              const isTop3 = rank <= 3;
              const rankColors = {
                1: 'text-yellow-500',
                2: 'text-slate-400',
                3: 'text-amber-600',
              };
              const rankColor = rankColors[rank as keyof typeof rankColors] || 'text-muted-foreground';
              const borderColors = {
                1: 'border-yellow-500',
                2: 'border-slate-400',
                3: 'border-amber-600',
              };
              const borderColor = borderColors[rank as keyof typeof borderColors] || 'border-border';

              return (
                <div key={u.id} className={`flex items-center gap-6 p-6 transition-all duration-300 ${u.id === user?.id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  <div className={`w-10 flex justify-center items-center font-bold font-headline text-xl ${rankColor}`}>
                    {rank === 1 ? <Trophy className="w-7 h-7" /> : 
                     rank === 2 ? <Medal className="w-7 h-7" /> : 
                     rank === 3 ? <Medal className="w-7 h-7" /> : rank}
                  </div>
                  <Avatar className={`h-14 w-14 border-2 shadow-sm ${borderColor}`}>
                    <AvatarFallback className={u.id === user?.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-lg tracking-tight">{u.name}</p>
                      {u.id === user?.id && <Badge className="bg-primary hover:bg-primary/90 text-[10px] h-5 px-2 rounded-full shadow-sm">You</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 inline-block"></span>
                      Level {u.level} {getRankTitle(u.level)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-2xl tracking-tight">{u.xp.toLocaleString()}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-full px-6 hover:bg-primary/5 hover:text-primary transition-colors"
        >
          Previous
        </Button>
        <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full border border-border/50">
          <span className="text-sm font-medium text-muted-foreground">
            Page <span className="text-foreground font-bold">{page}</span> of <span className="text-foreground font-bold">{Math.ceil(totalUsers / limit) || 1}</span>
          </span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setPage(p => p + 1)}
          disabled={page >= Math.ceil(totalUsers / limit)}
          className="rounded-full px-6 hover:bg-primary/5 hover:text-primary transition-colors"
        >
          Next
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
