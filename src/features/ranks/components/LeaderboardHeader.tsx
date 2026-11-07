import { Trophy } from 'lucide-react';

export function LeaderboardHeader() {
  return (
    <header className="text-center space-y-2 sm:space-y-3 flex flex-col items-center">
      <div className="bg-gradient-to-tr from-amber-500/20 via-primary/20 to-red-500/10 border border-primary/20 w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-inner group hover:scale-105 transition-transform duration-300">
        <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-primary drop-shadow-sm" />
      </div>
      <h1 className="text-2xl sm:text-4xl font-extrabold font-headline tracking-tight text-foreground">
        Global Hall of Fame
      </h1>
    </header>
  );
}

