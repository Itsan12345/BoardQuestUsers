import { Award, Lock, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BadgeDefinition } from '../types';

interface AllBadgesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredBadges: BadgeDefinition[];
  earnedBadgeCodes: Set<string>;
  totalBadgesCount: number;
  earnedCount: number;
  badgeFilter: 'all' | 'earned' | 'locked';
  onFilterChange: (filter: 'all' | 'earned' | 'locked') => void;
}

export function AllBadgesDialog({
  open,
  onOpenChange,
  filteredBadges,
  earnedBadgeCodes,
  totalBadgesCount,
  earnedCount,
  badgeFilter,
  onFilterChange,
}: AllBadgesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pr-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-primary/10 border border-primary/20 rounded-xl sm:rounded-2xl shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground">
                  Hall of Achievements
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  Complete quests and maintain daily review streaks to unlock exclusive accolades.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-1">
                {earnedCount} / {totalBadgesCount} Unlocked
              </Badge>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-3">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                badgeFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              All ({totalBadgesCount})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('earned')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                badgeFilter === 'earned'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Unlocked ({earnedCount})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('locked')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                badgeFilter === 'locked'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Locked ({totalBadgesCount - earnedCount})
            </button>
          </div>
        </DialogHeader>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
          {filteredBadges.map((badge) => {
            const isEarned =
              earnedBadgeCodes.has(badge.id.toLowerCase()) ||
              (badge.id === 'speed' && earnedBadgeCodes.has('swift-solver'));

            return (
              <div
                key={badge.id}
                className={cn(
                  'relative rounded-2xl border-2 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all duration-200 overflow-hidden',
                  isEarned
                    ? 'bg-card border-border shadow-xs hover:border-primary/50'
                    : 'bg-muted/30 border-border/60 opacity-60 grayscale hover:opacity-80 transition-opacity'
                )}
              >
                {/* Badge Sprite Icon Container */}
                <div
                  className={cn(
                    'w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl p-2 flex items-center justify-center border-2 shadow-sm relative overflow-hidden bg-gradient-to-b',
                    badge.bgGradient,
                    badge.borderColor
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={badge.sprite}
                    alt={badge.title}
                    className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {!isEarned && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                      <Lock className="w-5 h-5 text-white/80" />
                    </div>
                  )}
                </div>

                {/* Badge Meta Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                      {badge.title}
                    </h4>
                    {isEarned ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0 font-bold shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Unlocked
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[9px] text-muted-foreground border-border px-1.5 py-0 font-semibold shrink-0 flex items-center gap-1"
                      >
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                    {badge.description || badge.unlockCondition}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                    {badge.xpReward && (
                      <span className="font-bold text-primary">+{badge.xpReward} XP</span>
                    )}
                    {badge.unlockCondition && (
                      <span className="text-muted-foreground/80 truncate font-medium">
                        • {badge.unlockCondition}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

