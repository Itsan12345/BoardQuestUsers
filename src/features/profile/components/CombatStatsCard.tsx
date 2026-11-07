import Image from 'next/image';
import { Swords, Heart, Shield, Crosshair, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculatePlayerStats } from '@/lib/game-logic';
import type { UserProfile } from '../types';

interface CombatStatsCardProps {
  userProfile: UserProfile;
}

export function CombatStatsCard({ userProfile }: CombatStatsCardProps) {
  const localEquipped =
    typeof window !== 'undefined'
      ? localStorage.getItem('boardquest_equipped_reagent')
      : null;
  const activeEquippedItem =
    userProfile.equippedItem && userProfile.equippedItem !== 'none'
      ? userProfile.equippedItem
      : localEquipped;
  const stats = calculatePlayerStats(
    userProfile.level,
    userProfile.streak,
    activeEquippedItem
  );

  return (
    <Card className="border border-border shadow-md rounded-2xl bg-card overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          Combat Attributes
        </CardTitle>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-primary border-primary/30 px-2 py-0.5"
        >
          LVL {userProfile.level}
        </Badge>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-1 space-y-3">
        {/* Stat Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Health Points (HP) */}
          <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/20" />
              <span className="text-xs font-medium text-muted-foreground">Health</span>
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
              {stats.maxHp} HP
            </span>
          </div>

          {/* Attack Damage (ATK) */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">Damage</span>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {stats.totalDamage} DMG
            </span>
          </div>

          {/* Defense (Armor) */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-medium text-muted-foreground">Defense</span>
            </div>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
              {stats.defense} DEF
            </span>
          </div>

          {/* Precision / Crit Rate */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">Crit Rate</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {stats.critRate}%
            </span>
          </div>
        </div>

        {/* Multiplier & Equipped Gear Row */}
        <div className="flex items-center justify-between pt-1.5 text-xs border-t border-border/50">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
            <span className="text-[11px]">
              Boost: <strong className="text-foreground">{stats.multiplier}x</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            {stats.equippedItemImageUrl ? (
              <Image
                src={stats.equippedItemImageUrl}
                alt={stats.equippedItemName}
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
                style={{ imageRendering: 'pixelated' }}
                unoptimized
              />
            ) : (
              <span>{stats.equippedItemIcon}</span>
            )}
            <span className="truncate max-w-[130px]" title={stats.equippedItemName}>
              {stats.equippedItemName}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

