import { Medal, Star, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LeaderboardOverviewCardsProps {
  level: number;
  rankTitle: string;
  xp: number;
  streak: number;
}

export function LeaderboardOverviewCards({
  level,
  rankTitle,
  xp,
  streak,
}: LeaderboardOverviewCardsProps) {
  return (
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
            Lvl {level}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-normal leading-tight">
            {rankTitle}
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
            {xp.toLocaleString()}
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
            {streak} Days
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Daily Active Streak
          </p>
        </div>
      </Card>
    </div>
  );
}

