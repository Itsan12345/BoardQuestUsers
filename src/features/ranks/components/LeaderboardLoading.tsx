import { Trophy } from 'lucide-react';

export function LeaderboardLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <Trophy className="w-6 h-6 text-primary absolute animate-pulse" />
      </div>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground animate-pulse">
        Loading Leaderboard Standings...
      </p>
    </div>
  );
}

