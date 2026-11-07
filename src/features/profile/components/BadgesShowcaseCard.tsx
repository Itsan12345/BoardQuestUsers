import { Award, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BADGE_SPRITE_DEFINITIONS } from '../utils';
import type { UserProfile, UserBadgeDetails } from '../types';

interface BadgesShowcaseCardProps {
  userProfile: UserProfile;
  dbUserBadges: UserBadgeDetails[];
  onOpenViewAll: () => void;
}

export function BadgesShowcaseCard({
  userProfile,
  dbUserBadges,
  onOpenViewAll,
}: BadgesShowcaseCardProps) {
  const earnedBadgeMap = new Map<string, any>();

  // 1. From UserBadge collection (Admin dynamic MongoDB schema)
  dbUserBadges.forEach((ub) => {
    const def = BADGE_SPRITE_DEFINITIONS[ub.badgeSlug] || {};
    earnedBadgeMap.set(ub.badgeSlug, {
      id: ub.badgeSlug,
      title: ub.title || def.title || ub.badgeSlug,
      name: ub.name || 'Quest Badge',
      sprite: ub.spriteUrl || def.sprite || '/ui/gold-badge.png',
      bgGradient: def.bgGradient || 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
      borderColor: def.borderColor || 'border-[#E67E22]',
      xpReward: ub.xpEarned || ub.xpReward || 50,
    });
  });

  // 2. From achievements fallback if any badge is logged
  userProfile.achievements?.forEach((a) => {
    if (a.badge && !earnedBadgeMap.has(a.badge)) {
      const def = BADGE_SPRITE_DEFINITIONS[a.badge] || {
        title: a.badge,
        sprite: '/ui/gold-badge.png',
        bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
        borderColor: 'border-[#E67E22]',
      };
      earnedBadgeMap.set(a.badge, {
        id: a.badge,
        title: def.title,
        name: a.task || def.title,
        sprite: def.sprite,
        bgGradient: def.bgGradient,
        borderColor: def.borderColor,
        xpReward: a.xp || 50,
      });
    }
  });

  const earnedBadgesList = Array.from(earnedBadgeMap.values());
  const lockedCount = Math.max(0, 8 - earnedBadgesList.length);

  return (
    <Card
      id="tour-profile-badges"
      className="border border-border shadow-lg rounded-2xl overflow-hidden bg-background"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <CardTitle className="text-xl font-bold text-foreground">
              Achievements
            </CardTitle>
          </div>
          <button
            type="button"
            onClick={onOpenViewAll}
            className="text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
          >
            View ALL
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-medium mt-1">
          Badges earned through your BoardQuest journey.
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-2 sm:pt-2 pb-4 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          {earnedBadgesList.map((badge, idx) => (
            <div
              key={idx}
              className={cn(
                'relative aspect-[0.95/1] rounded-[18px] sm:rounded-[22px] p-2.5 sm:p-3 flex flex-col items-center justify-between border-2 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden group bg-gradient-to-b animate-in fade-in zoom-in duration-300',
                badge.bgGradient,
                badge.borderColor
              )}
              title={badge.title}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none" />

              <div className="flex-1 flex items-center justify-center w-full pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badge.sprite}
                  alt={badge.title}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform duration-200"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <span
                className="font-bytebounce text-white text-[10px] sm:text-sm md:text-base tracking-wide text-center leading-none mb-0.5"
                style={{
                  textShadow:
                    '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {badge.title}
              </span>
            </div>
          ))}

          {[...Array(lockedCount)].map((_, i) => (
            <div
              key={`locked-${i}`}
              className="aspect-[0.95/1] rounded-[18px] sm:rounded-[22px] bg-muted/40 border-2 border-border/50 flex items-center justify-center p-3 sm:p-4"
            >
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary/40 stroke-[2.2]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

