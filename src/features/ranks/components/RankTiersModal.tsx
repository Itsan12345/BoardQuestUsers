import { Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { renderRankIcon } from '../utils';
import type { RankTier } from '../types';

interface RankTiersModalProps {
  rankTiers: RankTier[];
  userLevel?: number;
}

export function RankTiersModal({ rankTiers, userLevel = 1 }: RankTiersModalProps) {
  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-amber-500 rounded-full hover:bg-amber-500/10 transition-all duration-300 px-3 sm:px-4 h-8 sm:h-9 text-[10px] sm:text-xs font-bold tracking-wide uppercase group"
          >
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
          <div className="p-6 sm:p-8 bg-background max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {rankTiers.map((tier) => {
                const isCurrentTier =
                  userLevel >= (tier.minLevel || 1) &&
                  (tier.maxLevel == null || userLevel <= tier.maxLevel);
                const levelRange =
                  tier.maxLevel != null
                    ? `Levels ${tier.minLevel}-${tier.maxLevel}`
                    : `Levels ${tier.minLevel}+`;
                const tierColor = tier.color || (isCurrentTier ? '#F59E0B' : '#3B82F6');

                return (
                  <Card
                    key={tier.rankId || tier.id || tier.title}
                    className={`border shadow-sm transition-all duration-300 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-2 sm:gap-3 group relative overflow-hidden ${
                      isCurrentTier
                        ? 'border-amber-500/80 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent ring-2 ring-amber-500/30 shadow-lg'
                        : 'border-border/60 bg-card/40 hover:bg-muted/30 hover:border-border'
                    }`}
                  >
                    {isCurrentTier && (
                      <div className="absolute top-2.5 right-2.5">
                        <Badge className="bg-amber-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                          CURRENT
                        </Badge>
                      </div>
                    )}
                    <div
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-inner"
                      style={{
                        backgroundColor: `${tierColor}1A`,
                        color: tierColor,
                      }}
                    >
                      {renderRankIcon(tier.icon || '', 'w-5 h-5 sm:w-7 sm:h-7')}
                    </div>
                    <div className="space-y-1">
                      <h4
                        className="font-extrabold text-xs sm:text-sm leading-tight"
                        style={{ color: isCurrentTier ? tierColor : undefined }}
                      >
                        {tier.title || tier.name}
                      </h4>
                      {tier.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {tier.description}
                        </p>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 mt-1 inline-block"
                        style={
                          isCurrentTier
                            ? {
                                borderColor: `${tierColor}40`,
                                backgroundColor: `${tierColor}15`,
                                color: tierColor,
                              }
                            : undefined
                        }
                      >
                        {levelRange}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

